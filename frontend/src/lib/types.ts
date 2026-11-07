export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: number;
  is_active: boolean;
};
export type User = { id: number; name: string; email: string };
export type Order = {
  id: number;
  status: "pending" | "paid" | "cancelled";
  currency: string;
  total: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    unit_price: string;
    quantity: number;
    subtotal: string;
  }[];
};
export type Page<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
};
export type Auth = {
  data: { user: User; access_token: string; expires_in: number };
};
export type ActionState = {
  error?: string;
  fields?: Record<string, string[]>;
  orderId?: number;
  clientSecret?: string;
};
