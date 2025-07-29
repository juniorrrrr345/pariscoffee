'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ContactPage from '@/components/ContactPage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function ContactPageRoute() {
  const [activeTab] = useState('contact');
  const router = useRouter();

  const handleTabChange = (tabId: string) => {
    if (tabId === 'menu') {
      router.push('/');
    } else if (tabId === 'infos') {
      router.push('/info');
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
          <ContactPage onClose={() => window.history.back()} />
        </div>
      </div>
      
      {/* BottomNav toujours visible */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}