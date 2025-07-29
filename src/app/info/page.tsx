'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InfoPage from '@/components/InfoPage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function InfoPageRoute() {
  const [activeTab] = useState('infos');
  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    if (tabId === 'menu') {
      router.push('/');
    } else if (tabId === 'contact') {
      router.push('/contact');
    } else if (tabId === 'social') {
      router.push('/social');
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