import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

export const FloatingHearts = () => {
  const { heartsEnabled } = useContext(AppContext);
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    if (!heartsEnabled) { setHearts([]); return; }
    const interval = setInterval(() => {
      setHearts(p => [...p, { id: Math.random(), left: `${Math.random() * 100}%`, size: Math.random() * 14 + 10, duration: Math.random() * 5 + 6 }].slice(-12));
    }, 2000);
    return () => clearInterval(interval);
  }, [heartsEnabled]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map(h => (
        <motion.span
          key={h.id}
          className="absolute bottom-[-40px] text-kawaii-rosa/30 dark:text-darkKawaii-rosa/20 select-none"
          style={{ left: h.left, fontSize: h.size }}
          animate={{ y: '-105vh', x: [0, 20, -20, 0] }}
          transition={{ duration: h.duration, ease: 'linear' }}
        >
          🌸
        </motion.span>
      ))}
    </div>
  );
};