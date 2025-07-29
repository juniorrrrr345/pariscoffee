'use client';
import { useState, useEffect } from 'react';
import contentCache from '../lib/contentCache';

interface InfoPageProps {
  onClose: () => void;
}

export default function InfoPage({ onClose }: InfoPageProps) {
  // Charger le contenu depuis le cache d'abord pour un affichage instantané
  const cachedPage = contentCache.getInfoPage();
  const [content, setContent] = useState(
    cachedPage?.content || 
    '# À propos\n\nBienvenue sur notre boutique en ligne.\n\nVous pouvez modifier ce contenu depuis le panel administrateur.'
  );

  useEffect(() => {
    // Mettre à jour depuis l'API en arrière-plan
    fetch('/api/pages/info', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.content && data.content.trim()) {
          setContent(data.content);
          // Mettre à jour le cache
          contentCache.updateInfoPage({
            title: data.title || 'Page Info',
            content: data.content
          });
        }
      })
      .catch(error => {
        console.error('Erreur chargement page info:', error);
      });
  }, []);

  const parseMarkdown = (text: string) => {
    return text
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl sm:text-2xl font-bold text-white mb-4 mt-8">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg sm:text-xl font-bold text-white mb-3 mt-6">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic text-gray-300">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-300 mb-1">• $1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-gray-300 mb-1">$1. $2</li>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-green-400">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Informations</h1>
          <div className="w-12"></div>
        </div>

        {/* Contenu principal - Affichage instantané */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
          <div 
            className="prose prose-lg max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        </div>

      </div>
    </div>
  );
}