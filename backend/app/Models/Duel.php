<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Duel extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['group_id', 'movie_a_id', 'movie_b_id', 'winner_id', 'created_by', 'status'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function movieA()
    {
        return $this->belongsTo(Movie::class, 'movie_a_id');
    }

    public function movieB()
    {
        return $this->belongsTo(Movie::class, 'movie_b_id');
    }

    public function winner()
    {
        return $this->belongsTo(Movie::class, 'winner_id');
    }

    public function votes()
    {
        return $this->hasMany(DuelVote::class);
    }
}
