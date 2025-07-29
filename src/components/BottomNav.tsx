'use client';
import { useState, useEffect } from 'react';

const navItems = [
  {
    id: 'menu',
    label: 'Menu',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )
  },
  {
    id: 'infos',
    label: 'Infos',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'canal',
    label: 'Canal',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    )
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: (
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  }
];

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function BottomNav({ activeTab = 'menu', onTabChange }: BottomNavProps) {
  const [canalLink, setCanalLink] = useState('');

  useEffect(() => {
    const loadCanalLink = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setCanalLink(data.canalLink || '');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du lien canal:', error);
      }
    };

    loadCanalLink();
  }, []);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'canal') {
      // Ouvrir le lien du canal configuré
      window.open(canalLink, '_blank');
    } else if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <nav 
      className="bottom-nav-container bg-black/95 backdrop-blur-sm border-t border-white/20 safe-area-padding"
    >
      <div className="flex items-center justify-around py-1.5 sm:py-2 px-2 sm:px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 touch-manipulation min-w-0 flex-1 max-w-[80px] ${
              activeTab === item.id
                ? 'text-white bg-gray-800 border border-white/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            style={{ 
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            <div className={`transition-transform duration-200 ${
              activeTab === item.id ? 'scale-110' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-xxs sm:text-xs font-medium mt-0.5 sm:mt-1 tracking-wide truncate w-full text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}