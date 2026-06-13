<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class CinemaSession extends Model
{
    use HasFactory;

    protected $table = 'cinema_sessions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'group_id', 'movie_id', 'started_at', 'estimated_end_at',
        'actual_end_at', 'status', 'created_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'estimated_end_at' => 'datetime',
        'actual_end_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants()
    {
        return $this->belongsToMany(User::class, 'session_participants', 'session_id', 'user_id');
    }

    public function ratings()
    {
        return $this->hasMany(Rating::class, 'session_id');
    }

    public function getAverageRatingAttribute(): ?float
    {
        if ($this->ratings->isEmpty()) return null;
        return round($this->ratings->avg('score'), 1);
    }
}
