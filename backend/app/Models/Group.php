<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Group extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['name', 'avatar', 'description', 'invitation_code', 'created_by'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($model) => $model->id ??= (string) Str::uuid());
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members', 'group_id', 'user_id')
            ->withPivot('role', 'joined_at');
    }

    public function movies()
    {
        return $this->hasMany(Movie::class);
    }

    public function sessions()
    {
        return $this->hasMany(CinemaSession::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
