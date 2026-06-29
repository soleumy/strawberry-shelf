import React, { useEffect, useState } from 'react';
import { rateNovel, getUserRating, getAverageRating } from '../lib/api/ratings';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';

export function RatingWidget({ novelId }) {
  const { userId } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { average, count } = await getAverageRating(novelId);
      setAverageRating(average);
      setTotalRatings(count);

      if (userId) {
        const { data } = await getUserRating(userId, novelId);
        setUserRating(data?.score || 0);
      }
    }
    load();
  }, [novelId, userId]);

  async function handleRate(score) {
    if (!userId) { alert('Inicia sesión para calificar.'); return; }
    setLoading(true);
    const { data } = await rateNovel(userId, novelId, score);
    if (data) {
      setUserRating(score);
      // Reload average
      const { average, count } = await getAverageRating(novelId);
      setAverageRating(average);
      setTotalRatings(count);
    }
    setLoading(false);
  }

  return (
    <div className="rating-widget">
      <div className="rating-display">
        <div className="rating-average">
          <span className="big-number">{averageRating}</span>
          <span className="small-text">/ 5.0</span>
        </div>
        <p className="muted">{totalRatings} calificaciones</p>
      </div>

      <div className="rating-input">
        <p>Tu calificación:</p>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`star ${userRating >= star ? 'active' : ''}`}
              onClick={() => handleRate(star)}
              disabled={loading}
              title={`Calificar con ${star} estrella${star > 1 ? 's' : ''}`}
            >
              <Star size={24} fill={userRating >= star ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
