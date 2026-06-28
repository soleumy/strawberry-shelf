import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const move = (e) => setPosition({ x: e.clientX, y: e.clientY });
    const hoverCheck = (e) => {
      if (e.target.closest('button, a, input, select, [role="button"]')) setIsHovered(true);
      else setIsHovered(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', hoverCheck);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', hoverCheck);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[9999] hidden md:block text-2xl drop-shadow-md select-none"
      animate={{ x: position.x - 12, y: position.y - 12, scale: isHovered ? 1.3 : 1 }}
      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.2 }}
    >
      🍓
    </motion.div>
  );
};