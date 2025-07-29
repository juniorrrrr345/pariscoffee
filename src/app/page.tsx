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
      } finally {
        // Toujours arrêter le chargement après le traitement
        setTimeout(() => setLoading(false), 800);
      }
    };
    
    loadData();
    
    // Timeout de sécurité pour éviter le chargement infini
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Chargement trop long, forçage de l\'arrêt');
        setLoading(false);
      }
    }, 5000); // 5 secondes max
    
    // Rafraîchir les données toutes les 2 secondes pour synchronisation instantanée
    const interval = setInterval(() => {
      if (!loading) { // Ne pas rafraîchir pendant le chargement initial
        loadData();
      }
    }, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loading]);

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
                {/* Logo ou titre avec effet néon */}
                <div className="relative mb-8">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
                    JBEL INDUSTRY
                  </h1>
                  <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-50 animate-pulse"></div>
                </div>
                
                {/* Nouveau spinner moderne */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-8">
                  <div className="absolute inset-0">
                    <div className="w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-2">
                    <div className="w-full h-full border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full animate-spin-reverse"></div>
                  </div>
                  <div className="absolute inset-4">
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Indicateur de chargement moderne */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  
                  {/* Texte de chargement dynamique */}
                  <div className="text-white text-lg font-semibold">
                    <span className="animate-pulse">Initialisation de la boutique</span>
                  </div>
                </div>
                
                {/* Message de chargement avec icône */}
                <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Connexion aux services...</span>
                </div>
              </div>
              

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
                
                <main className="pt-4 pb-24 sm:pb-28 px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl mx-auto">

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

      </div>
      
      {/* BottomNav toujours visible - en dehors du content-layer */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}