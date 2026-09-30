import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 140);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      style={{
        opacity: transitionStage === 'fadeIn' ? 1 : 0.4,
        transform: transitionStage === 'fadeIn' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 180ms ease, transform 180ms ease'
      }}
    >
      {children}
    </div>
  );
};
