import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor = () => {
  const cursorRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const move = (event) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${event.clientX - 13}px, ${event.clientY - 13}px, 0)`;
      }

      setIsHovered(Boolean(event.target.closest('a, button, input, textarea, select, label')));
    };

    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div ref={cursorRef} className={`custom-cursor ${isHovered ? 'is-hovered' : ''}`}>
      🍓
    </div>
  );
};