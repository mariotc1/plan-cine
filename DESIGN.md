# Plan Cine — Diseño Completo de Arquitectura

## 1. ARQUITECTURA GENERAL

```
[Usuario Mobile PWA]
        │
        ▼
[Next.js 15 - Vercel]
  App Router + TypeScript
  TailwindCSS + shadcn/ui
  Framer Motion + next-pwa
        │
        │ HTTPS REST API
        ▼
[Laravel 12 - Render]
  API REST + Sanctum
  Clean Architecture + DDD
        │
        ▼
[PostgreSQL - Render]
```

## 2. ENTIDADES Y RELACIONES

### User
- id (UUID)
- name
- email (unique)
- password (hashed)
- avatar (emoji, default 🎬)
- color (hex, default #6366f1)
- email_verified_at
- created_at / updated_at

### Group
- id (UUID)
- name
- description (nullable)
- invitation_code (unique, 8 chars)
- created_by → User
- created_at / updated_at

### GroupMember (pivot)
- id (UUID)
- group_id → Group
- user_id → User
- role (admin | member)
- joined_at
- UNIQUE(group_id, user_id)

### Movie
- id (UUID)
- group_id → Group
- title
- duration_minutes (INTEGER)
- platform (netflix | prime | disney | hbo | movistar | apple | other)
- genre (action | comedy | drama | thriller | horror | sci-fi | romance | animation | documentary | other)
- added_by → User
- notes (nullable)
- status (pending | in_session | watched)
- created_at / updated_at

### CinemaSession
- id (UUID)
- group_id → Group
- movie_id → Movie
- started_at (TIMESTAMP nullable)
- estimated_end_at (TIMESTAMP nullable)
- actual_end_at (TIMESTAMP nullable)
- status (pending | in_progress | finished | cancelled)
- created_by → User
- created_at / updated_at

### SessionParticipant (pivot)
- id (UUID)
- session_id → CinemaSession
- user_id → User
- UNIQUE(session_id, user_id)

### Rating
- id (UUID)
- session_id → CinemaSession
- user_id → User
- score (SMALLINT 1-5)
- created_at / updated_at
- UNIQUE(session_id, user_id)

### PushSubscription
- id (UUID)
- user_id → User
- endpoint (TEXT)
- p256dh (TEXT)
- auth (TEXT)
- created_at

## 3. ESQUEMA POSTGRESQL

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(20) DEFAULT '🎬',
  color VARCHAR(7) DEFAULT '#6366f1',
  email_verified_at TIMESTAMP,
  remember_token VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  invitation_code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  platform VARCHAR(50) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cinema_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  started_at TIMESTAMP,
  estimated_end_at TIMESTAMP,
  actual_end_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES cinema_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(session_id, user_id)
);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES cinema_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score SMALLINT CHECK (score BETWEEN 1 AND 5) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 4. ENDPOINTS REST

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Usuario actual |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /api/users/profile | Actualizar perfil |
| GET | /api/users/stats | Estadísticas personales |
| GET | /api/users/badges | Insignias del usuario |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups | Listar grupos del usuario |
| POST | /api/groups | Crear grupo |
| GET | /api/groups/{id} | Detalle del grupo |
| PUT | /api/groups/{id} | Actualizar grupo |
| DELETE | /api/groups/{id} | Eliminar grupo |
| POST | /api/groups/join/{code} | Unirse por código |
| DELETE | /api/groups/{id}/leave | Salir del grupo |
| GET | /api/groups/{id}/members | Miembros del grupo |
| GET | /api/groups/{id}/stats | Estadísticas del grupo |
| GET | /api/groups/{id}/memories | Recuerdos |

### Movies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups/{gid}/movies | Películas (query: status, platform, genre, max_duration) |
| POST | /api/groups/{gid}/movies | Añadir película |
| GET | /api/groups/{gid}/movies/{id} | Detalle película |
| PUT | /api/groups/{gid}/movies/{id} | Editar película |
| DELETE | /api/groups/{gid}/movies/{id} | Eliminar película |
| GET | /api/groups/{gid}/movies/random | Película aleatoria |

### Cinema Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/groups/{gid}/sessions | Sesiones |
| POST | /api/groups/{gid}/sessions | Crear sesión |
| GET | /api/groups/{gid}/sessions/{id} | Detalle sesión |
| POST | /api/groups/{gid}/sessions/{id}/start | Iniciar sesión |
| POST | /api/groups/{gid}/sessions/{id}/finish | Finalizar sesión |
| POST | /api/groups/{gid}/sessions/{id}/cancel | Cancelar sesión |
| POST | /api/groups/{gid}/sessions/{id}/return | Devolver a pendientes |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sessions/{id}/ratings | Valorar película |
| PUT | /api/sessions/{id}/ratings | Actualizar valoración |

### Push Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/push/subscribe | Suscribir dispositivo |
| DELETE | /api/push/unsubscribe | Desuscribir dispositivo |

## 5. ESTRUCTURA DE CARPETAS

### Backend (Laravel 12)
```
backend/
├── app/
│   ├── Domain/
│   │   ├── Auth/
│   │   ├── Group/
│   │   ├── Movie/
│   │   └── Session/
│   ├── Application/
│   │   ├── Auth/Commands|Handlers
│   │   ├── Group/Commands|Queries|Handlers
│   │   ├── Movie/Commands|Queries|Handlers
│   │   └── Session/Commands|Queries|Handlers
│   ├── Infrastructure/
│   │   ├── Persistence/Eloquent/
│   │   └── Notifications/WebPush
│   └── Http/
│       ├── Controllers/Api/
│       ├── Requests/
│       ├── Resources/
│       └── Middleware/
├── database/migrations/
└── routes/api.php
```

### Frontend (Next.js 15)
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login|register
│   │   ├── (app)/
│   │   │   ├── groups/
│   │   │   │   └── [groupId]/
│   │   │   │       ├── page.tsx (movies)
│   │   │   │       ├── spin/
│   │   │   │       ├── sessions/
│   │   │   │       ├── stats/
│   │   │   │       └── memories/
│   │   │   ├── profile/
│   │   │   └── join/[code]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── movies/
│   │   ├── sessions/
│   │   ├── spin/
│   │   ├── stats/
│   │   └── shared/
│   ├── hooks/
│   ├── lib/api/
│   ├── stores/ (zustand)
│   └── types/
```

## 6. FLUJO DE USUARIO

1. Onboarding → Registro con nombre, email, password, avatar, color
2. Home → Lista de grupos del usuario
3. Crear Grupo o Unirse por enlace
4. Dentro del Grupo → Tab: Pendientes | Rueda | Sesiones | Stats
5. Añadir película → Sheet deslizable desde abajo
6. Rueda → Animación de selección → Opciones: Ver / Otra
7. Ver Película → Seleccionar participantes → Iniciar sesión
8. Notificación push al finalizar → Valorar película
9. Historial → Sesiones finalizadas con valoraciones
10. Estadísticas → Personales y de grupo
11. Recuerdos → Pellículas de hace exactamente 1, 2, 3 años

## 7. SISTEMA DE NOTIFICACIONES

- Web Push API (VAPID)
- Backend: laravel-notification-channels/webpush
- Frontend: service worker registra suscripción
- Al iniciar sesión: schedule notification at estimated_end_at
- Si no valoró en 30min: segundo recordatorio
- Payload: { title, body, icon, badge, data: { sessionId } }

## 8. SISTEMA DE ESTADÍSTICAS

### Personales
- COUNT sessions WHERE user participó → películas vistas
- COUNT movies WHERE added_by = user → películas añadidas
- AVG(score) WHERE user_id = user → nota media
- GROUP BY genre, COUNT → género favorito
- GROUP BY platform, COUNT → plataforma favorita
- SUM(duration_minutes) / 60 → horas acumuladas

### Grupo
- User con más movies added → más propone
- User con AVG(score) más bajo → más exigente
- User con AVG(score) más alto → más generoso
- Plataforma más frecuente en sesiones
- Genre más frecuente
- Session con mayor AVG(rating)
- COUNT(sessions finished)
- SUM(duration_minutes) / 60

## 9. DECISIONES DE ARQUITECTURA

### ¿Por qué UUIDs?
Evitan enumeración de recursos, mejor para sistemas distribuidos.

### ¿Por qué Sanctum y no JWT?
Sanctum es el estándar oficial de Laravel para SPA/mobile. Simple, mantenible.

### ¿Por qué Zustand y no Redux?
Mucho más simple para este tipo de aplicación. Redux sería sobreingeniería.

### ¿Por qué no usar TMDB API?
El usuario quiere añadir películas manualmente (como la lista de WhatsApp). Integrar TMDB es una mejora futura opcional.

### Dark Mode
TailwindCSS con class strategy. Sistema siempre en dark mode por defecto (estética premium).
