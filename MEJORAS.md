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

## FASE 4 — Navegación y estructura ✅ COMPLETADA

> Cambio estructural de mayor impacto visual. Hacerlo después de las fases 1-3 para no mezclar bugs.

### 4.1 Reestructurar tabs del grupo: 5 → 4 ✅
- **Archivos tocados:** `src/app/(app)/groups/[groupId]/layout.tsx`
- **Nuevas tabs:** `Pelis` · `Ruleta` · `Historial` · `Grupo` (mismas rutas, nuevos labels)
- **Qué probar:** iPhone SE (375px en DevTools) → los 4 tabs deben caber sin scroll ni truncado. Navegar entre todos.

### 4.2 "Now Playing" banner persistente ✅
- **Archivos creados:** `src/components/sessions/NowPlayingBanner.tsx`
- **Archivos tocados:** `src/hooks/useSessions.ts` (añadido `useActiveSession`), `layout.tsx`
- **Comportamiento:** Banner emerald con dot pulsante entre las tabs y el contenido. Muestra título, tiempo restante (actualizado cada minuto) y avatares. Tap → navega a la sesión. Desaparece con animación cuando la sesión termina.
- **Qué probar:** Iniciar una sesión → navegar a Ruleta o Historial → banner visible. Tapearlo → va a la sesión. Terminar sesión → banner desaparece.

### 4.3 Búsqueda inline en lista de películas ✅
- **Archivos creados:** `src/components/shared/SearchBar.tsx`
- **Archivos tocados:** `src/app/(app)/groups/[groupId]/page.tsx`
- **Comportamiento:** SearchBar aparece sólo cuando hay películas cargadas. Filtrado client-side en tiempo real con `useMemo`. Botón ✕ para limpiar. Empty state contextual según búsqueda vs filtros vs lista vacía.
- **Qué probar:** Escribir parte de un título → lista filtra al instante. Borrar → lista completa. Buscar algo inexistente → empty state con el término buscado.

### 4.4 Historial unificado con Recuerdos ✅
- **Archivos tocados:** `src/app/(app)/groups/[groupId]/sessions/page.tsx`
- **Comportamiento:** La pestaña "Historial" muestra sesiones + sección "Recuerdos" al final (películas vistas tal día como hoy hace N años). Solo aparece si hay memories.
- **Qué probar:** Si el grupo tiene más de 1 año, la sección Recuerdos aparece al final del Historial con el diseño de cards indigo.

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

## FASE 7 — Vista Desktop

> La app se diseñó 100% mobile-first (`max-w-[480px] mx-auto` en todo `(app)`, BottomNav,
> bottom-sheets). En desktop se veía como un móvil flotando en una pantalla negra. Objetivo:
> vista desktop pensada de verdad, sin tocar un solo píxel de la experiencia móvil (`<lg`,
> 1024px). Plan completo en la conversación que originó esta fase.

Breakpoint: `lg:` (1024px). Navegación desktop: sidebar persistente estilo Linear/Slack
(decisión confirmada con el usuario), sustituye la `BottomNav`.

### 7.1 Shell — sidebar + header/tabs de grupo ✅
- **Archivos creados:** `src/components/shared/Sidebar.tsx` — sidebar fija (272px) con logo,
  nav primaria (Grupos/Perfil, indicador `layoutId`) y lista de "Tus grupos" (vía `useGroups()`,
  sin endpoint nuevo) para cambiar de grupo con un clic.
- **Archivos tocados:**
  - `src/app/(app)/layout.tsx` — shell de dos columnas en `lg:` (`Sidebar` + columna de
    contenido `lg:max-w-5xl lg:shadow-none`, antes `max-w-[480px]` fijo). `pb-20 lg:pb-12`.
  - `src/components/shared/BottomNav.tsx` — `lg:hidden`.
  - `src/app/(app)/groups/[groupId]/layout.tsx` — header: back-button oculto en `lg:` (redundante
    con la sidebar), título pasa de centrado-absoluto a alineado a la izquierda y más grande,
    botón de ajustes gana label "Ajustes" visible. Tabs: de pill segmentado a tabs subrayadas
    alineadas a la izquierda en `lg:` (patrón Linear/GitHub), mismo `layoutId` de indicador.
  - `src/components/shared/InstallBanner.tsx`, `NotificationBanner.tsx`,
    `src/components/sessions/NowPlayingBanner.tsx` — overrides `lg:`/`md:` para que estos
    overlays fixed no asuman el contenedor de 480px (toast bottom-right en vez de banner
    full-width, márgenes correctos).
- **Qué probar:** Ventana de escritorio ≥1024px → sidebar visible, sin BottomNav, tabs de grupo
  subrayadas a la izquierda. Redimensionar a <1024px → debe volver exactamente al diseño móvil
  actual (sidebar desaparece, vuelve BottomNav, tabs vuelven a pill). Probar también en móvil real
  para confirmar cero regresión.
### 7.2 `ResponsiveSheet` — sheets del shell → modal centrado en desktop ✅
- **Archivos creados:**
  - `src/components/shared/ResponsiveSheet.tsx` — primitiva: bottom-sheet con drag-to-dismiss
    en `<lg` (igual que antes, vía `useSheetAnimation`), modal centrado (fade+scale, sin drag,
    cierre con click en backdrop/X/`Escape`) en `lg:`. Props: `size` (sm/md/lg → max-width en
    desktop), `zIndex` (para sheets apiladas, ej. confirmación sobre miembros), `showHandle`,
    `className`/`style` para paneles con `flex flex-col` + `maxHeight`.
  - `src/hooks/useIsDesktop.ts` — `matchMedia('(min-width: 1024px)')`, espejo en JS del `lg:` de
    Tailwind (necesario porque Framer Motion necesita valores reales, no solo CSS).
- **Archivos migrados** (mismo contenido interno, solo cambia el wrapper — de
  `AnimatePresence` + backdrop + `motion.div` a mano, a `<ResponsiveSheet>`):
  - `src/app/(app)/groups/[groupId]/layout.tsx` — Ajustes, QR, Editar grupo, Miembros, Expulsar
    (apilada sobre Miembros, `zIndex=70`), Eliminar grupo.
  - `src/app/(app)/profile/page.tsx` — Editar perfil, Cerrar sesión.
  - De paso normaliza una inconsistencia que ya existía: antes solo 2 de los 6 sheets de
    `groups/[groupId]/layout.tsx` tenían centering `sm:` — ahora los 6 se comportan igual.
- **Qué probé:** Verificación real contra los contenedores Docker (login con el usuario de seed
  `mario@plancine.app`), capturas automatizadas con Playwright en 1440px/1920px (todas las
  sheets migradas, incluida la de perfil con el `AvatarPicker`) y en 390px (confirma que sigue
  siendo bottom-sheet con drag-handle, sin cambios). Sin errores de consola.
### 7.3 Películas — grid, hover-actions y sheets sobre `ResponsiveSheet` ✅
- **Archivos tocados:**
  - `src/app/(app)/groups/[groupId]/page.tsx` — lista de pendientes pasa a
    `lg:grid lg:grid-cols-2 xl:grid-cols-3` (antes columna única incluso en desktop). FAB oculto
    en `lg:` (`lg:hidden`) — en desktop la acción "Añadir película" vive en la toolbar, no como
    botón flotante (patrón mobile-only, no tiene sitio en un dashboard de escritorio). Sheet de
    borrado migrado a `ResponsiveSheet`.
  - `src/components/movies/MovieFilters.tsx` — nuevo prop `onAddMovie` que renderiza el botón
    "Añadir película" (`hidden lg:flex`) junto a "Filtrar". Sheet de filtros migrado.
  - `src/components/movies/AddMovieSheet.tsx` — sheet principal + `PickerSheet` anidado (selector
    de plataforma/género) migrados a `ResponsiveSheet`. El picker usa `zIndex={80}` para apilarse
    sobre el sheet principal (`zIndex` por defecto 60) — mismo comportamiento que antes.
  - `src/components/movies/MovieDetailSheet.tsx` — migrado. Se simplifica el "handle" (antes
    superpuesto sobre el póster con `useSheetAnimation` expuesto a mano; ahora usa el handle
    estándar de `ResponsiveSheet` encima del póster en vez de superpuesto — pequeño cambio visual,
    mantiene el drag-to-dismiss intacto).
  - `src/components/movies/MovieCard.tsx` — en `lg:` el swipe-to-reveal se desactiva
    (`useIsDesktop()`) y se sustituye por botones de acción (Ver ahora / Editar / Eliminar) que
    aparecen al hover junto al chevron — el espacio queda siempre reservado (solo cambia opacity)
    para que no haya salto de layout al pasar el ratón.
- **Bug real encontrado y arreglado:** títulos de una sola palabra larga (ej. "Oppenheimer") se
  recortaban sin wrap en el grid de 3 columnas porque el hueco reservado para los botones de hover
  estrechaba demasiado la columna de texto y la palabra no rompía línea. Fix: `break-words` en el
  `<h3>` del título.
- **Qué probé:** Verificado en Docker con capturas Playwright a 1600px — grid de 3 columnas,
  hover-actions (aparecen sin mover el layout), las 4 sheets (Añadir, Filtrar, Detalle, Borrar)
  como modales centrados, y el picker anidado apilado correctamente sobre el sheet de Añadir.
  Sin errores de consola (aparte del 404 de un poster de seed, ya conocido y ajeno a esta fase).
  `npm run build` y `eslint` limpios (2 avisos de `react-hooks/set-state-in-effect` son
  preexistentes, confirmado contra `HEAD`, no introducidos por esta fase).
- **Pendiente de esta fase:** 7.5 ruleta/duelo, 7.6 auth, 7.7 pulido.

### 7.4 Sesiones ✅
- **Dead code encontrado y eliminado:** `RescheduleSheet.tsx` no se usaba en ningún sitio (`ScheduleSessionSheet` con `editMode` ya cubre ese flujo desde hace tiempo) — confirmado por grep antes de borrarlo.
- **Migrados a `ResponsiveSheet`:** `ConfirmSheet`, `StartSessionSheet`, `ScheduleSessionSheet` (incluye el calendario inline y el `DrumPicker` de hora, sin tocar su lógica), `ShareCardSheet`, y el sheet de valoración (rating-prompt) que vivía hardcodeado dentro de `sessions/[sessionId]/page.tsx` — este último gana de paso el drag-to-dismiss que nunca tuvo.
- **`ShareCardSheet`:** mantuve el `transform: scale()` que encoge la card de 390×620 en vez de quitarlo en desktop (como decía el plan inicial) — con `size="md"` (448px) el ancho real disponible tras el padding es demasiado justo para la card sin escalar; escalarla es más robusto que arriesgar un overflow.
- **Layout:** `sessions/page.tsx` y `sessions/[sessionId]/page.tsx` ganan `lg:max-w-2xl lg:mx-auto lg:px-8` — se quedan como columna única (tiene sentido cronológico/de lectura) pero con más aire, en vez de estirarse a todo el ancho.
- **Qué probé:** Verificado en Docker — `StartSessionSheet`, `ScheduleSessionSheet` con el calendario desplegado, la lista de sesiones y el detalle de una sesión terminada (con valoraciones) y su `ShareCardSheet`, todos como modales centrados. `ConfirmSheet` no se re-probó visualmente en esta fase (la seed no tiene sesiones programadas para disparar "Cancelar sesión") pero usa exactamente la misma primitiva ya verificada en 7.1-7.3, sin lógica nueva. `npm run build` limpio; los avisos de `eslint` que salieron son preexistentes (confirmado contra `HEAD`, líneas sin diff).

### 7.5 Ruleta y Duelo ✅
- **`SpinWheel.tsx`**: el contenedor de la rueda usaba `minHeight: 'calc(100svh - 230px)'` (asume el chrome móvil). Con `useIsDesktop()`, en `lg:` pasa a un `600px` fijo — la rueda queda bien centrada con aire alrededor en vez de con un cálculo pensado para pantalla de móvil. El modal de resultado ya era un card centrado (`fixed inset-x-5 ... max-w-sm mx-auto` con su propio backdrop) — no necesitaba cambios, ya sigue el mismo patrón "centrado a pantalla completa, sidebar incluida" que el resto de modales de la app.
- **`DuelView.tsx`**: mismo problema con `CONTENT_HEIGHT = 'calc(100svh - 295px)'`, usado en 4 sitios (idle/voting/tie/winner) para que las cards de las películas llenen el alto disponible sin scroll. Añadí `CONTENT_HEIGHT_DESKTOP` (`calc(100svh - 260px)`, sin bottom-nav que restar) seleccionado vía `useIsDesktop()` — mantiene intacta toda la arquitectura de alturas en cascada (`flex-1 min-h-0`) que ya tenía, solo corrige el offset para el chrome de escritorio.
- **`spin/page.tsx`**: el selector de modo (Ruleta/Duelo) dejaba de estirarse a todo el ancho en `lg:` (`lg:flex-none lg:px-6` en los botones).
- **Qué probé:** Ruleta con el resultado revelado, Duelo en estado idle y en votación (2 cards lado a lado, alturas correctas) — todo en Docker a 1600px. Sin errores de consola nuevos.

### 7.6 Auth ✅
- **`(auth)/layout.tsx`**: en `lg:` la card de login/register/join gana un glow radial indigo de fondo y se convierte en una card real (`rounded-3xl`, borde, `shadow-2xl`, padding generoso) en vez de un formulario flotando suelto en negro. Mismo layout sirve a `login`, `register` y cualquier página futura bajo `(auth)` — no hizo falta tocar las páginas en sí.
- **Qué probé:** Login y Register en Docker a 1600px — ambas cards se ven consistentes, el formulario largo de registro (avatar + color + 4 campos) se desplaza bien dentro de la card sin romper nada.

### 7.7 Pulido final ✅
- **`groups/page.tsx`**: grid `lg:grid-cols-2 xl:grid-cols-3` (antes columna única incluso con espacio de sobra).
- **`PageHeader.tsx`** (usado por `groups/page.tsx`): más padding y tipografía más grande en `lg:`. De paso corregí un bug silencioso — el `lg:pt-2` que puse en la Fase 7.1 en el header del grupo nunca se aplicaba porque un `style={{paddingTop: ...}}` inline en el mismo elemento gana siempre a una clase Tailwind para la misma propiedad; aquí sí lo hice bien con `useIsDesktop()` para computar el valor en JS.
- **`stats/page.tsx`**: pasa de bloques apilados a un dashboard real en `lg:` — las 4 stat-tiles (noches, horas, plataforma, género) en una sola fila de 4, y "Protagonistas" + "Top películas" lado a lado en vez de apilados.
- **`profile/page.tsx`**: `lg:` dos columnas — identidad + botón de cerrar sesión en una columna izquierda `sticky`, grid de estadísticas a la derecha (el botón de cerrar sesión se duplica con `hidden lg:block` / `lg:hidden` según viewport, mismo handler).
- **`memories/page.tsx`** y **`members/page.tsx`**: grid `lg:grid-cols-2`/`xl:grid-cols-3` + `lg:px-8`. La sheet de expulsar miembro de `members/page.tsx` (una implementación duplicada e independiente de la que ya migré en `groups/[groupId]/layout.tsx`) también pasa a `ResponsiveSheet`.
- **Hallazgo sin actuar:** `/groups/[groupId]/members` no está enlazada desde ningún sitio de la navegación (la función equivalente vive en la sheet "Miembros" del menú de Ajustes) — puede ser una ruta huérfana. La dejé funcional y con el mismo pulido que el resto por si se usa por URL directa, pero no la until borré porque a diferencia de `RescheduleSheet.tsx` (0 imports, inequívocamente muerta) esto es una *ruta*, y borrar una ruta accesible por URL es una decisión con más peso — mejor que la tomes tú.
- **Qué probé:** Verificación completa en Docker a 1600px — login, register, grid de grupos, ruleta (rueda + resultado), duelo (idle + votación), dashboard de stats, perfil a dos columnas. Todo consistente, sin errores de consola nuevos. `npm run build` y `eslint` limpios en todos los archivos tocados.

### 7.6 (fix) — Register seguía viéndose "modo móvil" ✅
- **Feedback del usuario:** la card con glow que añadí en 7.6 era solo un marco decorativo — el formulario de dentro seguía siendo la misma columna vertical larga de móvil (avatar picker, color picker, 4 inputs, todo apilado), así que en la práctica seguía "pareciendo móvil".
- **Fix:**
  - `(auth)/layout.tsx` — pasa a detectar la ruta (`usePathname`) y da a `/register` una card más ancha (`lg:max-w-2xl` vs `max-w-sm` de login) ya que tiene mucho más contenido.
  - `(auth)/register/page.tsx` — en `lg:` el avatar picker y el color picker van lado a lado, Nombre+Email en una fila, Contraseña+Confirmar en otra — de 7 bloques apilados pasa a 3 filas. Ahora cabe todo en una pantalla sin scroll y de verdad se ve como un formulario pensado para escritorio, no uno de móvil metido en una caja. Login (solo 2 campos) no necesitaba este tratamiento y se queda igual.
- **Qué probé:** Docker a 1600px (verificado que ya no hay scroll y los campos emparejan bien) y a 390px (confirmado que el móvil no cambió ni un píxel).

### 7.7 (fix) — Panel demasiado estrecho en pantalla completa + salto brusco a móvil ✅
- **Feedback del usuario:** en pantalla completa (MacBook 14") el contenido se veía "estrecho" con saltos de línea raros en las cards; al reducir la ventana de Safari por debajo de cierto punto, la app saltaba de golpe a la vista móvil completa (bottom nav incluido) en vez de mantener el sidebar, aunque fuera colapsado.
- **Causas reales:**
  1. El contenido tenía un `max-w-5xl` (1024px) fijo — en una pantalla grande eso deja muchísimo margen vacío a los lados en vez de usarlo, y los grids con columnas fijas (`lg:grid-cols-2 xl:grid-cols-3`) hacían que 3 columnas metidas en esos 1024px quedaran más estrechas que 2, provocando los saltos de línea feos.
  2. El breakpoint que decide "modo escritorio vs modo móvil" estaba en 1024px (`lg` de Tailwind) — media pantalla en un portátil cae por debajo de eso, así que todo el shell (sidebar, grids, sheets como diálogo, hover-actions) se apagaba de golpe.
- **Fix:**
  - `globals.css` — redefine `--breakpoint-lg: 48rem` (768px). Como *todo* el `lg:` de la Fase 7 lo añadí yo mismo (no había ningún `lg:` real antes), esto desplaza el interruptor completo "modo escritorio" a 768px con un cambio de una línea, sin tocar clases una a una. Por debajo de eso sigue siendo la vista móvil de siempre (cubre cualquier móvil real de sobra).
  - `useIsDesktop.ts` — su media query pasa a `768px` para no desincronizarse del CSS.
  - `(app)/layout.tsx` — el contenido ya no tiene un `max-w` fijo de 1024px; ahora se estira libremente hasta `2xl` (1536px) y solo a partir de ahí se limita a 1800px (para no tener líneas de texto absurdamente largas en un monitor externo gigante).
  - Grids de películas/grupos/recuerdos/miembros — de columnas fijas por breakpoint a `grid-cols-[repeat(auto-fit,minmax(300px,1fr))]`: el número de columnas se adapta de forma continua al ancho real disponible (nunca una columna más estrecha de 300px), en vez de saltar bruscamente entre 2 y 3.
  - **`Sidebar.tsx` — ahora es colapsable**: botón para plegarlo a una barra de solo iconos (76px) o expandirlo (272px). Por debajo de 1024px (media pantalla en portátil) se colapsa automáticamente para dejar sitio al contenido, pero sigue en "modo escritorio" — sheets como diálogo, grids, hover-actions, todo intacto. El usuario puede expandir/colapsar en cualquier momento con el botón; esa elección manual se guarda en `localStorage` y a partir de ahí gana siempre al comportamiento automático.
- **Qué probé:** Docker con capturas a 1728px (pantalla completa simulada — el grid ya usa 4 columnas y respira bien), 860px (media pantalla — sidebar se auto-colapsa a iconos, grid pasa a 2 columnas), expandir/colapsar manual en ese mismo ancho (funciona en ambos sentidos), y 390px (confirmado que el móvil real no cambió nada). `npm run build` limpio.

### 7.7 (fix 2) — Cards de tamaño inconsistente ("auto-fit" seguía estirando) ✅
- **Feedback del usuario:** con `minmax(Npx, 1fr)`, las columnas se estiran para rellenar el ancho hasta que justo cabe una columna más — en ese instante todas se encogen de golpe cerca del mínimo. En un monitor de 34" esto se traducía en 5 columnas pequeñas en vez de pocas columnas grandes: el usuario quiere que las cards tengan **siempre el mismo tamaño fijo**, y que sea el número de columnas el que varíe (dejando espacio vacío si no cabe una columna más, en vez de encoger las que ya hay).
- **Fix:** en los 4 grids de cards (`groups/[groupId]/page.tsx` películas, `groups/page.tsx` lista y skeleton, `memories/page.tsx`, `members/page.tsx`) cambié `repeat(auto-fit, minmax(Npx, 1fr))` por `repeat(auto-fill, Npx)` — ancho de columna fijo (380px películas, 340px grupos/recuerdos, 320px miembros), el navegador decide solo cuántas caben. Ya no hay "salto" de tamaño al redimensionar.
- **Qué probé:** Docker a 3440px (simulando un monitor ultra-wide de 34") — 4 columnas, todas exactamente del mismo tamaño, con margen vacío a la derecha en vez de cards estiradas; y a 1180px (el caso límite que antes rompía) — 2 columnas limpias y consistentes, sin fragmentación. `npm run build` limpio.

### 7.5 (fix) — Ruleta: botones sin centrar y rueda del tamaño de móvil ✅
- **Feedback del usuario:** los botones Ruleta/Duelo no estaban centrados respecto a la rueda, y la rueda en sí seguía teniendo el tamaño fijo de móvil (300px) sin aprovechar el espacio de escritorio — pero sin llegar a provocar scroll para llegar al botón "¿Qué vemos hoy?" en ninguna pantalla.
- **Fix:**
  - `spin/page.tsx` — el selector de modo pasa de `lg:justify-start` a `lg:justify-center`.
  - `SpinWheel.tsx` — la rueda (antes un SVG con `width`/`height` fijos a 300px, código duro para toda resolución) pasa a usar `viewBox="0 0 300 300"` + `width="100%" height="100%"`: toda la geometría interna (segmentos, textos, centro) sigue calculada sobre las mismas 300 unidades, pero el tamaño *visual* ahora lo decide un contenedor con `lg:w-[clamp(260px,42vh,460px)]` — crece con la altura real de la ventana hasta un máximo de 460px, y se encoge en ventanas bajas, para que el botón de girar quede siempre visible sin scroll. Se quitó el `minHeight` fijo de 600px en desktop (ya no hace falta, el propio tamaño de la rueda ya se adapta).
- **Qué probé:** Docker a 1440×900, 1920×1200 (rueda grande pero sin pasarse) y 1200×700 como caso límite de ventana baja — en los tres, el botón "¿Qué vemos hoy?" y el texto de ayuda quedan completamente visibles sin necesidad de scroll. `npm run build` limpio.

### 7.5 (fix 2) — Triángulo pegado a los botones (desktop) / demasiado espacio (móvil) ✅
- **Feedback del usuario:** en desktop el triángulo indicador de la rueda quedaba pegado a los botones Ruleta/Duelo; en móvil pasaba lo contrario — demasiado margen, la rueda quedaba muy abajo.
- **Causa:** el contenedor de la rueda usaba `justify-center` dentro de una caja con `minHeight: calc(100svh - 230px)` en móvil — es decir, centraba verticalmente el contenido dentro de casi toda la altura de la pantalla, empujándolo hacia el medio/abajo en vez de dejarlo arriba con un margen razonable. En desktop, al quitar ese `minHeight` (fix anterior), no quedaba ningún espaciado superior explícito.
- **Fix:** se sustituye el centrado vertical "a lo bruto" por un espaciado superior fijo y ajustado por pantalla: `pt-6` en móvil (justo el aire que hacía falta, sin la caja gigante) y `lg:pt-12` en desktop (separación clara respecto a los botones).
- **Qué probé:** Docker a 1440px (desktop — separación clara entre botones y triángulo) y 390px (móvil — la rueda ya no queda "muy abajo", aparece justo debajo de los botones con un margen natural). `npm run build` limpio.

### 7.5 (rediseño visual) — La rueda tenía pinta de "ruleta de premios" genérica ✅
- **Feedback del usuario:** los colores de los segmentos no pegaban con la estética de la app, el indicador ("pico") se veía plano, y en general faltaba sensación 3D y mejores animaciones.
- **Colores:** de una paleta arcoíris de 12 colores (rojo, naranja, lima, verde, cian...) a una familia coherente índigo → violeta → púrpura → fucsia → rosa — los mismos tonos que ya usa la marca (`indigo-500` es el acento de toda la app), en vez de colores que no tienen nada que ver con el resto de la interfaz.
- **Indicador ("pico"):** de un triángulo blanco plano a un pin con degradado índigo, sombra propia y borde — con dos animaciones: en reposo hace un pequeño balanceo constante (respira), y durante el giro vibra rápido como si golpeara los separadores de los segmentos (el típico "tic-tic-tic" de una ruleta real).
- **Sensación 3D:** bisel oscuro exterior con sombra de elevación e "glow" índigo alrededor de toda la rueda, un brillo de cristal superpuesto sobre los colores (efecto cúpula), y el centro (`hub`) pasa de un punto plano a un círculo con degradado, borde y el emoji 🎬.
- **Qué probé:** Docker a 1440px — capturé la rueda en reposo, a mitad de giro (para confirmar que el pin vibra) y en el resultado final; y en 390px para confirmar que se ve igual de bien en móvil. `npm run build` limpio.

### 7.5 (ajuste tras feedback) — Puntero de vuelta a triángulo + golpe sincronizado, logo en el centro ✅
- **Feedback del usuario:** el pin/gota no gustaba nada ("quiero mejor el triángulo"), y quería que el puntero diera la sensación de "chocar" contra la línea de cada gajo al pasar, no un balanceo genérico. También pidió el icono de la app en el centro en vez del emoji 🎬.
- **Puntero:** vuelve a ser un triángulo limpio (`M12,27 L2,4 L22,4 Z`), con relleno degradado índigo y sombra — ya no es una forma redondeada tipo pin.
- **Golpe sincronizado de verdad:** la rotación de la rueda dejó de animarse de forma declarativa (`animate={{rotate: wheelRotation}}`) y pasa a un `motion value` (`wheelRotate`) animado de forma imperativa con `animate()` de Framer Motion, que expone un callback `onUpdate` en cada frame. Ahí se calcula en qué segmento está la rueda en cada instante (`Math.floor(rotación / ánguloDeSegmento)`); en cuanto cambia de segmento, se dispara un "golpe" (`pointerKick`, un `motion value` propio del puntero con un `[0,-16,0]` rápido) — el puntero golpea la línea divisoria justo cuando la rueda la cruza, no un temporizador aproximado. Confirmado visualmente con capturas a distintos instantes del giro: el triángulo aparece inclinado en momentos distintos, señal de que el golpe está disparándose.
- **Centro:** el emoji 🎬 se sustituye por el propio logo de la app (`/logo.png`, insertado como `<image>` dentro del SVG) sobre el círculo con degradado — con la casualidad de que el logo de Plan Cine ya es literalmente un icono de ruleta/carrete, encaja perfecto.
- **Qué probé:** Docker a 1440px — reposo (logo visible en el centro, triángulo limpio) y varias capturas durante el giro para confirmar el golpe sincronizado. `npm run build` limpio.

### 7.5 (ajuste fino) — Puntero flotando + color que se confundía con la rueda ✅
- **Feedback del usuario:** el balanceo en reposo ("flotando") no encajaba — lo quería estático; y el degradado índigo del triángulo se parecía demasiado a los gajos del mismo tono, costaba distinguirlo.
- **Fix:** se quita por completo la animación de reposo (antes `animate={{y:[0,3,0]}}` en bucle infinito) — ahora el triángulo no se mueve salvo por el golpe sincronizado durante el giro, que se mantiene igual. Color de relleno de índigo a blanco (`#ffffff → #e2e8f0`), que contrasta con cualquier color de la paleta de la rueda (todos son tonos índigo/violeta/rosa, ninguno blanco), con contorno oscuro neutro en vez del contorno con tinte índigo de antes.
- **Qué probé:** Docker a 1440px — el triángulo blanco se distingue con claridad sobre cualquier gajo de fondo y permanece inmóvil hasta que empieza a girar. `npm run build` limpio.

### 7.5 (cierre) — Rueda de móvil más grande ✅
- **Petición del usuario:** agrandar la rueda en móvil para que se lean mejor los títulos.
- **Tamaño en móvil:** de 300px fijos a `min(340px, 100vw - 48px)` — crece hasta 340px en la mayoría de móviles, pero se adapta hacia abajo con seguridad en pantallas más estrechas para no desbordar nunca horizontalmente (verificado en 375px y 430px, sin scroll lateral en ninguno).
- **Sobre la orientación del texto:** probé a añadir una inclinación diagonal fija de 14° sobre la base radial, pero el usuario aclaró que se refería a la diagonal respecto al "pico" del gajo (la orientación radial que ya existía), no un giro añadido — con el añadido se veían "torcidas". Revertido a la orientación radial original tal cual estaba.
- **Qué probé:** Docker a 375px (iPhone SE) y 430px (iPhone Pro Max) — la rueda es visiblemente más grande, los títulos se leen mejor, sin overflow horizontal en ningún caso. `npm run build` limpio.

**Fase 7.5 (Ruleta) dada por cerrada tras varias rondas de ajuste fino con el usuario.**

---

## Fase 7 — Vista Desktop: COMPLETA (7.1 → 7.7)

---

## BUG CRÍTICO — Persistencia de sesión / Service Worker atascado ✅

> Reportado por el usuario: tanto en producción como en desarrollo, la sesión se
> "pierde" tras un rato de uso. En la PWA se queda en carga infinita y termina
> pidiendo volver a registrarse; en desktop se queda cargando la página sin más,
> obligando a borrar la caché del navegador para poder entrar de nuevo.

**No era un bug de tokens ni del store de auth.** Comprobado: Sanctum tiene
`'expiration' => null` (los tokens de acceso no caducan solos), y zustand-persist
(v5) rehidrata el store de forma síncrona desde `localStorage` antes de que
cualquier componente lo lea — no hay hueco de carrera ahí.

**La causa real estaba en el Service Worker (`public/sw.js`) y en cómo se registra
(`usePWAInstall.ts`):**

1. `usePWAInstall.ts` solo llamaba a `navigator.serviceWorker.register('/sw.js')`
   dentro de un `if` que se saltaba por completo en cuanto la PWA estaba instalada
   (`isStandalone()`) **o** el usuario ya había cerrado el banner de instalación
   una vez (`DISMISSED_KEY`). Es decir: justo en el momento en que más importa que
   el Service Worker se mantenga actualizado (la app instalada, en uso real), el
   código dejaba de intentar registrarlo/revisarlo para siempre.
2. El `fetch` handler del Service Worker cacheaba `/`, `/login` y `/register` con
   una estrategia "cache-first para siempre, sin revalidar nunca". La primera vez
   que se instalaba el Service Worker, esas páginas quedaban congeladas tal cual
   estaban en ese momento. En el siguiente despliegue, esa página vieja intenta
   cargar sus chunks de JS con hash antiguo — que ya no existen en el servidor —
   y la app se queda colgada en una carga infinita, sin ningún aviso, hasta que el
   usuario borra la caché a mano.

**Fix:**
- `usePWAInstall.ts` — el registro (y comprobación de actualización vía
  `reg.update()`) del Service Worker ahora se ejecuta siempre, fuera de los
  `if` de instalado/descartado. Añadido también un listener de
  `controllerchange` que recarga la página una vez cuando un Service Worker nuevo
  toma el control, para no quedarse nunca corriendo JS antiguo con un SW nuevo.
- `public/sw.js` — `/`, `/login` y `/register` **ya no se cachean en absoluto**.
  El `fetch` handler solo sirve desde caché los 4 assets estáticos que de verdad
  no cambian (logo, iconos, manifest); todo lo demás — HTML, chunks de
  `/_next/static`, la API — va siempre directo a red. El Service Worker pasa a
  tener un único trabajo (instalabilidad + notificaciones push), no una caché de
  app-shell offline — y así una versión vieja atascada nunca puede volver a
  secuestrar el arranque de la app. Versión de caché subida a `plan-cine-v3` para
  forzar la limpieza de la caché vieja (`plan-cine-v2`) en cuanto el nuevo SW se
  active.
- **Qué probé:** en Docker, tras iniciar sesión, confirmé por consola que el
  Service Worker se registra y queda `activated`, y que el contenido de la caché
  (`caches.keys()` / `cache.keys()`) contiene únicamente los 4 assets estáticos —
  ninguna ruta HTML. Esto es justo lo que garantiza que un despliegue nuevo nunca
  vuelva a dejar a nadie atascado.

### BUG CRÍTICO #2 — "Una sola sesión activa" mataba sesiones de otros dispositivos ✅
- **Lo que pasó:** tras el fix del Service Worker, el usuario reportó que su sesión
  volvió a perderse justo mientras yo verificaba los siguientes cambios (rueda de
  la ruleta). Causa: `AuthController::login` (backend) hacía
  `$user->tokens()->delete()` antes de crear el nuevo token — es decir, **solo
  puede haber un token activo por cuenta a la vez**. Cada vez que mis scripts de
  verificación automatizados iniciaban sesión con `mario@plancine.app` (la misma
  cuenta de seed que usa el usuario para probar) para comprobar una pantalla,
  invalidaban en el servidor el token de su sesión real en curso.
- **Por qué era un bug real más allá de mis pruebas:** el mismo problema afecta a
  cualquier uso legítimo con dos dispositivos a la vez (móvil + escritorio), que
  es justo el caso de uso que tiene sentido ahora que la app funciona bien en
  desktop — entrar en un dispositivo cerraría la sesión del otro sin avisar.
- **Fix (con confirmación explícita del usuario):** `backend/app/Http/Controllers/Api/AuthController.php`
  — se quita el `$user->tokens()->delete()` del método `login`. Cada login crea su
  propio token independiente; `logout` ya solo borraba
  `$request->user()->currentAccessToken()` (el token de esa sesión concreta), así
  que no hizo falta tocarlo.
- **Qué probé:** dos `curl` de login seguidos contra el backend de Docker con la
  misma cuenta — ambos tokens resultantes siguen devolviendo `200` en
  `/auth/me` simultáneamente (antes, el segundo login habría invalidado el
  primero). Multi-dispositivo confirmado funcionando.

---

## Control de versiones de este documento

| Fecha | Fase completada | Notas |
|-------|----------------|-------|
| 2026-07-18 | — | Documento creado |
| 2026-07-18 | Fase 1 | 1.1-1.4 completos. 1.5 requiere fix en backend Laravel |
| 2026-07-18 | Fase 2 | 2.1-2.4 completos. Hook useSheetAnimation + useLongPress |
| 2026-07-18 | Fase 3 | 3.1-3.3 completos. Skeletons shimmer + OfflineBanner + empty states |
| 2026-07-18 | Fase 4 | 4.1-4.4 completos. 4 tabs + NowPlayingBanner + SearchBar + Historial+Memories |
| 2026-09-08 | Fase 7.1 | Shell desktop: Sidebar + shell de layout + header/tabs de grupo. Resto de Fase 7 pendiente |
| 2026-09-08 | Fase 7.2 | ResponsiveSheet + migración de sheets del grupo y del perfil. Verificado en Docker |
| 2026-09-08 | Fase 7.3 | Grid de películas + hover-actions + sheets de películas migradas. Bug de título largo arreglado |
| 2026-09-08 | Fase 7.4 | Sheets de sesiones migradas + layout de lista/detalle. RescheduleSheet (dead code) eliminado |
| 2026-09-08 | Fase 7.5 | Ruleta y Duelo: alturas dinámicas para desktop, mode-switcher no estirado |
| 2026-09-08 | Fase 7.6 | Auth: card con glow en desktop para login/register |
| 2026-09-08 | Fase 7.7 | Pulido final: grids, dashboard de stats, perfil 2 columnas. Fase 7 completa |
| 2026-09-13 | Fase 7 fix | Grids de cards a ancho fijo (auto-fill) tras feedback de tamaño inconsistente |
| 2026-09-13 | Bug crítico | Service Worker atascado servía HTML cacheado para siempre → sesión "se perdía". Arreglado |

---

## Notas de trabajo

- **Yo (Claude) aviso siempre** qué archivos toqué al terminar cada bloque.
- **Tú pruebas** en el emulador antes de pasar al siguiente.
- **Si hay error**, lo iteramos en esa misma fase antes de avanzar.
- **El código nunca se sube** hasta que tú lo hayas validado.
- Cada fase es independiente y puede desplegarse por separado.
