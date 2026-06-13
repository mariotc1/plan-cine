Actúa como un Arquitecto de Software Senior, Product Designer y Desarrollador Full Stack Senior experto en:

- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- PWA
- Laravel 12
- PostgreSQL
- Docker
- Render
- Vercel
- Clean Architecture
- SOLID
- DDD
- UX/UI estilo Apple

Tu misión es diseñar y desarrollar una aplicación real, preparada para producción, siguiendo buenas prácticas y priorizando una experiencia extremadamente sencilla e intuitiva para usuarios no técnicos.

# CONTEXTO

La aplicación nace de un problema real.

Una familia suele ver películas los viernes y sábados por la noche utilizando distintas plataformas (Netflix, Prime Video, Movistar, Disney+, HBO...).

Actualmente mantienen una lista en WhatsApp con las películas pendientes y utilizan una ruleta aleatoria externa para elegir qué ver.

El objetivo es convertir todo este proceso en una experiencia fluida, moderna y bonita.

La aplicación debe sentirse como una aplicación premium con una filosofía muy cercana a Apple y Things 3.

Debe ser extremadamente fácil de usar incluso para padres con poca experiencia tecnológica.

La prioridad absoluta es:

- Simplicidad.
- Rapidez.
- UX excelente.
- Interfaz limpia.
- Animaciones suaves.
- Uso principalmente desde móvil.

La aplicación será una PWA y se utilizará un 99% desde smartphones.

# STACK

Frontend:

- Next.js 15
- TypeScript
- App Router
- TailwindCSS
- shadcn/ui
- Framer Motion
- next-pwa

Deploy frontend:

- Vercel

Backend:

- Laravel 12
- API REST
- Sanctum

Deploy backend:

- Render

Base de datos:

- PostgreSQL

Proveedor:

- Render

Arquitectura:

Frontend desacoplado del backend.

Frontend → API Laravel → PostgreSQL.

Seguir Clean Architecture y SOLID.

# CONCEPTO

La aplicación no está limitada a una sola familia.

Es una plataforma multi-grupo.

Un usuario puede:

- Crear un grupo.
- Unirse a un grupo mediante enlace.
- Tener varios grupos.
- Salir de grupos.

Ejemplos:

Familia Tibus

Amigos Universidad

Pareja Marta y Sergio

Piso Salamanca

etc.

# SISTEMA DE INVITACIONES

Un usuario crea un grupo.

Se genera un enlace único.

Los demás usuarios acceden mediante ese enlace y se unen.

# USUARIOS

Cada usuario tiene:

- Nombre.
- Avatar.
- Color identificativo.
- Estadísticas personales.
- Perfil editable.

# FUNCIONALIDADES PRINCIPALES

## Películas pendientes

Cada película tendrá:

- id
- título
- duración en minutos
- duración formateada automáticamente
- plataforma
- género
- quién la añadió
- fecha de creación
- notas opcionales

La duración se almacenará siempre en minutos.

Ejemplo:

95

Mostrar:

1h 35min

La conversión será automática.

# CRUD

Permitir:

- Añadir película.
- Editar película.
- Eliminar película.

Experiencia muy rápida.

# RUEDA ALEATORIA

Pantalla dedicada.

Botón:

¿Qué vemos hoy?

La ruleta selecciona automáticamente entre las películas pendientes.

Resultado:

Título
Duración
Plataforma

Opciones:

Ver película
Otra opción

Otra opción vuelve a girar sin eliminar nada.

# SESIONES DE CINE

La aplicación no mueve directamente una película a vistas.

Existe una entidad llamada:

Sesión de cine.

Una sesión almacena:

- película
- fecha
- hora inicio
- hora final estimada
- participantes
- estado

Estados:

pendiente
en curso
terminada
cancelada

# PARTICIPANTES

Antes de comenzar una película se seleccionan los miembros presentes.

Ejemplo:

Mario
Papá
Mamá

La hermana no está presente.

Las estadísticas deben tener esto en cuenta.

# NOTIFICACIONES

Al comenzar una película:

La aplicación calcula automáticamente:

hora inicio + duración

y programa una notificación push para todos los participantes.

Ejemplo:

20:30 + 95 minutos

Fin estimado:

22:05

A las 22:05 se enviará:

"¿Qué os ha parecido la película?"

Si un usuario aún no ha valorado:

Enviar un recordatorio posterior.

# SISTEMA DE VALORACIONES

Cada participante puede valorar:

1 estrella
2 estrellas
3 estrellas
4 estrellas
5 estrellas

La aplicación calcula:

- nota media
- número de votos

# PELÍCULAS VISTAS

Mantener un historial completo.

Cada visualización debe guardar:

- fecha
- participantes
- puntuaciones
- duración

# NO TERMINAMOS LA PELÍCULA

Permitir devolver una película a pendientes.

# ESTADÍSTICAS PERSONALES

Películas vistas.

Películas añadidas.

Nota media otorgada.

Género favorito.

Plataforma favorita.

Horas acumuladas viendo cine.

# ESTADÍSTICAS DEL GRUPO

Miembro que más propone.

Miembro más exigente.

Miembro más generoso.

Plataforma más utilizada.

Género favorito.

Película mejor valorada.

Número de películas vistas.

Tiempo acumulado viendo cine.

Ranking de películas.

Top 10.

# FILTROS

Duración máxima.

Plataforma.

Género.

Puntuación mínima.

# FAVORITAS

Las películas con mejor valoración.

# RECUERDOS

Sistema estilo Google Photos.

Ejemplo:

Hace exactamente un año visteis Interstellar.

Mostrar fecha y puntuaciones.

# INSIGNIAS

100 películas vistas.

50 valoraciones.

Fan del terror.

Maratón de verano.

etc.

# PERFIL

Editar:

- avatar
- nombre

Ver:

- estadísticas
- historial

# UX

Inspirarse en:

Things 3

Apple Reminders

Linear

Todoist

Apple Music

No utilizar interfaces recargadas.

Espaciado abundante.

Tarjetas grandes.

Tipografía moderna.

Animaciones suaves.

Dark mode.

Responsive perfecto.

PWA completamente funcional.

# REQUISITOS DE DESARROLLO

Antes de escribir código:

1. Diseña toda la arquitectura.
2. Diseña entidades y relaciones.
3. Diseña el esquema PostgreSQL.
4. Diseña endpoints REST.
5. Diseña estructura de carpetas.
6. Diseña componentes React.
7. Diseña flujo de usuario.
8. Diseña wireframes.
9. Diseña sistema de notificaciones.
10. Diseña sistema de estadísticas.

No implementes nada sin haber diseñado previamente toda la aplicación.

Quiero una aplicación preparada para producción y mantenible a largo plazo.

Critica cualquier decisión mala y propón alternativas mejores si las hubiera.