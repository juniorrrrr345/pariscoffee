'use client';
import { useState, useEffect } from 'react';

export default function TestLoading() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (showLoading) {
    return (
      <div className="fixed inset-0 z-50" style={{ 
        background: 'radial-gradient(circle at center, #2a2a2a 0%, #0a0a0a 100%)',
        minHeight: '100vh'
      }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl"></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="mb-8">
              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-xl opacity-30 animate-ping"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <span className="text-8xl animate-bounce filter drop-shadow-2xl">🔥</span>
                </div>
              </div>
            </div>
            
            {/* Titre avec effet néon et ombre */}
            <h1 className="text-5xl sm:text-7xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text animate-pulse drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
              PARISCOFFEE
            </h1>
            
            <p className="text-2xl text-white/90 mb-8 font-light">
              TEST - Nouveau chargement
            </p>
            
            <div className="w-80 max-w-full mx-auto mb-8">
              <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/20 shadow-inner">
                <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-full shadow-lg animate-loading-bar"></div>
              </div>
              <div className="mt-2 text-sm text-white/50">Version: {new Date().toISOString()}</div>
            </div>
            
            <div className="flex justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce shadow-lg shadow-yellow-400/50" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce shadow-lg shadow-orange-500/50" style={{ animationDelay: '200ms' }}></div>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-lg shadow-red-500/50" style={{ animationDelay: '400ms' }}></div>
            </div>
            
            {/* Footer */}
            <div className="text-white text-sm font-medium drop-shadow-md">
              <p>© 2025 PARISCOFFEE</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl mb-4">Test réussi !</h1>
        <p>Le nouveau chargement fonctionne</p>
        <a href="/" className="mt-4 inline-block bg-white text-black px-4 py-2 rounded">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}