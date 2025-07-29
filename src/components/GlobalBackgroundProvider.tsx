'use client';

import { useEffect, useState } from 'react';

export default function GlobalBackgroundProvider() {
  const [backgroundApplied, setBackgroundApplied] = useState(false);
  
  useEffect(() => {
    // Fonction pour appliquer le background
    const applyBackground = (settings: any) => {
      const root = document.documentElement;
      const body = document.body;
      const backgroundImage = settings?.backgroundImage || '';
      const backgroundOpacity = settings?.backgroundOpacity || 20;
      const backgroundBlur = settings?.backgroundBlur || 5;
      
      // Configuration du background
      const bgConfig = backgroundImage ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: 'black'
      } : {
        backgroundImage: '',
        backgroundColor: 'black'
      };
      
      // Appliquer sur HTML et BODY
      Object.assign(root.style, bgConfig);
      Object.assign(body.style, bgConfig);
      
      // Mettre à jour l'overlay
      const overlay = document.querySelector('.global-overlay') as HTMLElement;
      if (overlay) {
        if (backgroundImage) {
          overlay.style.backgroundColor = `rgba(0, 0, 0, ${backgroundOpacity / 100})`;
          overlay.style.backdropFilter = `blur(${backgroundBlur}px)`;
          overlay.style.display = 'block';
        } else {
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
          overlay.style.backdropFilter = 'blur(2px)';
        }
      }
      
      // Appliquer sur tous les conteneurs principaux
      document.querySelectorAll('.main-container').forEach((container) => {
        Object.assign((container as HTMLElement).style, bgConfig);
      });
    };
    
    // 1. D'abord essayer de charger depuis localStorage pour être instantané
    const cachedSettings = localStorage.getItem('shopSettings');
    if (cachedSettings) {
      try {
        const settings = JSON.parse(cachedSettings);
        applyBackground(settings);
        setBackgroundApplied(true);
      } catch (e) {
        console.error('Erreur parsing settings cache:', e);
      }
    }
    
    // 2. Ensuite charger depuis l'API pour avoir les dernières données
    fetch('/api/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(settings => {
        // Sauvegarder dans localStorage pour le prochain chargement
        localStorage.setItem('shopSettings', JSON.stringify(settings));
        applyBackground(settings);
        setBackgroundApplied(true);
      })
      .catch(error => {
        console.error('Erreur chargement settings:', error);
      });
    
    // 3. Écouter les changements de settings en temps réel
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopSettings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          applyBackground(settings);
        } catch (error) {
          console.error('Erreur mise à jour fond:', error);
        }
      }
    };
    
    // 4. Écouter les mises à jour depuis le panel admin
    const handleSettingsUpdate = (event: CustomEvent) => {
      const settings = event.detail;
      localStorage.setItem('shopSettings', JSON.stringify(settings));
      applyBackground(settings);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated' as any, handleSettingsUpdate as any);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated' as any, handleSettingsUpdate as any);
    };
  }, []);
  
  return null;
}