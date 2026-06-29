export const GENRES = [
  'Romance', 'Acción', 'Fantasía', 'Drama', 'Comedia', 'Terror',
  'Aventura', 'Misterio', 'Sci-Fi', 'Histórico', 'BL', 'GL',
];

export const TAGS = [
  'Romance', 'Drama', 'Acción', 'GL', 'BL', 'Isekai', 'Escolar',
  'Comedia', 'Magia', 'Reencarnación', 'Sistema', 'Venganza',
  'Slice of Life', 'Terror', 'Psicológico',
];

export const NOVEL_STATUSES = {
  draft: 'Borrador',
  pending: 'Pendiente',
  approved: 'Publicada',
  rejected: 'Rechazada',
  hidden: 'Oculta',
  paused: 'Pausada',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

export const PUBLICATION_STATUSES = {
  draft: 'Borrador',
  ongoing: 'En curso',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const READING_STATUSES = {
  reading: 'Leyendo',
  want_to_read: 'Quiero leer',
  completed: 'Terminadas',
  paused: 'En pausa',
};

export const SORT_OPTIONS = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'oldest', label: 'Más antiguas' },
  { id: 'az', label: 'A-Z' },
  { id: 'za', label: 'Z-A' },
  { id: 'views', label: 'Más vistas' },
  { id: 'rating', label: 'Mejor valoradas' },
  { id: 'favorites', label: 'Más favoritas' },
];

export const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'ko', label: 'Coreano' },
  { id: 'zh', label: 'Chino' },
  { id: 'ja', label: 'Japonés' },
];

export const WHATSAPP_URL = 'https://wa.link/4rpknp';

export const NOVELS_PER_PAGE = 24;

export const HOME_SECTIONS = [
  { id: 'new', label: 'Novedades', filter: 'recent' },
  { id: 'updated', label: 'Actualizadas hoy', filter: 'updated_today' },
  { id: 'popular', label: 'Más leídas', filter: 'views' },
  { id: 'favorites', label: 'Más favoritas', filter: 'favorites' },
  { id: 'rated', label: 'Mejor valoradas', filter: 'rating' },
  { id: 'romance', label: 'Romance', genre: 'Romance' },
  { id: 'action', label: 'Acción', genre: 'Acción' },
  { id: 'comedy', label: 'Comedia', genre: 'Comedia' },
  { id: 'drama', label: 'Drama', genre: 'Drama' },
  { id: 'bl', label: 'BL', genre: 'BL' },
  { id: 'gl', label: 'GL', genre: 'GL' },
  { id: 'horror', label: 'Terror', genre: 'Terror' },
];
