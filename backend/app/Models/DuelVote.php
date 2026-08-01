<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DuelVote extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['duel_id', 'user_id', 'movie_id'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function duel()
    {
        return $this->belongsTo(Duel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}
