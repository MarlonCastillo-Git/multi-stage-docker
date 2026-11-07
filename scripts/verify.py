#!/usr/bin/env python3
"""Integration test against real containers. Creates a test account/order.
--recreate removes/recreates containers, never volumes. Uses only Python stdlib.
"""
import argparse
import html
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import subprocess
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[1]


def compose(*args):
    return subprocess.check_output(['docker', 'compose', *args], cwd=ROOT, text=True)


def check(value, message):
    if not value:
        raise AssertionError(message)
    print('PASS:', message, flush=True)


class HiddenInputs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'input' and attrs.get('type') == 'hidden' and attrs.get('name'):
            self.fields[attrs['name']] = attrs.get('value', '')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recreate', action='store_true')
    args = parser.parse_args()
    # Read only local port settings; never emit environment or credentials.
    env = {}
    for line in (ROOT / '.env').read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            key, value = line.split('=', 1)
            env[key] = value.strip().strip('"').strip("'")
    front = 'http://localhost:' + env.get('FRONTEND_PORT', '3000')
    api = 'http://localhost:' + env.get('BACKEND_PORT', '8000')
    jar = http.cookiejar.CookieJar()
    client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    def fetch(url, body=None, token=None, form=False):
        headers = {'Accept': 'text/html' if form or url.startswith(front) else 'application/json'}
        payload = None
        if body is not None:
            if form:
                boundary = 'DockerVerify' + secrets.token_hex(12)
                payload = ''.join(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n' for key, value in body.items()).encode() + f'--{boundary}--\r\n'.encode()
                headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
            else:
                payload = json.dumps(body).encode()
                headers['Content-Type'] = 'application/json'
            if form:
                headers.update({'Origin': front, 'Referer': url})
        if token:
            headers['Authorization'] = 'Bearer ' + token
        with client.open(urllib.request.Request(url, data=payload, headers=headers), timeout=30) as response:
            text = response.read().decode()
            return json.loads(text) if 'application/json' in response.headers.get('Content-Type', '') else text

    check(fetch(api + '/health')['database'] == 'connected', 'Laravel conecta con MySQL')
    products = fetch(api + '/api/v1/products')['data']
    product = next(p for p in products if p['stock'] > 0)
    catalog = fetch(front + '/catalogo')
    check(html.escape(product['name']) in catalog, 'Next muestra el producto real obtenido de Laravel/MySQL')
    # Submit the actual server-rendered Next registration form, including React's
    # hidden action metadata. This exercises Next -> Laravel -> MySQL writes.
    hidden = HiddenInputs()
    hidden.feed(fetch(front + '/registro'))
    check(any(k.startswith('$ACTION') for k in hidden.fields), 'Formulario real de registro de Next disponible')
    email = 'docker-' + secrets.token_hex(6) + '@example.test'
    password = secrets.token_hex(16)
    hidden.fields.update(name='Prueba Docker', email=email, password=password, password_confirmation=password)
    fetch(front + '/registro', hidden.fields, form=True)
    check(any(c.name == 'ecommerce_session' for c in jar), 'Registro mediante Next crea sesión JWT')
    credentials = {'email': email, 'password': password}
    auth = fetch(api + '/api/v1/auth/login', credentials)['data']
    token = auth['access_token']
    user_id = int(auth['user']['id'])
    order = fetch(api + '/api/v1/orders', {'items': [{'product_id': product['id'], 'quantity': 1}]}, token)['data']
    order_id = int(order['id'])
    check(Decimal(order['total']) == Decimal(product['price']), 'Orden calcula el total correcto')
    stock = fetch(api + '/api/v1/products/' + str(product['id']))['data']['stock']
    check(stock == product['stock'] - 1, 'Orden descuenta existencias en MySQL')

    def verify_saved():
        fresh = fetch(api + '/api/v1/auth/login', credentials)['data']['access_token']
        saved = fetch(api + '/api/v1/orders/' + str(order_id), token=fresh)['data']
        check(saved['id'] == order_id and saved['total'] == order['total'], 'Usuario y orden siguen disponibles por API')
        history = fetch(front + '/pedidos')
        check(('Orden #' + str(order_id)) in history or ('Orden #<!-- -->' + str(order_id)) in history, 'Next muestra el pedido persistido en Mis compras')
        # Numeric identifiers only; password stays inside the container environment.
        sql = f'SELECT COUNT(*) FROM orders WHERE id={order_id} AND user_id={user_id};'
        result = compose('exec', '-T', 'mysql', 'sh', '-c', 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -N -u "$MYSQL_USER" "$MYSQL_DATABASE" -e "$1"', 'verify', sql)
        check(result.strip() == '1', 'Consulta SQL confirma el pedido en MySQL')

    verify_saved()
    if args.recreate:
        before = compose('ps', '-q').split()
        print('Recreando contenedores; se conserva mysql_data...', flush=True)
        compose('down')
        compose('up', '-d', '--wait', '--wait-timeout', '240')
        after = compose('ps', '-q').split()
        check(len(after) == 3 and set(before).isdisjoint(after), 'Los tres contenedores fueron reemplazados')
        verify_saved()
        new_stock = fetch(api + '/api/v1/products/' + str(product['id']))['data']['stock']
        check(new_stock == stock, 'El reinicio conserva el stock; el seeder no lo restablece')
    print(f'VERIFICACIÓN COMPLETA: orden #{order_id}. Stripe no se prueba.', flush=True)


if __name__ == '__main__':
    main()
