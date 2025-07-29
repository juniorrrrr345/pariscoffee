'use client';
import { useEffect } from 'react';
import contentCache from '@/lib/contentCache';

export default function CachePreloader() {
  useEffect(() => {
    // Précharger le cache dès que l'app se charge
    const preloadCache = async () => {
      try {
        await contentCache.initialize();
        console.log('🚀 Cache préchargé avec succès');
      } catch (error) {
        console.error('❌ Erreur préchargement cache:', error);
      }
    };
    
    preloadCache();
  }, []);

  return null; // Composant invisible
}