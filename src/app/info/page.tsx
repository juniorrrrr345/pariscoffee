'use client';
import { useState, useEffect } from 'react';
import InfoPage from '@/components/InfoPage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function InfoPageRoute() {
  const [content, setContent] = useState('');

  useEffect(() => {
    // Charger depuis localStorage d'abord
    const cached = localStorage.getItem('infoPage');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setContent(data.content || '');
      } catch (e) {}
    }

    // Puis charger les données fraîches
    const loadContent = async () => {
      try {
        const response = await fetch('/api/pages/info', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || '');
          localStorage.setItem('infoPage', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Erreur chargement info:', error);
      }
    };

    loadContent();

    // Rafraîchir toutes les secondes
    const interval = setInterval(loadContent, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-container">
      <div className="global-overlay"></div>
      
      <div className="content-layer">
        <Header />
        <div className="pt-12 sm:pt-14">
          <div className="h-4 sm:h-6"></div>
          <InfoPage content={content} />
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}