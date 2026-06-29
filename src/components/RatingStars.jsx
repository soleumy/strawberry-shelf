import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function RatingStars({ novelId, readonly = false, size = 18 }) {
  const { session } = useAuth();
  const [userScore, setUserScore] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(0);

  async function loadRatings() {
    const { data: ratings } = await supabase
      .from('ratings')
      .select('score, user_id')
      .eq('novel_id', novelId);

    const scores = ratings || [];
    setCount(scores.length);

    if (scores.length > 0) {
      const avg = scores.reduce((sum, r) => sum + r.score, 0) / scores.length;
      setAvgScore(Math.round(avg * 10) / 10);
    } else {
      setAvgScore(0);
    }

    if (session?.user) {
      const mine = scores.find((r) => r.user_id === session.user.id);
      setUserScore(mine?.score || 0);
    }
  }

  useEffect(() => {
    loadRatings();
  }, [novelId, session]);

  async function rate(score) {
    if (readonly || !session?.user) {
      if (!session?.user) alert('Inicia sesión para valorar.');
      return;
    }

    await supabase.from('ratings').upsert({
      user_id: session.user.id,
      novel_id: novelId,
      score,
      updated_at: new Date().toISOString(),
    });

    setUserScore(score);
    loadRatings();
  }

  const display = hover || userScore || Math.round(avgScore);

  return (
    <div className="rating-stars">
      <div className="rating-stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`rating-star ${star <= display ? 'active' : ''}`}
            onClick={() => rate(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => setHover(0)}
            disabled={readonly}
            aria-label={`${star} estrellas`}
          >
            <Star size={size} fill={star <= display ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>

      {avgScore > 0 && (
        <span className="rating-avg">
          {avgScore} ({count})
        </span>
      )}
    </div>
  );
}
