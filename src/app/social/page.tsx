'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

import GlobalBackgroundProvider from '@/components/GlobalBackgroundProvider';

interface SocialLink {
  _id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  isActive: boolean;
}

interface Settings {
  shopTitle: string;
  shopSubtitle: string;
  email: string;
  address: string;
  whatsappLink: string;
}

export default function SocialPage() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les réseaux sociaux et les settings en parallèle
      const [socialResponse, settingsResponse] = await Promise.all([
        fetch('/api/social-links'),
        fetch('/api/settings')
      ]);

      if (socialResponse.ok) {
        const data = await socialResponse.json();
        const activeLinks = data.filter((link: SocialLink) => link.isActive);
        setSocialLinks(activeLinks);
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      <GlobalBackgroundProvider />
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-20 sm:mt-24 lg:mt-28">
          {/* Titre de la page avec style boutique */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
              Restez Connectés
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-6"></div>
            <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
              Suivez {settings?.shopTitle || 'notre boutique'} sur les réseaux sociaux pour ne rien manquer de nos nouveautés et offres exclusives
            </p>
          </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : socialLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {socialLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105"
                style={{
                  backgroundColor: `${link.color}20`,
                  borderColor: link.color,
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
              >
                {/* Effet de hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(45deg, ${link.color}40, transparent)`
                  }}
                />
                
                <div className="relative p-8 text-center">
                  {/* Icône */}
                  <div className="text-5xl mb-4">{link.icon}</div>
                  
                  {/* Nom du réseau */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {link.name}
                  </h3>
                  
                  {/* Bouton */}
                  <div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                    style={{
                      backgroundColor: link.color,
                      color: 'white'
                    }}
                  >
                    <span>Suivre</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              Aucun réseau social configuré pour le moment.
            </p>
          </div>
        )}

        {/* Section contact supplémentaire */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 bg-gray-900 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              Besoin d'aide ?
            </h2>
            <p className="text-gray-400 mb-6">
              N'hésitez pas à nous contacter directement
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-300"
            >
              Nous contacter
            </Link>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}