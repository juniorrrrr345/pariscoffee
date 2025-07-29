'use client';
import { useState, useEffect } from 'react';
import contentCache from '../lib/contentCache';

interface ContactPageProps {
  onClose: () => void;
}

interface SocialLink {
  name: string;
  url: string;
  icon: string;
  color: string;
}

export default function ContactPage({ onClose }: ContactPageProps) {
  // Charger le contenu depuis le cache d'abord pour un affichage instantané
  const cachedPage = contentCache.getContactPage();
  const cachedSettings = contentCache.getSettings();
  
  const [content, setContent] = useState(
    cachedPage?.content || 
    '# Contact\n\nContactez-nous pour plus d\'informations.\n\nVous pouvez modifier ce contenu depuis le panel administrateur.'
  );
  
  // Initialiser les liens sociaux depuis le cache
  const getInitialSocialLinks = (): SocialLink[] => {
    const links: SocialLink[] = [];
    if (cachedSettings?.telegramLink) {
      links.push({
        name: 'Telegram',
        url: cachedSettings.telegramLink,
        icon: '📱',
        color: 'blue'
      });
    }
    if (cachedSettings?.instagramLink) {
      links.push({
        name: 'Instagram',
        url: cachedSettings.instagramLink,
        icon: '📸',
        color: 'pink'
      });
    }
    if (cachedSettings?.twitterLink) {
      links.push({
        name: 'Twitter',
        url: cachedSettings.twitterLink,
        icon: '🐦',
        color: 'blue'
      });
    }
    return links;
  };
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(getInitialSocialLinks());

  useEffect(() => {
    // Mettre à jour depuis l'API en arrière-plan
    async function updateData() {
      try {
        const [pageRes, settingsRes] = await Promise.all([
          fetch('/api/pages/contact', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          }),
          fetch('/api/settings', {
            cache: 'no-store'
          })
        ]);

        if (pageRes.ok) {
          const data = await pageRes.json();
          if (data.content && data.content.trim()) {
            setContent(data.content);
            // Mettre à jour le cache
            contentCache.updateContactPage({
              title: data.title || 'Page Contact',
              content: data.content
            });
          }
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          const links: SocialLink[] = [];
          
          if (settings.telegramLink) {
            links.push({
              name: 'Telegram',
              url: settings.telegramLink,
              icon: '📱',
              color: 'blue'
            });
          }
          
          if (settings.instagramLink) {
            links.push({
              name: 'Instagram',
              url: settings.instagramLink,
              icon: '📸',
              color: 'pink'
            });
          }
          
          if (settings.twitterLink) {
            links.push({
              name: 'Twitter',
              url: settings.twitterLink,
              icon: '🐦',
              color: 'blue'
            });
          }
          
          if (links.length > 0) {
            setSocialLinks(links);
          }
          
          // Mettre à jour le cache des settings
          contentCache.updateSettings(settings);
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour page Contact:', error);
      }
    }

    updateData();
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Titre de la page avec style boutique */}
      <div className="text-center mb-8">
        <h1 className="shop-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
          Contact
        </h1>
        <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
      </div>

        {/* Contenu principal - Affichage instantané */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 mb-8">
          <div 
            className="prose prose-lg max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        </div>

        {/* Liens sociaux si disponibles */}
        {socialLinks.length > 0 && (
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Nos Réseaux</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-sm transition-all duration-200 flex items-center space-x-2 border border-white/20"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

    </div>
  );
}