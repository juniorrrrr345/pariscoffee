'use client';
import { useState, useEffect } from 'react';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard, { Product } from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import BottomNav from '../components/BottomNav';
import InfoPage from '../components/InfoPage';
import ContactPage from '../components/ContactPage';
import contentCache from '../lib/contentCache';
export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [selectedFarm, setSelectedFarm] = useState('Toutes les farms');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  
  // Remettre le chargement initial
  const [loading, setLoading] = useState(true);
  
  // États pour les données
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toutes les catégories']);
  const [farms, setFarms] = useState<string[]>(['Toutes les farms']);

  // CHARGEMENT INITIAL SIMPLIFIÉ
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger toutes les données en parallèle sans le cache.initialize()
        const [productsRes, categoriesRes, farmsRes] = await Promise.all([
          fetch('/api/products').catch(() => ({ ok: false })),
          fetch('/api/categories').catch(() => ({ ok: false })),
          fetch('/api/farms').catch(() => ({ ok: false }))
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
          contentCache.updateProducts(productsData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(['Toutes les catégories', ...categoriesData.map((c: any) => c.name)]);
          contentCache.updateCategories(categoriesData);
        }

        if (farmsRes.ok) {
          const farmsData = await farmsRes.json();
          setFarms(['Toutes les farms', ...farmsData.map((f: any) => f.name)]);
          contentCache.updateFarms(farmsData);
        }
      } catch (error) {
        console.error('Erreur chargement:', error);
        // Utiliser les données du cache en cas d'erreur
        try {
          const cachedProducts = contentCache.getProducts();
          const cachedCategories = contentCache.getCategories();
          const cachedFarms = contentCache.getFarms();
          
          if (cachedProducts && cachedProducts.length > 0) {
            setProducts(cachedProducts);
          }
          if (cachedCategories && cachedCategories.length > 0) {
            setCategories(['Toutes les catégories', ...cachedCategories.map((c: any) => c.name)]);
          }
          if (cachedFarms && cachedFarms.length > 0) {
            setFarms(['Toutes les farms', ...cachedFarms.map((f: any) => f.name)]);
          }
        } catch (cacheError) {
          console.error('Erreur cache:', cacheError);
        }
      }
      
      // Arrêter le chargement après un délai pour voir l'animation
      setTimeout(() => setLoading(false), 1200);
    };
    
    loadData();
    
    // Rafraîchir les données toutes les 2 secondes pour synchronisation instantanée
    const interval = setInterval(() => {
      loadData();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Filtrage des produits
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'Toutes les catégories' || product.category === selectedCategory;
    const farmMatch = selectedFarm === 'Toutes les farms' || product.farm === selectedFarm;
    return categoryMatch && farmMatch;
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'menu') {
      setSelectedProduct(null);
    }
  };

  // Écran de chargement initial avec fond
  if (loading) {
    return (
      <div className="main-container">
        <div className="global-overlay"></div>
        <div className="content-layer">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center max-w-md w-full">
              {/* Container avec fond semi-transparent pour meilleure visibilité */}
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 sm:p-10 md:p-12 border border-white/20 shadow-2xl">
                {/* Logo ou titre */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-8 tracking-wider animate-pulse">
                  JBEL INDUSTRY
                </h1>
                
                {/* Spinner amélioré */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                
                {/* Barre de progression améliorée */}
                <div className="w-full max-w-xs mx-auto mb-6">
                  <div className="bg-white/10 rounded-full h-3 sm:h-4 overflow-hidden backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-white to-gray-300 h-full rounded-full animate-progress shadow-lg"></div>
                  </div>
                  {/* Pourcentage */}
                  <div className="mt-2 text-white/80 text-sm sm:text-base font-medium">
                    <span className="animate-pulse">Chargement...</span>
                  </div>
                </div>
                
                {/* Texte signature */}
                <p className="text-white text-base sm:text-lg md:text-xl font-bold tracking-wider mt-6">
                  BY PLGSCRTF 🔌
                </p>
                
                {/* Message de chargement */}
                <p className="text-white/60 text-xs sm:text-sm mt-4 animate-pulse">
                  Préparation de votre expérience shopping
                </p>
              </div>
              
              {/* Style pour l'animation de la barre */}
              <style jsx>{`
                @keyframes progress {
                  0% { 
                    width: 0%; 
                    opacity: 0.5;
                  }
                  30% { 
                    width: 30%; 
                    opacity: 1;
                  }
                  60% { 
                    width: 65%; 
                    opacity: 1;
                  }
                  90% { 
                    width: 90%; 
                    opacity: 1;
                  }
                  100% { 
                    width: 100%; 
                    opacity: 0.8;
                  }
                }
                .animate-progress {
                  animation: progress 0.8s ease-out forwards;
                }
                
                /* Animation du spinner responsive */
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                .animate-spin {
                  animation: spin 1s linear infinite;
                }
                
                /* Effet de pulsation */
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.7; }
                }
                .animate-pulse {
                  animation: pulse 2s ease-in-out infinite;
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Structure avec fond toujours visible
  return (
    <div className="main-container">
      {/* Overlay global toujours présent */}
      <div className="global-overlay"></div>
      
      {/* Contenu principal avec navigation */}
      <div className="content-layer">
        {/* Affichage conditionnel des pages */}
        {activeTab === 'infos' ? (
          <InfoPage onClose={() => setActiveTab('menu')} />
        ) : activeTab === 'contact' ? (
          <ContactPage onClose={() => setActiveTab('menu')} />
        ) : (
          <>
            <Header />
            
            {selectedProduct ? (
              <ProductDetail 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
              />
            ) : (
              <div className="pt-12 sm:pt-14">
                {/* Espacement pour éviter le chevauchement avec le header */}
                <div className="h-4 sm:h-6"></div>
                
                <CategoryFilter
                  categories={categories}
                  farms={farms}
                  selectedCategory={selectedCategory}
                  selectedFarm={selectedFarm}
                  onCategoryChange={setSelectedCategory}
                  onFarmChange={setSelectedFarm}
                />
                
                <main className="pt-4 pb-20 sm:pb-24 px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl mx-auto">

                {/* Affichage des produits */}
                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="bg-gray-900/80 border border-white/20 rounded-xl p-6 sm:p-8 max-w-md mx-auto backdrop-blur-sm">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 7.414V9a2 2 0 012 2v2m0 0v2a2 2 0 01-2 2h-2m0 0H9a2 2 0 01-2-2v-2m0 0V9a2 2 0 012-2h2" />
                      </svg>
                      <h3 className="text-responsive-lg font-bold text-white mb-2">Aucun produit disponible</h3>
                      <p className="text-gray-400 mb-4 text-responsive-sm">
                        Ajoutez des produits depuis le panel admin pour qu'ils apparaissent ici.
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Panel Admin → Produits → Ajouter un produit
                      </p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="bg-gray-900/80 border border-white/20 rounded-xl p-6 sm:p-8 max-w-md mx-auto backdrop-blur-sm">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-responsive-lg font-bold text-white mb-2">Aucun produit trouvé</h3>
                      <p className="text-gray-400 text-responsive-sm">
                        Aucun produit ne correspond aux filtres sélectionnés.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Grid responsive intelligent */
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                )}
                </main>
              </div>
            )}
          </>
        )}

        {/* BottomNav toujours visible */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}