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
    <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-white/10 shadow-lg pt-2 sm:pt-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 max-w-7xl mx-auto">
        {/* Dropdown Catégories - Design professionnel */}
        <div className="relative flex-1" ref={categoryRef}>
          <button
            onClick={() => {
              setShowCategories(!showCategories);
              setShowFarms(false); // Fermer l'autre dropdown
            }}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between shadow-xl hover:shadow-2xl transform hover:scale-[1.02] backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedCategory}</span>
            </div>
            <svg className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 text-gray-400 ${showCategories ? 'rotate-180 text-blue-400' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showCategories && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl z-[9999] border border-gray-600 overflow-hidden">
              {/* En-tête du dropdown */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Catégories ({categories.length - 1})</span>
                </div>
              </div>
              
              {/* Liste avec scroll professionnel */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {categories.map((category, index) => (
                  <button
                    key={category}
                    onClick={() => {
                      onCategoryChange(category);
                      setShowCategories(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm text-white hover:bg-blue-600/30 transition-all duration-200 border-b border-gray-700/50 last:border-b-0 ${
                      selectedCategory === category ? 'bg-blue-600/50 border-l-4 border-l-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-1 truncate">{category}</span>
                      {selectedCategory === category && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Farms - Design professionnel */}
        <div className="relative flex-1" ref={farmRef}>
          <button
            onClick={() => {
              setShowFarms(!showFarms);
              setShowCategories(false); // Fermer l'autre dropdown
            }}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-between shadow-xl hover:shadow-2xl transform hover:scale-[1.02] backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="truncate">{selectedFarm}</span>
            </div>
            <svg className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 text-gray-400 ${showFarms ? 'rotate-180 text-green-400' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showFarms && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl z-[9999] border border-gray-600 overflow-hidden">
              {/* En-tête du dropdown */}
              <div className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 border-b border-green-500">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">Farms ({farms.length - 1})</span>
                </div>
              </div>
              
              {/* Liste avec scroll professionnel */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {farms.map((farm, index) => (
                  <button
                    key={farm}
                    onClick={() => {
                      onFarmChange(farm);
                      setShowFarms(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm text-white hover:bg-green-600/30 transition-all duration-200 border-b border-gray-700/50 last:border-b-0 ${
                      selectedFarm === farm ? 'bg-green-600/50 border-l-4 border-l-green-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-1 truncate">{farm}</span>
                      {selectedFarm === farm && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}