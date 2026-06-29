import { useEffect } from 'react';

export function SEO({ title, description, image, type = 'website' }) {
  const siteName = 'Strawberry Shelf';
  const fullTitle = title ? `${title} · ${siteName}` : siteName;
  const desc = description || 'Novelas traducidas con amor. Lee, descubre y comparte historias en Strawberry Shelf.';

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);

      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }

      el.setAttribute('content', content);
    };

    setMeta('description', desc);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', siteName, true);

    if (image) {
      setMeta('og:image', image, true);
    }
  }, [fullTitle, desc, image, type]);

  return null;
}
