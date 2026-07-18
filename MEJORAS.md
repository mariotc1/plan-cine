# Plan Cine — Roadmap de Mejoras

> Metodología de trabajo: completamos una fase, tú pruebas la app en el emulador,
> iteramos si hay problemas, y solo entonces pasamos a la siguiente fase.
> Yo aviso siempre qué archivos toqué al terminar cada bloque.

---

## Estado de partida (ya implementado ✅)

- [x] Accent color por grupo
- [x] Portadas de películas via TMDB
- [x] Trailer de películas via TMDB
- [x] Sesiones (iniciar / terminar / cancelar / reprogramar)
- [x] Notificaciones push
- [x] PWA manifest + service worker
- [x] Sistema de valoraciones con estrellas
- [x] Stats de grupo y personales
- [x] Memories / recuerdos
- [x] Ruleta aleatoria con animación SVG
- [x] TMDB search al añadir película
- [x] Share card de película

---

## FASE 1 — Bugs críticos y estabilidad ✅ COMPLETADA

> Empezamos aquí siempre. Un bug de fondo puede contaminar todo lo que construyamos encima.

### 1.1 Error Boundaries — pantalla blanca en producción ✅
- **Archivos creados:**
  - `src/app/error.tsx` — catch-all con botón "Intentar de nuevo"
  - `src/app/global-error.tsx` — fallback cuando falla el root layout (incluye `<html>` + `<body>`)
  - `src/app/not-found.tsx` — 404 con botón de volver al inicio
  - `src/app/(app)/error.tsx` — error boundary para rutas autenticadas, con botón de volver a grupos
- **Probar:** Navegar a `/ruta-inexistente` → debe aparecer UI de 404. Forzar error en una página → debe aparecer UI de error con botón de reintento.

### 1.2 Validación de token en mount ✅
- **Cambios:**
  - `src/lib/api.ts` — el interceptor 401 ahora también borra `plan-cine-auth` (Zustand) además de `auth_token`. Antes solo borraba el token raw, dejando `isAuthenticated: true` en el store → bucle de redirect.
  - `src/app/(app)/layout.tsx` — llama `authApi.me()` una sola vez al montar. Si falla, llama `logout()` del store + redirect a `/login`.
- **Probar:** En DevTools > Application > Local Storage, editar el valor de `auth_token` a algo inválido. Recargar. Debe redirigir a `/login` sin bucle.

### 1.3 QR via servicio externo → local ✅
- **Cambios:**
  - Instalado `qrcode.react`
  - `src/app/(app)/groups/[groupId]/layout.tsx` — reemplazado `<img src="api.qrserver.com/...">` por `<QRCodeSVG value={joinUrl} size={200} bgColor="#ffffff" fgColor="#09090b" level="H" />`
- **Probar:** Abrir settings de un grupo → "Ver código QR". En DevTools > Network, no debe aparecer ninguna request a `api.qrserver.com`. El QR debe renderizarse instantáneamente.

### 1.4 Service Worker — caché API sin expiración ✅
- **Cambios:**
  - `public/sw.js` — el fetch handler ahora salta peticiones cross-origin y same-origin `/api/`. Solo cachea assets del frontend (HTML, JS, CSS, imágenes).
  - `src/hooks/useAuth.ts` — al hacer logout, borra todas las cachés del SW con `caches.keys()` + `caches.delete()`.
- **Probar:** DevTools > Application > Cache Storage. Hacer logout → la caché debe vaciarse. Relogarse → las peticiones de películas deben ir a red, no a caché.

### 1.5 Notificación push → URL directa a la sesión ⚠️ FIX EN BACKEND
- **Estado:** El frontend (SW) ya está correcto. El `notificationclick` handler lee `e.notification.data.url` y navega correctamente.
- **Fix pendiente en Laravel:** El payload de la notificación debe incluir:
  ```json
  { "url": "/groups/{groupId}/sessions/{sessionId}" }
  ```
  en el campo `data` del web push. Verificar en la clase de notificación de Laravel.

---

## FASE 2 — Gestos e interacciones nativas (Apple feel) ✅ COMPLETADA

> El mayor salto perceptivo de la app. Pasar de "tap-only" a gestos fluidos.

### 2.1 Pull-to-dismiss en todos los sheets ✅
- **Problema:** Los sheets se cierran solo con el botón X. En iOS, el gesto muscular es drag-down para cerrar.
- **Fix:** Framer Motion `drag="y"` en el contenedor del sheet. Si el drag supera 120px → cerrar con spring animation.
- **Archivos a tocar:** Todos los Sheet components:
  - `src/components/movies/AddMovieSheet.tsx`
  - `src/components/movies/MovieDetailSheet.tsx`
  - `src/components/sessions/StartSessionSheet.tsx`
  - `src/components/sessions/ScheduleSessionSheet.tsx`
  - `src/components/sessions/RescheduleSheet.tsx`
  - `src/components/sessions/ShareCardSheet.tsx`
  - `src/components/sessions/ConfirmSheet.tsx`
  - Posiblemente extraer a un `<BottomSheet>` wrapper reutilizable
- **Qué probar:** Abrir cualquier sheet → arrastrar hacia abajo → debe cerrarse fluidamente. Si arrastras poco y sueltas, debe volver a su posición (spring back).

### 2.2 Swipe-to-delete en MovieCard
- **Problema:** Para eliminar una película hay que entrar al detalle y buscar el botón. En iOS el gesto natural es swipe izquierda → revelar acción eliminar.
- **Fix:** Framer Motion `drag="x"` en MovieCard con `dragConstraints`. Al llegar a threshold: revelar botón rojo "Eliminar" con confirmación inline.
- **Archivos a tocar:**
  - `src/components/movies/MovieCard.tsx`
- **Qué probar:** En la lista de películas, swipe a la izquierda sobre una card → aparece botón rojo → pulsar → película desaparece con animación. Swipe suave y soltar → card vuelve sola.

### 2.3 Long press → context menu en MovieCard
- **Problema:** Acciones secundarias (editar, marcar favorita, ver detalle) están enterradas. Long press es el patrón iOS para acciones contextuales.
- **Fix:** Detectar long press (500ms `pointerdown` sin `pointerup`). Mostrar overlay de opciones con backdrop blur encima de la card.
- **Archivos a tocar:**
  - `src/components/movies/MovieCard.tsx`
  - `src/hooks/useLongPress.ts` — nuevo hook reutilizable
- **Opciones del menu:**
  - Ver detalles
  - Editar
  - Eliminar
  - (si existe: añadir a favoritas)
- **Qué probar:** Long press sobre una movie card → aparece menú con animación scale + fade. Tap fuera → cierra. Tap en opción → ejecuta la acción.

### 2.4 Respetar `prefers-reduced-motion`
- **Problema:** Usuarios con este setting activo (frecuente en personas mayores) ven todas las animaciones ignorando su preferencia de sistema.
- **Fix:** En `src/lib/animations.ts`, exportar una función `getAnimation(variant)` que devuelve `{}` si `prefers-reduced-motion: reduce`.
- **Archivos a tocar:**
  - `src/lib/animations.ts`
  - Opcionalmente: `src/hooks/useReducedMotion.ts`
- **Qué probar:** En iOS/Android Ajustes → Accesibilidad → Reducir movimiento → activar → abrir la app → los sheets deben aparecer sin animación de slide, los cards sin fadeInUp.

---

## FASE 3 — Feedback visual y estados ✅ COMPLETADA

> La diferencia entre una app que parece rápida y una que parece lenta está aquí.

### 3.1 Skeleton screens ✅
- **Archivos creados:**
  - `src/components/movies/MovieCardSkeleton.tsx` — shimmer animado, mismas dimensiones que MovieCard (poster 56×82, title, badges, metadata row)
  - `src/components/sessions/SessionCardSkeleton.tsx` — poster 52×76, título, estado, avatares participantes
  - `src/components/stats/StatCardSkeleton.tsx` — replica el layout completo de stats (hero 2-col, favoritos, protagonistas, top películas)
- **Animación:** keyframe `shimmer` añadido a `globals.css` + clase `.skeleton` — sweep gradient de izquierda a derecha, más premium que `animate-pulse`
- **Páginas actualizadas:**
  - `src/app/(app)/groups/[groupId]/page.tsx` — 4 MovieCardSkeleton en carga
  - `src/app/(app)/groups/[groupId]/sessions/page.tsx` — 3 SessionCardSkeleton en carga
  - `src/app/(app)/groups/[groupId]/stats/page.tsx` — StatCardSkeleton full-page en carga
  - `src/app/(app)/groups/page.tsx` — 3 GroupCard skeletons inline en carga
- **Qué probar:** Throttling a "Slow 3G" en DevTools → Network. Las pantallas deben mostrar esqueletos del tamaño correcto, nunca un spinner central.

### 3.2 Indicador de conexión offline ✅
- **Archivos creados:**
  - `src/hooks/useOnlineStatus.ts` — `navigator.onLine` + listeners `online`/`offline`
  - `src/components/shared/OfflineBanner.tsx` — banner ámbar sticky-top con slide-in spring animation
- **Añadido a:** `src/app/(app)/layout.tsx` encima del `<main>` (dentro del centered column)
- **Qué probar:** DevTools → Network → Throttling → "Offline". App muestra banner ámbar con "Sin conexión". Volver a Online → banner desaparece con animación.

### 3.3 Empty states con personalidad ✅
- **Mensajes actualizados:**
  - Películas sin filtro: "Nada pendiente por ver" / "Añade la primera película al grupo y empieza la lista."
  - Películas con filtros: "Sin resultados" / "Prueba ajustando los filtros o borrándolos"
  - Sesiones vacías: "Todavía no habéis visto nada juntos" / "Elegid una película de la lista, pulsad «Ver ahora» y empezad vuestra primera sesión de cine."
  - Stats vacías: "Aquí aparecerán vuestras estadísticas" / "Completad vuestra primera sesión de cine y los datos empezarán a aparecer."
- **Qué probar:** Crear un grupo nuevo → visitar cada sección vacía → verificar el mensaje y que el empty state no es genérico.

---

## FASE 4 — Navegación y estructura

> Cambio estructural de mayor impacto visual. Hacerlo después de las fases 1-3 para no mezclar bugs.

### 4.1 Reestructurar tabs del grupo: 5 → 4
- **Problema:** 5 tabs (Películas, Ruleta, Sesiones, Stats, Recuerdos) en un pill horizontal overflow en iPhone SE (375px) y saturan visualmente.
- **Nueva estructura de 4 tabs:**
  - `Películas` — lista de pendientes (default)
  - `¿Qué vemos?` — acceso a Ruleta + Movie Duels (ambos en la misma pantalla, como modos)
  - `Historial` — sesiones terminadas + memories juntos
  - `Grupo` — stats, miembros, configuración del grupo
- **Archivos a tocar:**
  - `src/app/(app)/groups/[groupId]/layout.tsx` — rehacer la nav con 4 tabs
  - `src/app/(app)/groups/[groupId]/spin/page.tsx` — añadir selector de modo (Ruleta / Duelo)
  - Posiblemente unificar `memories` y `sessions` bajo `historial`
- **Qué probar:** En iPhone SE (375px en DevTools). Los 4 tabs deben caber sin scroll ni truncado. Navegar entre todos, verificar que las rutas funcionan.

### 4.2 "Now Playing" banner persistente
- **Problema:** Cuando hay una sesión activa, no hay ningún indicador visible si navegas a otras pestañas del grupo.
- **Fix:** Banner fijo debajo del header del grupo cuando el estado de la sesión es `en_curso`. Muestra título de la película + tiempo restante estimado + tap → va a la sesión.
- **Archivos a crear:**
  - `src/components/sessions/NowPlayingBanner.tsx`
- **Archivos a tocar:**
  - `src/app/(app)/groups/[groupId]/layout.tsx` — incluir `<NowPlayingBanner groupId={groupId} />`
  - `src/hooks/useSessions.ts` — hook `useActiveSession(groupId)` si no existe
- **Qué probar:** Iniciar sesión → navegar a Stats → el banner debe aparecer. Tapearlo → va a la pantalla de sesión. Terminar sesión → banner desaparece.

### 4.3 Búsqueda inline siempre visible
- **Problema:** Con muchas películas, encontrar una concreta requiere scrollear o abrir el sheet de filtros. La búsqueda debería estar siempre visible como en cualquier lista de iOS.
- **Fix:** `SearchBar` fijo justo debajo del header, sobre la lista. Al hacer focus, filtra en tiempo real (client-side, sin llamada API si ya están cargadas). Filtros avanzados siguen en el sheet.
- **Archivos a tocar:**
  - `src/app/(app)/groups/[groupId]/page.tsx` — añadir `SearchBar` + lógica de filtrado local
  - `src/components/shared/SearchBar.tsx` — nuevo componente reutilizable
- **Qué probar:** Escribir parte del título de una película → lista filtra en tiempo real. Limpiar búsqueda → vuelve la lista completa. El SearchBar no interfiere con el scroll ni con los filtros avanzados.

---

## FASE 5 — Nuevas features

> Solo cuando las fases 1-4 estén estables. Las features nuevas sobre base rota son deuda doble.

### 5.1 Movie Duels — integrado con la Ruleta
- **Concepto:** En la pantalla `¿Qué vemos?` (tab unificada), dos modos:
  - **Modo Ruleta** — el que ya existe. Selección aleatoria automática.
  - **Modo Duelo** — la app elige 2 películas al azar. Cada miembro del grupo vota en su móvil. La más votada gana. Votación en tiempo real (polling o WebSocket).
- **UX del Duelo:**
  ```
  ┌──────────────┐   VS   ┌──────────────┐
  │   [poster]   │        │   [poster]   │
  │   Dune       │        │   Oppenheim  │
  │   ⭐ 3 votos │        │   ⭐ 1 voto  │
  └──────────────┘        └──────────────┘
       [ Votar Dune ]    [ Votar Oppenheim ]
  ```
  - Cada miembro puede cambiar su voto hasta que el admin cierra la votación.
  - Al cerrar: animación de resultado + iniciar sesión directamente.
- **Archivos a crear:**
  - `src/components/spin/MovieDuelCard.tsx`
  - `src/app/(app)/groups/[groupId]/spin/page.tsx` — añadir selector Ruleta/Duelo + lógica de Duelo
  - Backend: endpoint `POST /groups/{id}/duel` (devuelve 2 películas random) y `POST /groups/{id}/duel/vote`
- **Qué probar:** Seleccionar modo Duelo → aparecen 2 películas → votar en un dispositivo → el voto se refleja → cerrar votación → resultado claro → puede iniciar sesión directamente.

### 5.2 Modo "Esta Noche" (Tonight Mode)
- **Concepto:** Flujo simplificado de 3 pasos para cuando ya es hora de ver una peli. Accesible desde un botón CTA prominente en la home de grupos.
- **Flujo:**
  1. **¿Quién está?** — selector de participantes del grupo presentes
  2. **¿Qué vemos?** — ruleta o duelo (usando los componentes ya existentes)
  3. **¡Empezamos!** — confirmación + inicio de sesión automático
- **UX:** Pantalla modal a pantalla completa, fondo más oscuro, foco máximo en lo que importa.
- **Archivos a crear:**
  - `src/components/sessions/TonightModeSheet.tsx` — sheet fullscreen con wizard de 3 pasos
- **Archivos a tocar:**
  - `src/app/(app)/groups/page.tsx` — añadir botón "Esta Noche" en la card del grupo principal
- **Qué probar:** Pulsar "Esta Noche" → flujo de 3 pasos completo → sesión iniciada. El flujo debe poder completarse en menos de 30 segundos.

### 5.3 "No terminamos" — devolver película a pendientes
- **Verificar primero:** ¿Está ya implementado en `useSessions.ts` el método `returnToPending`?
- **Si no está:** Añadir botón en la sesión activa/terminada "No terminamos esta peli".
- **UX:** La película vuelve a la lista de pendientes con etiqueta visual "Vista a medias".
- **Archivos a tocar:**
  - `src/app/(app)/groups/[groupId]/sessions/[sessionId]/page.tsx`
  - `src/hooks/useSessions.ts`
  - `src/components/movies/MovieCard.tsx` — badge "Vista a medias" si tiene ese flag
- **Qué probar:** Iniciar sesión → usar "No terminamos" → la película aparece en pendientes con badge diferenciado.

---

## FASE 6 — Performance y pulido final

> El acabado fino. Solo cuando todo lo demás funciona.

### 6.1 Virtualización de listas largas
- **Problema:** Con 50+ películas, el DOM se vuelve pesado y el scroll pierde fluidez.
- **Fix:** `@tanstack/react-virtual` para renderizar solo las cards visibles.
- **Archivos a tocar:**
  - `src/app/(app)/groups/[groupId]/page.tsx`
- **Qué probar:** Añadir 50+ películas de prueba. El scroll debe mantenerse a 60fps. Verificar en DevTools > Performance.

### 6.2 `next/image` para todos los posters TMDB
- **Verificar primero:** ¿Se usa `<Image>` de `next/image` o `<img>` para los posters?
- **Si no:** Migrar a `<Image>` con `placeholder="blur"` y añadir `image.tmdb.org` a `next.config.ts`.
- **Archivos a tocar:**
  - `next.config.ts` — `images.remotePatterns`
  - Todos los componentes que muestren posters TMDB
- **Qué probar:** En DevTools > Network, los posters deben venir en WebP/AVIF optimizado, no JPEG original. Los posters deben tener placeholder blur mientras cargan.

### 6.3 Prefetch en links de grupos
- **Problema:** Navegar de la lista de grupos al detalle de un grupo no hace prefetch.
- **Fix:** Los `<Link>` que llevan a grupos deben tener `prefetch={true}` (o verificar si ya lo hace Next.js por defecto en App Router).
- **Archivos a tocar:**
  - `src/app/(app)/groups/page.tsx` — cards de grupos
- **Qué probar:** En DevTools > Network, al hacer hover sobre un grupo debe aparecer una request de prefetch. La navegación al grupo debe ser casi instantánea.

---

## Control de versiones de este documento

| Fecha | Fase completada | Notas |
|-------|----------------|-------|
| 2026-07-18 | — | Documento creado |
| 2026-07-18 | Fase 1 | 1.1-1.4 completos. 1.5 requiere fix en backend Laravel |
| 2026-07-18 | Fase 2 | 2.1-2.4 completos. Hook useSheetAnimation + useLongPress |
| 2026-07-18 | Fase 3 | 3.1-3.3 completos. Skeletons shimmer + OfflineBanner + empty states |

---

## Notas de trabajo

- **Yo (Claude) aviso siempre** qué archivos toqué al terminar cada bloque.
- **Tú pruebas** en el emulador antes de pasar al siguiente.
- **Si hay error**, lo iteramos en esa misma fase antes de avanzar.
- **El código nunca se sube** hasta que tú lo hayas validado.
- Cada fase es independiente y puede desplegarse por separado.
