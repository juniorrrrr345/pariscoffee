'use client';
import { useState, useEffect } from 'react';
import ContactPage from '@/components/ContactPage';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

export default function ContactPageRoute() {
  const [content, setContent] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [socialLinks, setSocialLinks] = useState<any[]>([]);

  useEffect(() => {
    // Charger depuis localStorage d'abord
    const loadFromCache = () => {
      try {
        const cachedPage = localStorage.getItem('contactPage');
        const cachedSettings = localStorage.getItem('shopSettings');
        const cachedLinks = localStorage.getItem('socialLinks');
        
        if (cachedPage) {
          const data = JSON.parse(cachedPage);
          setContent(data.content || '');
        }
        
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          setWhatsappLink(settings.whatsappLink || '');
        }
        
        if (cachedLinks) {
          setSocialLinks(JSON.parse(cachedLinks));
        }
      } catch (e) {}
    };

    loadFromCache();

    // Puis charger les données fraîches
    const loadFreshData = async () => {
      try {
        const [pageRes, settingsRes, linksRes] = await Promise.all([
          fetch('/api/pages/contact', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/social-links', { cache: 'no-store' })
        ]);

        if (pageRes.ok) {
          const data = await pageRes.json();
          setContent(data.content || '');
          localStorage.setItem('contactPage', JSON.stringify(data));
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setWhatsappLink(settings.whatsappLink || '');
          localStorage.setItem('shopSettings', JSON.stringify(settings));
        }

        if (linksRes.ok) {
          const links = await linksRes.json();
          setSocialLinks(links);
          localStorage.setItem('socialLinks', JSON.stringify(links));
        }
      } catch (error) {
        console.error('Erreur chargement contact:', error);
      }
    };

    loadFreshData();

    // Rafraîchir toutes les secondes
    const interval = setInterval(loadFreshData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="main-container">
      <div className="global-overlay"></div>
      
      <div className="content-layer">
        <Header />
        <div className="pt-12 sm:pt-14">
          <div className="h-4 sm:h-6"></div>
          <ContactPage 
            content={content}
            whatsappLink={whatsappLink}
            socialLinks={socialLinks.filter(link => link.isActive)}
          />
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}