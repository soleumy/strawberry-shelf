# Strawberry Shelf - Setup & Migration Guide

## Database Migrations

La base de datos ya contiene las siguientes tablas (migrations aplicadas en Supabase):
- `profiles` — usuarios con avatar, banner, estadísticas
- `novels` — novelas con metadatos (título, descripción, géneros, estado)
- `chapters` — capítulos de novelas con orden y contenido
- `favorites` — marcadores de novelas favoritas
- `reading_list` — lista de lectura (estados: reading, want_to_read, completed, paused)
- `collections` — colecciones públicas/privadas de novelas
- `collection_items` — ítems en colecciones
- `followers` — seguidor/seguido de usuarios
- `comments` — comentarios con replies (parent_id)
- `ratings` — calificaciones 1-5 de novelas/capítulos
- `notifications` — notificaciones de eventos
- `reading_history` — historial de lectura (posición, porcentaje)
- `activity` — feed de actividad (follow, new_novel, new_chapter, favorite, comment)
- `reports` — reportes de abuso
- `messages` — mensajes privados

## Rutas Implementadas

### Públicas
- `/` — Frontpage con tendencias, top-rated, recientes
- `/search` — Búsqueda avanzada con filtros
- `/novel/:id` — Detalle de novela con comentarios y calificaciones
- `/novel/:id/chapter/:chapterId` — Lector con preferencias (dark mode, font size, etc)
- `/user/:id` — Perfil de usuario con novelas, colecciones, actividad
- `/library` — Biblioteca personal (favoritos, leyendo, completadas, etc)
- `/collections` — Colecciones públicas
- `/feed` — Feed de actividad

### Privadas (Dashboard)
- `/dashboard/novels` — Mis novelas
- `/dashboard/novels/:id/edit` — Editar novela
- `/dashboard/novels/:id/chapters` — Gestor de capítulos
- `/dashboard/novels/:id/chapters/:id/edit` — Editor de capítulos
- `/dashboard/collections` — Mis colecciones
- `/dashboard/drafts` — Borradores
- `/dashboard/notifications` — Mis notificaciones
- `/dashboard/messages` — Mensajes privados
- `/dashboard/settings` — Configuración

### Admin
- `/admin` — Panel de administración (reportes, usuarios)

## APIs Implementadas

### Profiles
- `getProfile(id)` — obtener perfil
- `getProfileByUsername(username)` — buscar por username
- `upsertProfile(data)` — crear/actualizar perfil
- `searchProfiles(query)` — buscar perfiles

### Novels & Chapters
- `createNovel(data)` — crear novela
- `updateNovel(id, data)` — actualizar
- `getNovel(id)` — obtener novela
- `listNovels(userId)` — listar novelas del usuario
- `createChapter(data)` — crear capítulo
- `updateChapter(id, data)` — actualizar
- `deleteChapter(id)` — eliminar
- `reorderChapters(novelId, order)` — reordenar capítulos
- `getChaptersByNovel(novelId)` — obtener capítulos

### Collections & Library
- `createCollection(data)` — crear colección
- `updateCollection(id, data)` — actualizar
- `deleteCollection(id)` — eliminar
- `getCollection(id)` — obtener colección
- `listUserCollections(userId)` — listar colecciones del usuario
- `addItemToCollection(collectionId, novelId)` — añadir novela
- `removeItemFromCollection(collectionId, novelId)` — remover
- `addFavorite(userId, novelId)` — marcar favorita
- `removeFavorite(userId, novelId)` — desmarcar
- `isFavorited(userId, novelId)` — verificar
- `setReadingStatus(userId, novelId, status)` — cambiar estado lectura
- `getReadingList(userId)` — obtener lista lectura

### Followers & Activity
- `followUser(followerId, followingId)` — seguir usuario
- `unfollowUser(followerId, followingId)` — dejar de seguir
- `getFollowers(userId)` — obtener seguidores
- `getFollowing(userId)` — obtener seguidos
- `isFollowing(followerId, followingId)` — verificar si sigue
- `createActivity(data)` — crear evento de actividad
- `getRecentActivity(limit)` — obtener actividad reciente
- `getFeedForUser(userId, limit)` — obtener feed personalizado

### Comments & Ratings
- `createComment(data)` — crear comentario
- `getComments(novelId, chapterId)` — obtener comentarios
- `getReplies(parentId)` — obtener respuestas
- `updateComment(id, content)` — actualizar
- `deleteComment(id)` — eliminar
- `reportComment(id, reason)` — reportar
- `rateNovel(userId, novelId, score)` — calificar novela
- `removeRating(userId, novelId)` — remover calificación
- `getAverageRating(novelId)` — promedio de calificaciones
- `getUserRating(userId, novelId)` — obtener calificación del usuario

### Search
- `searchNovels(query, filters)` — búsqueda avanzada
- `searchProfiles(query)` — buscar perfiles
- `getNovelsWithRatings(limit)` — obtener mejores calificados
- `getTrendingNovels(daysBack)` — obtener tendencias
- `getNovelsByGenre(genre)` — filtrar por género

### Reading History
- `saveReadingProgress(userId, novelId, chapterId, position, percent)` — guardar progreso
- `getReadingProgress(userId, novelId)` — obtener progreso
- `getReadingHistory(userId)` — obtener historial
- `clearReadingHistory(userId, novelId)` — limpiar

## Componentes Implementados

### Reusables
- `FollowButton` — seguir/dejar de seguir
- `FavoriteButton` — marcar favorita
- `RatingWidget` — calificaciones 1-5
- `Comments` — sección de comentarios con replies
- `ReaderSettings` — preferencias del lector (dark mode, fuente, tamaño)

### Páginas de Dashboard
- `MyNovels` — listar mis novelas
- `EditNovel` — editar novela con cover upload
- `ChapterManager` — gestor de capítulos (reordenar, duplicar, eliminar)
- `ChapterEditor` — editor de capítulos (crear, editar, publicar, borrador)
- `Collections` — gestor de colecciones
- `AdminPanel` — panel de admin (reportes, usuarios)

## Próximos Pasos

### Completar (si aplica)
- [ ] Actualizar `App.jsx` con rutas de Search y FrontPage
- [ ] Mejorar componentes con CSS/Tailwind (solo stubs básicos ahora)
- [ ] Implementar lazy loading e infinite scroll
- [ ] Agregar paginación en búsqueda y frontpage
- [ ] Pruebas unitarias
- [ ] Deploy y CI/CD
- [ ] SEO optimización
- [ ] PWA y offline mode

## Environment Variables

Necesarios en `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Buckets de Storage

Crear en Supabase Storage:
- `avatars` — fotos de perfil
- `banners` — banners de perfil
- `covers` — portadas de novelas
- `uploads` — archivos de capítulos

## Políticas RLS

Todas las tablas están con RLS habilitado. Las políticas incluyen:
- Lectura pública de novelas/perfiles
- Escritura solo por propietario o admin
- Borrado solo por propietario o admin

Revisar y hardener según necesidades de producción.

## Setup Local

1. Clonar repo
2. `npm install`
3. Configurar .env con credenciales Supabase
4. Aplicar migraciones en Supabase (via SQL editor o CLI)
5. `npm run dev` para desarrollo
6. `npm run build` para producción
