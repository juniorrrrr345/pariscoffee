'use client';
import { useState, useEffect, useRef } from 'react';

interface CategoryFilterProps {
  selectedCategory: string;
  selectedFarm: string;
  onCategoryChange: (category: string) => void;
  onFarmChange: (farm: string) => void;
  categories: string[];
  farms: string[];
}

export default function CategoryFilter({ 
  selectedCategory, 
  selectedFarm, 
  onCategoryChange, 
  onFarmChange,
  categories,
  farms
}: CategoryFilterProps) {
  const [showCategories, setShowCategories] = useState(false);
  const [showFarms, setShowFarms] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const farmRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
      if (farmRef.current && !farmRef.current.contains(event.target as Node)) {
        setShowFarms(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-sm border-b border-white/10">
      {/* Version Mobile - Scroll horizontal */}
      <div className="sm:hidden">
        <div className="flex gap-2 p-2 overflow-x-auto scrollbar-hide">
          {/* Bouton Toutes les catégories */}
          <button
            onClick={() => onCategoryChange('Toutes les catégories')}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'Toutes les catégories'
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Tout
          </button>
          {/* Autres catégories */}
          {categories.filter(cat => cat !== 'Toutes les catégories').map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Farms en dessous sur mobile */}
        <div className="flex gap-2 p-2 pt-0 overflow-x-auto scrollbar-hide border-t border-white/5">
          <span className="text-[10px] text-white/40 uppercase tracking-wider self-center mr-2">Farm:</span>
          <button
            onClick={() => onFarmChange('Toutes les farms')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedFarm === 'Toutes les farms'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Toutes
          </button>
          {farms.filter(farm => farm !== 'Toutes les farms').map((farm) => (
            <button
              key={farm}
              onClick={() => onFarmChange(farm)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedFarm === farm
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {farm}
            </button>
          ))}
        </div>
      </div>

      {/* Version Desktop - Dropdowns */}
      <div className="hidden sm:flex gap-3 p-3 max-w-7xl mx-auto">
        {/* Dropdown Catégories - Design discret */}
        <div className="relative flex-1" ref={categoryRef}>
          <button
            onClick={() => {
              setShowCategories(!showCategories);
              setShowFarms(false);
            }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between"
          >
            <span className="truncate">{selectedCategory}</span>
            <svg className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${showCategories ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showCategories && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-sm rounded-lg shadow-xl z-[9999] border border-white/10 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => {
                      onCategoryChange(category);
                      setShowCategories(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-all duration-200 ${
                      selectedCategory === category ? 'bg-white/10 text-white' : 'text-white/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Farms - Design discret */}
        <div className="relative flex-1" ref={farmRef}>
          <button
            onClick={() => {
              setShowFarms(!showFarms);
              setShowCategories(false);
            }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between"
          >
            <span className="truncate">{selectedFarm}</span>
            <svg className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${showFarms ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showFarms && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-gradient-to-b from-gray-900 to-black backdrop-blur-2xl rounded-2xl shadow-2xl z-[9999] border border-green-500/20 overflow-hidden animate-fadeIn">
              {/* En-tête du dropdown */}
              <div className="px-5 py-4 bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-b border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-base">Farms</span>
                  <span className="text-green-400 text-sm font-medium bg-green-500/20 px-2 py-1 rounded-lg">{farms.length - 1}</span>
                </div>
              </div>
              
              {/* Liste avec scroll élégant */}
              <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent">
                {farms.map((farm, index) => (
                  <button
                    key={farm}
                    onClick={() => {
                      onFarmChange(farm);
                      setShowFarms(false);
                    }}
                    className={`w-full text-left px-5 py-4 text-sm text-white hover:bg-gradient-to-r hover:from-green-600/20 hover:to-emerald-600/20 transition-all duration-200 border-b border-gray-800/50 last:border-b-0 group ${
                      selectedFarm === farm ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-l-4 border-l-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-1 font-medium group-hover:translate-x-1 transition-transform">{farm}</span>
                      {selectedFarm === farm && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-scaleIn">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          )}
        </div>
      </div>
    </div>
  );
}