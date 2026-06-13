<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Rating extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'ratings';

    protected $fillable = ['session_id', 'user_id', 'score'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function session()
    {
        return $this->belongsTo(CinemaSession::class, 'session_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
