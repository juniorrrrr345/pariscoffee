'use client';

import { useEffect } from 'react';
import { useGlobalBackground } from '../hooks/useGlobalBackground';

export default function GlobalBackgroundProvider() {
  // Appliquer le fond global une seule fois au niveau de l'application
  useGlobalBackground();
  
  // Écouter les changements de settings pour mettre à jour le fond
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminSettings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          const root = document.documentElement;
          
          if (settings.backgroundImage) {
            root.style.setProperty('--bg-image', `url(${settings.backgroundImage})`);
            root.style.setProperty('--bg-opacity', (settings.backgroundOpacity || 20) / 100);
            root.style.setProperty('--bg-blur', `${settings.backgroundBlur || 5}px`);
          }
        } catch (error) {
          console.error('Erreur mise à jour fond:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return null;
}