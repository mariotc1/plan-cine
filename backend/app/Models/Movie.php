<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Movie extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'group_id', 'title', 'duration_minutes', 'platform',
        'genre', 'added_by', 'notes', 'status', 'tmdb_id', 'poster_path',
    ];

    protected $appends = ['duration_formatted'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function getDurationFormattedAttribute(): string
    {
        $minutes = $this->duration_minutes;
        if ($minutes < 60) {
            return "{$minutes}min";
        }
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;
        return $m > 0 ? "{$h}h {$m}min" : "{$h}h";
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function sessions()
    {
        return $this->hasMany(CinemaSession::class);
    }
}
