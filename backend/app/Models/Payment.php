<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['provider', 'provider_payment_id', 'status', 'amount_cents', 'currency', 'failure_message', 'metadata'];

    protected function casts(): array
    {
        return ['amount_cents' => 'integer', 'metadata' => 'array'];
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
