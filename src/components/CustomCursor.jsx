import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const move = (event) => {
      setPosition({ x: event.clientX, y: event.clientY });
      setIsHovered(Boolean(event.target.closest('a, button, input, textarea, select, label')));
    };

    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <motion.div
      className="custom-cursor"
      animate={{
        x: position.x - 13,
        y: position.y - 13,
        scale: isHovered ? 1.35 : 1,
        rotate: isHovered ? -12 : 0,
      }}
      transition={{ type: 'spring', damping: 24, stiffness: 420, mass: 0.2 }}
    >
      🍓
    </motion.div>
  );
};