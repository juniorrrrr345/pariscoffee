'use client';
import { useEffect, useState } from 'react';
import { Product } from './ProductCard';

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    loadTelegramLink();
  }, []);

  const loadTelegramLink = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.telegramOrderLink || data.telegramLink) {
          setTelegramLink(data.telegramOrderLink || data.telegramLink);
        }
      }
    } catch (error) {
      console.error('Erreur chargement lien Telegram:', error);
    }
  };

  if (!product) return null;

  // Créer une liste des prix disponibles seulement (filtre les undefined/null/vides)
  const priceList = Object.entries(product.prices || {})
    .filter(([, price]) => {
      // Filtre plus strict pour éliminer toutes les valeurs invalides
      return price !== undefined && 
             price !== null && 
             price !== 0 && 
             price !== '' && 
             !isNaN(Number(price)) && 
             Number(price) > 0;
    })
    .map(([weight, price]) => ({
      weight,
      price: `${Number(price)}€`
    }))
    .sort((a, b) => {
      // Tri par ordre numérique des poids
      const aNum = parseFloat(a.weight.replace(/[^\d.]/g, ''));
      const bNum = parseFloat(b.weight.replace(/[^\d.]/g, ''));
      return aNum - bNum;
    });

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto safe-area-padding">
      {/* Header avec bouton retour - responsive */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-between border-b border-white/20 z-10">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors p-1 touch-manipulation"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-responsive-lg font-bold text-white">Détail Produit</h1>
        <div className="w-5 sm:w-6"></div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        {/* Vidéo/Image - responsive */}
        <div className="relative mb-4 sm:mb-6 flex justify-center">
          {product.video ? (
            <div className="relative overflow-hidden rounded-xl shadow-2xl w-full max-w-lg">
              <video 
                controls 
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto aspect-video rounded-xl object-cover"
                poster={product.image}
              >
                <source src={product.video} type="video/mp4" />
                Ton navigateur ne supporte pas la lecture vidéo.
              </video>
              {/* Overlay gradient pour un meilleur contraste */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-xl"></div>
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <img 
                src={product.image}
                alt={product.name}
                className="w-full rounded-xl shadow-lg object-cover aspect-square"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
              />
            </div>
          )}
        </div>

        {/* Infos produit - responsive */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-responsive-xl sm:text-responsive-2xl md:text-responsive-3xl font-bold mb-2 uppercase tracking-wide text-white break-words">
            {product.name}
          </h2>
          <p className="text-gray-400 font-medium mb-1 text-responsive-sm">{product.category}</p>
          <p className="text-gray-400 uppercase tracking-widest text-responsive-xs sm:text-responsive-sm font-medium mb-3 break-words">
            {product.farm}
          </p>
          
          {/* Badge "CURE AU TOP" - responsive */}
          <div className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white text-xxs sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
            CURE AU TOP 🔥
          </div>
        </div>

        {/* Liste des prix - responsive */}
        <div className="bg-gray-900 border border-white/20 rounded-xl p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6">
          <h3 className="text-responsive-lg font-bold mb-3 sm:mb-4 text-white flex items-center">
            <span className="mr-2">💰</span>
            Tarifs disponibles :
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {priceList.map(({ weight, price }, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 sm:py-3 px-2 sm:px-3 bg-gray-800 border border-white/10 rounded-lg hover:bg-gray-700 transition-colors">
                <span className="font-medium text-white text-responsive-sm">{weight}</span>
                <span className="font-bold text-white text-responsive-lg">{price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton Telegram - responsive */}
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] touch-manipulation"
        >
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="text-responsive-sm sm:text-responsive-base">Commander via Telegram</span>
          </div>
        </a>
      </div>
    </div>
  );
}