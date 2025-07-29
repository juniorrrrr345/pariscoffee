'use client';

import { useState } from 'react';
import InfoPage from '@/components/InfoPage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function InfoPageRoute() {
  const [activeTab] = useState('infos');

  const handleTabChange = (tabId: string) => {
    if (tabId === 'menu') {
      window.location.href = '/';
    } else if (tabId === 'contact') {
      window.location.href = '/contact';
    } else if (tabId === 'social') {
      window.location.href = '/social';
    }
  };

  return (
    <div className="main-container">
      {/* Overlay global toujours présent */}
      <div className="global-overlay"></div>
      
      {/* Contenu principal */}
      <div className="content-layer">
        <Header />
        <div className="pt-12 sm:pt-14">
          <div className="h-4 sm:h-6"></div>
          <InfoPage onClose={() => window.history.back()} />
        </div>
      </div>
      
      {/* BottomNav toujours visible */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}