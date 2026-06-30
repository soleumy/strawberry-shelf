import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getLocalRatings, setLocalRating } from '../lib/localInteractions';

export function RatingStars({ novelId, readonly = false, size = 18, showDistribution = false }) {
  const { user } = useAuth();
  const [userScore, setUserScore] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [count, setCount] = useState(0);
  const [hover, setHover] = useState(0);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [rating, setRating] = useState(null);

  function applyScores(rows) {
    const scores = rows || [];
    setCount(scores.length);

    if (scores.length > 0) {
      const avg = scores.reduce((sum, row) => sum + Number(row.score || 0), 0) / scores.length;
      setAvgScore(Math.round(avg * 10) / 10);
    } else {
      setAvgScore(0);
    }

    const mine = scores.find((row) => row.user_id === (user?.id || 'local-reader'));
    setUserScore(mine?.score || 0);

    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    scores.forEach((row) => {
      const score = Math.round(Number(row.score || 0));
      if (score >= 1 && score <= 5) {
        dist[score] = (dist[score] || 0) + 1;
      }
    });
    setDistribution(dist);
  }

  async function loadRatings() {
    applyScores(getLocalRatings(novelId));

    if (supabase.isConfigured === false) return;

    const { data, error } = await supabase
      .from('ratings')
      .select('score, user_id')
      .eq('novel_id', String(novelId));

    if (!error && data) {
      data.forEach((row) => {
        if (row.user_id === user?.id) setLocalRating(user.id, novelId, row.score);
      });
      applyScores([...data, ...getLocalRatings(novelId)]);
    }
  }

  useEffect(() => {
    loadRatings();
  }, [novelId, user?.id]);

  async function rate(score) {
    if (readonly) return;

    setRating(score);
    setUserScore(score);
    setLocalRating(user?.id, novelId, score);
    applyScores(getLocalRatings(novelId));

    if (supabase.isConfigured !== false && user) {
      const payload = {
        user_id: user.id,
        novel_id: String(novelId),
        score,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('ratings').upsert(payload, { onConflict: 'user_id,novel_id' });

      if (error) {
        const { data: existing } = await supabase
          .from('ratings')
          .select('id')
          .eq('user_id', user.id)
          .eq('novel_id', String(novelId))
          .maybeSingle();

        if (existing?.id) {
          await supabase.from('ratings').update({ score }).eq('id', existing.id);
        } else {
          await supabase.from('ratings').insert({ user_id: user.id, novel_id: String(novelId), score });
        }
      }

      loadRatings();
    }

    setRating(null);
  }

  const display = hover || userScore || Math.round(avgScore);

  return (
    <div className="rating-stars">
      <div className="rating-stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`rating-star ${star <=display ? 'active' : ''} ${rating === star ? 'rating' : ''}`}
            onClick={() => rate(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => setHover(0)}
            disabled={readonly || rating !== null}
            aria-label={`${star} estrellas`}
          >
            <Star size={size} fill={star <= display ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>

      <span className="rating-avg">
        {avgScore > 0 ? `${avgScore} (${count})` : 'Sin calificaciones'}
      </span>

      {showDistribution && count > 0 && (
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((star) => {
            const countForStar = distribution[star] || 0;
            const percentage = count > 0 ? (countForStar / count) * 100 : 0;
            return (
              <div key={star} className="rating-dist-row">
                <span className="rating-dist-label">{star}★</span>
                <div className="rating-dist-bar-bg">
                  <div
                    className="rating-dist-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="rating-dist-count">{countForStar}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
