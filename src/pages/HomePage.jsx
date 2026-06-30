import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  FolderHeart,
  Heart,
  History,
  LayoutDashboard,
  LogIn,
  Search,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mergeNovels } from '../lib/novelUtils';

const GENRES = ['Romance', 'Fantasia', 'Accion', 'Drama', 'BL', 'GL', 'Comedia', 'Misterio'];

const ICONS = {
  strawberry: '\uD83C\uDF53',
  fire: '\uD83D\uDD25',
  book: '\uD83D\uDCD6',
  comment: '\uD83D\uDCAC',
  heart: '\uD83D\uDC97',
  sparkle: '\u2726',
  sparkleAlt: '\u2727',
};

function cleanText(value) {
  return String(value || '')
    .replace(/ÃƒÂ¡|Ã¡/g, 'a')
    .replace(/ÃƒÂ©|Ã©/g, 'e')
    .replace(/ÃƒÂ­|Ã­/g, 'i')
    .replace(/ÃƒÂ³|Ã³/g, 'o')
    .replace(/ÃƒÂº|Ãº/g, 'u')
    .replace(/ÃƒÂ±|Ã±/g, 'n')
    .replace(/ÃƒÂ|Ã/g, 'A')
    .replace(/Ãƒâ€°|Ã‰/g, 'E')
    .replace(/ÃƒÂ|Ã/g, 'I')
    .replace(/Ãƒâ€œ|Ã“/g, 'O')
    .replace(/ÃƒÅ¡|Ãš/g, 'U')
    .replace(/Ãƒâ€˜|Ã‘/g, 'N')
    .replace(/â•¹/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCover(novel) {
  return novel?.cover_url || novel?.cover || '/placeholder-cover.png';
}

function getAuthorName(novel) {
  if (novel?.author && typeof novel.author === 'object') {
    return novel.author.display_name || novel.author.username || 'Comunidad';
  }

  return novel?.author_name ||
    novel?.author_name_override ||
    novel?.author ||
    novel?.translator ||
    'Comunidad';
}

function getChaptersCount(novel) {
  if (typeof novel?.chapters_count === 'number') return novel.chapters_count;
  if (Array.isArray(novel?.chapters)) return novel.chapters.length;
  return novel?.chaptersCount || 0;
}

function getNovelGenres(novel) {
  const genres = Array.isArray(novel?.genres) ? novel.genres : [];
  const tags = Array.isArray(novel?.tags) ? novel.tags : [];
  return [...genres, ...tags].filter(Boolean).map(cleanText);
}

function normalizeSearch(value) {
  return cleanText(value).toLowerCase();
}

function getRatingLabel(index) {
  return [4.8, 4.7, 4.9, 4.6, 4.5, 4.8][index % 6].toFixed(1);
}

function getReadsLabel(index) {
  return `${[12.4, 9.8, 7.1, 15.2, 6.3, 11.6][index % 6]}K`;
}

function NovelCard({ novel, index }) {
  const tags = getNovelGenres(novel);
  const title = cleanText(novel?.title || 'Sin titulo');
  const author = cleanText(getAuthorName(novel));

  return (
    <Link to={`/novel/${novel.id}`} className="home-v2-card">
      <div className="home-v2-cover">
        <img
          src={getCover(novel)}
          alt={title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/placeholder-cover.png';
          }}
        />

        {index === 0 && <span className="home-v2-badge">Nuevo</span>}
        {index === 3 && <span className="home-v2-badge">Popular</span>}

        <div className="home-v2-cover-gradient" />

        <div className="home-v2-card-copy">
          <h3>{title}</h3>
          <p>{author}</p>

          <div className="home-v2-card-meta">
            <span><Star size={13} fill="currentColor" /> {getRatingLabel(index)}</span>
            <span>{getReadsLabel(index)}</span>
          </div>
        </div>
      </div>

      <div className="home-v2-card-tags">
        <span>{tags[0] || 'Romance'}</span>
        <span>{tags[1] || `${getChaptersCount(novel)} caps`}</span>
      </div>
    </Link>
  );
}

function QuickCard({ icon: Icon, title, text, to }) {
  return (
    <Link to={to} className="home-v2-quick-card">
      <span><Icon size={28} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </Link>
  );
}

function ActivityCard({ icon, title, text, time }) {
  return (
    <article className="home-v2-activity-card">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small>{time}</small>
      </div>
    </article>
  );
}

export function HomePage() {
  const { user, profile } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  useEffect(() => {
    let active = true;

    async function loadNovels() {
      setLoading(true);
      let remoteNovels = [];

      try {
        if (supabase.isConfigured !== false) {
          const { data: novelsData, error: novelsError } = await supabase
            .from('novels')
            .select('*')
            .order('created_at', { ascending: false });

          if (novelsError) throw novelsError;

          const novelList = novelsData || [];
          const novelIds = novelList.map((novel) => novel.id);
          let chapters = [];

          if (novelIds.length > 0) {
            const { data: chaptersData } = await supabase
              .from('chapters')
              .select('id, novel_id')
              .in('novel_id', novelIds);

            chapters = chaptersData || [];
          }

          remoteNovels = novelList.map((novel) => ({
            ...novel,
            id: String(novel.id),
            chapters_count: chapters.filter((chapter) => String(chapter.novel_id) === String(novel.id)).length,
          }));
        }
      } catch {
        remoteNovels = [];
      }

      if (active) {
        setNovels(mergeNovels(remoteNovels));
        setLoading(false);
      }
    }

    loadNovels();

    return () => {
      active = false;
    };
  }, []);

  const filteredNovels = useMemo(() => {
    const text = normalizeSearch(query);

    return novels.filter((novel) => {
      const title = normalizeSearch(novel.title);
      const author = normalizeSearch(getAuthorName(novel));
      const tags = getNovelGenres(novel).map(normalizeSearch).join(' ');

      const matchesQuery = !text || title.includes(text) || author.includes(text) || tags.includes(text);
      const matchesGenre = !selectedGenre || tags.includes(normalizeSearch(selectedGenre));

      return matchesQuery && matchesGenre;
    });
  }, [novels, query, selectedGenre]);

  const popularNovels = filteredNovels.slice(0, 6);
  const newestNovels = novels.slice(0, 3);

  const topAuthors = useMemo(() => {
    const byAuthor = new Map();

    novels.forEach((novel) => {
      const author = cleanText(getAuthorName(novel));
      if (!author) return;
      byAuthor.set(author, (byAuthor.get(author) || 0) + 1);
    });

    return [...byAuthor.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [novels]);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || '';

  return (
    <div className="home-v2-page">
      <SEO
        title="Strawberry Shelf"
        description="Lee, descubre y comparte novelas que te haran sentir."
      />

      <style>{`
        .home-v2-page {
          min-height: 100vh;
          color: #563043;
          background:
            radial-gradient(circle at 17% 17%, rgba(255,255,255,.95) 0 2px, transparent 3px),
            radial-gradient(circle at 88% 28%, rgba(255,255,255,.9) 0 2px, transparent 3px),
            linear-gradient(to right, rgba(255, 151, 177, .17) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 151, 177, .17) 1px, transparent 1px),
            linear-gradient(180deg, #ffe7ef 0%, #fff8fb 42%, #ffe2ec 100%);
          background-size: 190px 190px, 240px 240px, 28px 28px, 28px 28px, auto;
          padding: 14px;
        }

        .home-v2-shell {
          width: min(1180px, 100%);
          margin: 0 auto;
          border: 2px solid rgba(255, 158, 188, .82);
          border-radius: 16px;
          background: rgba(255,255,255,.42);
          box-shadow: 0 24px 80px rgba(184, 72, 110, .14);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .home-v2-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 20px;
          padding: 18px 28px;
          border-bottom: 1px solid rgba(255, 166, 196, .55);
          background: rgba(255,255,255,.82);
          backdrop-filter: blur(18px);
        }

        .home-v2-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #f04f87;
          font-weight: 950;
          line-height: .86;
        }

        .home-v2-logo-mark {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          border-radius: 16px;
          background: linear-gradient(180deg, #fff, #ffe1ea);
          border: 1px solid #ffc4d5;
          box-shadow: inset 0 -4px 0 rgba(244, 91, 143, .16);
          font-size: 25px;
        }

        .home-v2-logo strong {
          font-size: 1.25rem;
          letter-spacing: 0;
        }

        .home-v2-nav {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .home-v2-nav a,
        .home-v2-nav button {
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: #8f3d59;
          padding: 10px 15px;
          font-size: .85rem;
          font-weight: 900;
          cursor: pointer;
        }

        .home-v2-nav a:hover,
        .home-v2-nav button:hover,
        .home-v2-nav .active {
          background: #ffe2eb;
          color: #ef4f86;
        }

        .home-v2-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
        }

        .home-v2-icon-button,
        .home-v2-avatar {
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: #8f3d59;
        }

        .home-v2-icon-button {
          position: relative;
          width: 38px;
          height: 38px;
        }

        .home-v2-icon-button:hover {
          background: #ffe2eb;
          color: #ef4f86;
        }

        .home-v2-dot {
          position: absolute;
          top: 5px;
          right: 4px;
          display: grid;
          min-width: 18px;
          height: 18px;
          place-items: center;
          border-radius: 999px;
          background: #ff4f8d;
          color: white;
          font-size: .66rem;
          font-weight: 950;
        }

        .home-v2-avatar {
          width: 42px;
          height: 42px;
          overflow: hidden;
          border: 2px solid #ff9fbd;
          background: #ffe1ea;
          color: #ef4f86;
        }

        .home-v2-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .home-v2-main {
          padding: 30px clamp(18px, 4vw, 48px) 36px;
        }

        .home-v2-hero {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(320px, 1.05fr) minmax(190px, .42fr);
          gap: 22px;
          align-items: center;
          padding: 18px 0 28px;
        }

        .home-v2-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          border: 1px solid #ffc4d5;
          border-radius: 999px;
          background: rgba(255,255,255,.78);
          color: #b84d6d;
          padding: 8px 14px;
          font-size: .82rem;
          font-weight: 900;
        }

        .home-v2-hero h1 {
          margin: 18px 0 12px;
          color: #44283a;
          font-size: clamp(2.45rem, 5vw, 4.3rem);
          line-height: .95;
          font-weight: 950;
          letter-spacing: 0;
        }

        .home-v2-hero h1 span {
          display: block;
          color: #ef4f86;
        }

        .home-v2-hero p {
          max-width: 410px;
          margin: 0;
          color: #7e4058;
          line-height: 1.55;
          font-weight: 750;
        }

        .home-v2-hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }

        .home-v2-primary,
        .home-v2-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          border-radius: 12px;
          padding: 0 18px;
          font-size: .86rem;
          font-weight: 950;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .home-v2-primary {
          border: 0;
          background: linear-gradient(180deg, #ff87ad, #ef4f86);
          color: #fff;
          box-shadow: 0 8px 18px rgba(239, 79, 134, .28);
          cursor: pointer;
        }

        .home-v2-secondary {
          border: 1px solid #ffc4d5;
          background: rgba(255,255,255,.84);
          color: #8f3d59;
        }

        .home-v2-primary:hover,
        .home-v2-secondary:hover {
          transform: translateY(-2px);
        }

        .home-v2-hero-art {
          position: relative;
          min-height: 330px;
          border-radius: 42px;
          background:
            radial-gradient(circle at 52% 25%, rgba(255,255,255,.95) 0 70px, transparent 71px),
            linear-gradient(135deg, rgba(255,255,255,.52), rgba(255,230,238,.64));
        }

        .home-v2-sparkle {
          position: absolute;
          color: rgba(156, 86, 107, .22);
          font-size: 1.4rem;
        }

        .home-v2-sparkle.one { left: 10%; top: 15%; }
        .home-v2-sparkle.two { right: 16%; top: 22%; }
        .home-v2-sparkle.three { left: 22%; bottom: 24%; }

        .home-v2-book-stack {
          position: absolute;
          left: 50%;
          top: 52%;
          width: min(330px, 82%);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
        }

        .home-v2-strawberry {
          position: absolute;
          left: 50%;
          top: 2%;
          z-index: 4;
          width: 142px;
          height: 142px;
          border-radius: 48% 52% 54% 46%;
          background:
            radial-gradient(circle at 32% 32%, rgba(255,255,255,.7) 0 7px, transparent 8px),
            radial-gradient(circle at 55% 52%, rgba(255,255,255,.55) 0 5px, transparent 6px),
            linear-gradient(145deg, #ff3f6f, #d9164a);
          box-shadow: 0 18px 40px rgba(207, 35, 79, .25);
          transform: translateX(-50%) rotate(-8deg);
        }

        .home-v2-strawberry::before {
          content: "";
          position: absolute;
          top: -16px;
          left: 40px;
          width: 62px;
          height: 38px;
          background: #68b04d;
          clip-path: polygon(50% 0, 62% 34%, 100% 24%, 72% 52%, 86% 100%, 50% 68%, 14% 100%, 28% 52%, 0 24%, 38% 34%);
        }

        .home-v2-strawberry::after {
          content: "";
          position: absolute;
          inset: 20px;
          background-image:
            radial-gradient(circle, rgba(255, 222, 96, .95) 0 3px, transparent 4px),
            radial-gradient(circle, rgba(255, 222, 96, .85) 0 2px, transparent 3px);
          background-size: 28px 32px, 34px 30px;
          background-position: 0 0, 12px 16px;
        }

        .home-v2-book {
          position: absolute;
          left: 50%;
          width: 245px;
          height: 54px;
          border-radius: 14px 22px 22px 14px;
          box-shadow: 0 14px 26px rgba(136, 68, 88, .18);
          transform: translateX(-50%) rotate(var(--tilt));
        }

        .home-v2-book.one {
          top: 44%;
          --tilt: 2deg;
          background: linear-gradient(90deg, #ff9dbb, #ff6f9d);
          z-index: 3;
        }

        .home-v2-book.two {
          top: 58%;
          --tilt: -3deg;
          background: linear-gradient(90deg, #ffd18a, #ffac55);
          z-index: 2;
        }

        .home-v2-book.three {
          top: 70%;
          --tilt: 4deg;
          background: linear-gradient(90deg, #8bcf76, #54a84b);
          z-index: 1;
        }

        .home-v2-book::after {
          content: "";
          position: absolute;
          right: 12px;
          top: 10px;
          bottom: 10px;
          width: 74%;
          border-radius: 12px;
          background: rgba(255,255,255,.58);
        }

        .home-v2-heart-float {
          position: absolute;
          left: 18%;
          top: 36%;
          color: #ff6b9b;
          filter: drop-shadow(0 10px 18px rgba(239, 79, 134, .22));
        }

        .home-v2-quick-grid {
          display: grid;
          gap: 14px;
        }

        .home-v2-quick-card {
          display: grid;
          min-height: 132px;
          place-items: center;
          border: 1px solid #ffc4d5;
          border-radius: 18px;
          background: rgba(255,255,255,.74);
          color: #8f3d59;
          padding: 18px 12px;
          text-align: center;
          box-shadow: 0 14px 30px rgba(184, 72, 110, .08);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .home-v2-quick-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 36px rgba(184, 72, 110, .14);
        }

        .home-v2-quick-card span {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(180deg, #ff9cbd, #f05a8d);
          color: #fff;
        }

        .home-v2-quick-card strong {
          color: #ef4f86;
          font-size: .9rem;
          font-weight: 950;
        }

        .home-v2-quick-card p {
          margin: -2px 0 0;
          color: #7e4058;
          font-size: .76rem;
          line-height: 1.35;
          font-weight: 750;
        }

        .home-v2-section {
          margin-top: 22px;
        }

        .home-v2-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .home-v2-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          color: #563043;
          font-size: 1.08rem;
          font-weight: 950;
        }

        .home-v2-see-more {
          border: 1px solid #ffc4d5;
          border-radius: 999px;
          background: rgba(255,255,255,.78);
          color: #aa4966;
          padding: 8px 13px;
          font-size: .78rem;
          font-weight: 950;
        }

        .home-v2-card-row {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
        }

        .home-v2-cover {
          position: relative;
          overflow: hidden;
          border: 1px solid #ffb3ca;
          border-radius: 14px;
          aspect-ratio: 4 / 5.45;
          background: #ffe1ea;
          box-shadow: 0 16px 34px rgba(102, 48, 71, .16);
        }

        .home-v2-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .24s ease;
        }

        .home-v2-card:hover .home-v2-cover img {
          transform: scale(1.04);
        }

        .home-v2-cover-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 32%, rgba(37, 20, 30, .88));
        }

        .home-v2-badge {
          position: absolute;
          right: 8px;
          top: 8px;
          z-index: 2;
          border-radius: 999px;
          background: #ff4f8d;
          color: #fff;
          padding: 4px 8px;
          font-size: .62rem;
          font-weight: 950;
        }

        .home-v2-card-copy {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 9px;
          z-index: 2;
          color: #fff;
        }

        .home-v2-card-copy h3 {
          display: -webkit-box;
          margin: 0;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          font-size: .92rem;
          font-weight: 950;
          line-height: 1.13;
        }

        .home-v2-card-copy p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.86);
          font-size: .72rem;
          font-weight: 800;
        }

        .home-v2-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          color: #ffd36f;
          font-size: .73rem;
          font-weight: 950;
        }

        .home-v2-card-meta span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .home-v2-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .home-v2-card-tags span,
        .home-v2-genre-strip button {
          border: 1px solid #ffc4d5;
          background: rgba(255,255,255,.78);
          color: #8f3d59;
          font-weight: 850;
        }

        .home-v2-card-tags span {
          border-radius: 999px;
          padding: 5px 8px;
          font-size: .68rem;
        }

        .home-v2-genre-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 10px 2px 4px;
        }

        .home-v2-genre-strip button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 39px;
          border-radius: 12px;
          padding: 0 16px;
          font-size: .82rem;
          white-space: nowrap;
          cursor: pointer;
        }

        .home-v2-genre-strip button.active,
        .home-v2-genre-strip button:hover {
          border-color: #ff7da7;
          background: #fff0f5;
          color: #ef4f86;
        }

        .home-v2-lower-grid {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 22px;
          align-items: start;
          margin-top: 24px;
        }

        .home-v2-activity-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .home-v2-activity-card,
        .home-v2-author-card,
        .home-v2-join-card,
        .home-v2-catalog-panel {
          border: 1px solid #ffc4d5;
          background: rgba(255,255,255,.72);
          box-shadow: 0 14px 34px rgba(184, 72, 110, .08);
        }

        .home-v2-activity-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          min-height: 128px;
          border-radius: 14px;
          padding: 18px;
        }

        .home-v2-activity-card > span {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 999px;
          background: #fff0f5;
        }

        .home-v2-activity-card strong {
          display: block;
          color: #ef4f86;
          font-size: .84rem;
          font-weight: 950;
        }

        .home-v2-activity-card p {
          margin: 8px 0;
          color: #704056;
          font-size: .82rem;
          line-height: 1.45;
          font-weight: 750;
        }

        .home-v2-activity-card small {
          color: #a75a74;
          font-weight: 800;
        }

        .home-v2-author-card {
          border-radius: 14px;
          padding: 18px;
        }

        .home-v2-author-card h3 {
          margin: 0 0 14px;
          color: #ef4f86;
          font-size: 1rem;
          font-weight: 950;
        }

        .home-v2-author-list {
          display: grid;
          gap: 12px;
        }

        .home-v2-author-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: center;
        }

        .home-v2-author-avatar {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 999px;
          background: linear-gradient(180deg, #ff9cbd, #f05a8d);
          color: #fff;
          font-weight: 950;
        }

        .home-v2-author-item strong {
          display: block;
          color: #563043;
          font-size: .84rem;
          font-weight: 950;
        }

        .home-v2-author-item span {
          color: #9b5068;
          font-size: .72rem;
          font-weight: 800;
        }

        .home-v2-author-card .home-v2-secondary {
          width: 100%;
          margin-top: 16px;
          min-height: 38px;
        }

        .home-v2-join-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          margin-top: 24px;
          border-radius: 14px;
          padding: 18px 22px;
        }

        .home-v2-join-icon {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border-radius: 20px;
          background: linear-gradient(180deg, #ff9cbd, #f05a8d);
          color: #fff;
          font-size: 1.55rem;
        }

        .home-v2-join-card strong {
          display: block;
          color: #ef4f86;
          font-size: 1rem;
          font-weight: 950;
        }

        .home-v2-join-card p {
          margin: 4px 0 0;
          color: #704056;
          font-size: .84rem;
          font-weight: 750;
        }

        .home-v2-catalog-panel {
          margin-top: 28px;
          border-radius: 18px;
          background: rgba(255,255,255,.56);
          padding: 18px;
        }

        .home-v2-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          width: min(360px, 100%);
          min-height: 44px;
          border: 1px solid #ffc4d5;
          border-radius: 999px;
          background: rgba(255,255,255,.86);
          color: #ef4f86;
          padding: 0 14px;
        }

        .home-v2-search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #563043;
          font-weight: 850;
        }

        .home-v2-empty {
          border: 1px solid #ffc4d5;
          border-radius: 16px;
          background: rgba(255,255,255,.74);
          color: #8f3d59;
          padding: 24px;
          text-align: center;
          font-weight: 900;
        }

        @media (max-width: 1060px) {
          .home-v2-hero {
            grid-template-columns: 1fr;
          }

          .home-v2-quick-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .home-v2-card-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .home-v2-lower-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 780px) {
          .home-v2-header {
            grid-template-columns: 1fr;
            justify-items: start;
          }

          .home-v2-nav {
            justify-content: flex-start;
          }

          .home-v2-actions {
            width: 100%;
            justify-content: space-between;
          }

          .home-v2-main {
            padding: 22px 14px 28px;
          }

          .home-v2-quick-grid,
          .home-v2-activity-grid {
            grid-template-columns: 1fr;
          }

          .home-v2-card-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .home-v2-join-card {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
          }

          .home-v2-section-head {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .home-v2-page {
            padding: 8px;
          }

          .home-v2-card-row {
            gap: 12px;
          }

          .home-v2-hero h1 {
            font-size: 2.65rem;
          }
        }
      `}</style>

      <div className="home-v2-shell">
        <header className="home-v2-header">
          <Link to="/" className="home-v2-logo">
            <span className="home-v2-logo-mark">{ICONS.strawberry}</span>
            <strong>strawberry<br />shelf</strong>
          </Link>

          <nav className="home-v2-nav">
            <button type="button" className="active" onClick={() => scrollToSection('inicio')}>Inicio</button>
            <button type="button" onClick={() => scrollToSection('catalogo')}>Cat&aacute;logo</button>
            <Link to="/search">Buscar</Link>
            <Link to="/library">Biblioteca</Link>
            <Link to="/dashboard">Mi panel</Link>
          </nav>

          <div className="home-v2-actions">
            <Link to="/search" className="home-v2-icon-button" aria-label="Buscar">
              <Search size={20} />
            </Link>

            <Link to="/dashboard/notifications" className="home-v2-icon-button" aria-label="Notificaciones">
              <Bell size={20} />
              <span className="home-v2-dot">3</span>
            </Link>

            {user ? (
              <Link to={`/user/${user.id}`} className="home-v2-avatar" aria-label="Perfil">
                {avatarUrl ? <img src={avatarUrl} alt="Perfil" /> : <UserRound size={21} />}
              </Link>
            ) : (
              <Link to="/login" className="home-v2-avatar" aria-label="Iniciar sesion">
                <LogIn size={21} />
              </Link>
            )}
          </div>
        </header>

        <main id="inicio" className="home-v2-main">
          <section className="home-v2-hero">
            <div>
              <span className="home-v2-pill">
                <Sparkles size={15} /> Novedades y actualizaciones cada d&iacute;a
              </span>

              <h1>
                Historias que
                <span>te acompa&ntilde;an</span>
              </h1>

              <p>Lee, descubre y comparte novelas que te har&aacute;n sentir.</p>

              <div className="home-v2-hero-buttons">
                <button type="button" className="home-v2-primary" onClick={() => scrollToSection('catalogo')}>
                  Explorar cat&aacute;logo <BookOpen size={17} />
                </button>

                <Link to="/search" className="home-v2-secondary">
                  B&uacute;squeda avanzada
                </Link>
              </div>
            </div>

            <div className="home-v2-hero-art" aria-hidden="true">
              <span className="home-v2-sparkle one">{ICONS.sparkle}</span>
              <span className="home-v2-sparkle two">{ICONS.sparkleAlt}</span>
              <span className="home-v2-sparkle three">{ICONS.sparkle}</span>
              <Heart className="home-v2-heart-float" size={42} fill="currentColor" />

              <div className="home-v2-book-stack">
                <div className="home-v2-strawberry" />
                <div className="home-v2-book one" />
                <div className="home-v2-book two" />
                <div className="home-v2-book three" />
              </div>
            </div>

            <div className="home-v2-quick-grid">
              <QuickCard icon={BookOpen} title="Continua leyendo" text="Retoma donde lo dejaste" to="/library" />
              <QuickCard icon={FolderHeart} title="Mis colecciones" text="Tus historias organizadas" to="/collections" />
              <QuickCard icon={History} title="Historial" text="Tu progreso de lectura" to="/library" />
            </div>
          </section>

          <section className="home-v2-section">
            <div className="home-v2-section-head">
              <h2 className="home-v2-section-title">{ICONS.fire} Populares esta semana</h2>
              <Link to="/search" className="home-v2-see-more">Ver m&aacute;s</Link>
            </div>

            {loading ? (
              <div className="home-v2-empty">Cargando novelas...</div>
            ) : popularNovels.length === 0 ? (
              <div className="home-v2-empty">Todav&iacute;a no hay novelas para mostrar.</div>
            ) : (
              <div className="home-v2-card-row">
                {popularNovels.map((novel, index) => (
                  <NovelCard key={novel.id} novel={novel} index={index} />
                ))}
              </div>
            )}
          </section>

          <section className="home-v2-section">
            <div className="home-v2-genre-strip">
              <button
                type="button"
                className={!selectedGenre ? 'active' : ''}
                onClick={() => setSelectedGenre('')}
              >
                <Heart size={15} /> Todo
              </button>

              {GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className={selectedGenre === genre ? 'active' : ''}
                  onClick={() => setSelectedGenre(genre)}
                >
                  <Sparkles size={15} /> {genre}
                </button>
              ))}
            </div>
          </section>

          <section className="home-v2-lower-grid">
            <div>
              <div className="home-v2-section-head">
                <h2 className="home-v2-section-title">Actividad de la comunidad</h2>
              </div>

              <div className="home-v2-activity-grid">
                <ActivityCard
                  icon={ICONS.book}
                  title="Nuevo capitulo"
                  text={`${cleanText(newestNovels[0]?.title || 'Una historia')} recibio una actualizacion.`}
                  time="Hace 2 horas"
                />

                <ActivityCard
                  icon={ICONS.comment}
                  title="Nuevo comentario"
                  text={`${cleanText(newestNovels[1]?.title || 'Una novela')} tiene conversacion nueva.`}
                  time="Hace 4 horas"
                />

                <ActivityCard
                  icon={ICONS.heart}
                  title="Nueva resena"
                  text={`${cleanText(newestNovels[2]?.title || 'Una lectura')} fue anadida a favoritos.`}
                  time="Hace 6 horas"
                />
              </div>
            </div>

            <aside className="home-v2-author-card">
              <h3>Top autores</h3>

              <div className="home-v2-author-list">
                {(topAuthors.length > 0 ? topAuthors : [['Luna', 3], ['EscritoNocturno', 2], ['MikaWrites', 1]]).map(([author, count]) => (
                  <div key={author} className="home-v2-author-item">
                    <span className="home-v2-author-avatar">{String(author).slice(0, 1).toUpperCase()}</span>
                    <div>
                      <strong>{cleanText(author)}</strong>
                      <span>{count} novelas</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/search" className="home-v2-secondary">Ver todos</Link>
            </aside>
          </section>

          <section className="home-v2-join-card">
            <span className="home-v2-join-icon">{ICONS.strawberry}</span>

            <div>
              <strong>Hecho con amor por lectores como t&uacute;</strong>
              <p>&Uacute;nete a nuestra comunidad y comparte tu pasi&oacute;n por la lectura.</p>
            </div>

            {user ? (
              <Link to="/dashboard" className="home-v2-primary">
                Mi panel <LayoutDashboard size={17} />
              </Link>
            ) : (
              <Link to="/login" className="home-v2-primary">
                &Uacute;nete ahora <LogIn size={17} />
              </Link>
            )}
          </section>

          <section id="catalogo" className="home-v2-catalog-panel">
            <div className="home-v2-section-head">
              <h2 className="home-v2-section-title">Todas las novelas</h2>

              <label className="home-v2-search-box">
                <Search size={17} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar novela..."
                />
              </label>
            </div>

            {loading ? (
              <div className="home-v2-empty">Cargando cat&aacute;logo...</div>
            ) : filteredNovels.length === 0 ? (
              <div className="home-v2-empty">No encontre novelas con esa busqueda.</div>
            ) : (
              <div className="home-v2-card-row">
                {filteredNovels.slice(0, 12).map((novel, index) => (
                  <NovelCard key={novel.id} novel={novel} index={index} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default HomePage;