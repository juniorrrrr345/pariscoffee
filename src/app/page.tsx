'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
// Redéploiement forcé - Nouveau chargement PARISCOFFEE
import CategoryFilter from '../components/CategoryFilter';
import ProductCard, { Product } from '../components/ProductCard';
import ProductDetail from '../components/ProductDetail';
import BottomNav from '../components/BottomNav';
import contentCache from '../lib/contentCache';
export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('Toutes les catégories');
  const [selectedFarm, setSelectedFarm] = useState('Toutes les farms');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('menu');
  const router = useRouter();
  
  // Précharger les autres pages pour navigation instantanée
  useEffect(() => {
    router.prefetch('/info');
    router.prefetch('/contact');
    router.prefetch('/social');
  }, [router]);
  
  // États pour les données - Initialiser avec des valeurs par défaut
  const [loading, setLoading] = useState(true); // Toujours true au départ
  const [settings, setSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('shopSettings');
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  // Gérer la logique de première visite côté client uniquement
  useEffect(() => {
    // Vérifier si c'est la première visite
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      // Si déjà visité, cacher le chargement immédiatement
      setLoading(false);
    } else {
      // Si première visite, marquer comme visité
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []); // Ne s'exécute qu'une fois au montage
  
  // Charger le thème depuis l'API au démarrage
  useEffect(() => {
    const loadThemeForNewVisitors = async () => {
      try {
        // Charger les paramètres depuis l'API pour les nouveaux visiteurs
        const settingsRes = await fetch('/api/settings', { cache: 'no-store' });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
          
          // Sauvegarder dans localStorage pour les prochaines visites
          localStorage.setItem('shopSettings', JSON.stringify(settingsData));
          
          // Appliquer le thème immédiatement
          if (settingsData.backgroundImage) {
            const style = document.createElement('style');
            style.id = 'dynamic-theme-new-visitor';
            style.textContent = `
              html, body, .main-container {
                background-image: url(${settingsData.backgroundImage}) !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
              }
              .global-overlay {
                background-color: rgba(0, 0, 0, ${(settings.backgroundOpacity || 20) / 100}) !important;
                backdrop-filter: blur(${settings.backgroundBlur || 5}px) !important;
              }
            `;
            document.head.appendChild(style);
          }
        }
      } catch (error) {
        console.error('Erreur chargement thème:', error);
      }
    };
    
    // Charger le thème immédiatement pour les nouveaux visiteurs
    if (!localStorage.getItem('shopSettings')) {
      loadThemeForNewVisitors();
    }
  }, []);

  // Charger immédiatement depuis l'API - PAS depuis localStorage
  const getInitialProducts = () => {
    // Toujours retourner un tableau vide pour forcer le chargement depuis l'API
    return [];
  };
  
  const getInitialCategories = () => {
    // Toujours retourner les catégories par défaut pour forcer le chargement depuis l'API
    return ['Toutes les catégories'];
  };
  
  const getInitialFarms = () => {
    // Toujours retourner les farms par défaut pour forcer le chargement depuis l'API
    return ['Toutes les farms'];
  };
  
  const [products, setProducts] = useState<Product[]>(getInitialProducts());
  const [categories, setCategories] = useState<string[]>(getInitialCategories());
  const [farms, setFarms] = useState<string[]>(getInitialFarms());

  // CHARGEMENT INSTANTANÉ DEPUIS LE CACHE
  useEffect(() => {
    // 1. D'abord charger depuis le cache pour affichage immédiat
    const cachedProducts = contentCache.getProducts();
    const cachedCategories = contentCache.getCategories();
    const cachedFarms = contentCache.getFarms();
    
    if (cachedProducts.length > 0) {
      setProducts(cachedProducts);
    }
    if (cachedCategories.length > 0) {
      setCategories(['Toutes les catégories', ...cachedCategories.map((c: any) => c.name)]);
    }
    if (cachedFarms.length > 0) {
      setFarms(['Toutes les farms', ...cachedFarms.map((f: any) => f.name)]);
    }
    
    // 2. Charger les données fraîches en arrière-plan
    const loadFreshData = async () => {
      try {
        const [productsRes, categoriesRes, farmsRes] = await Promise.all([
          fetch('/api/products', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/farms', { cache: 'no-store' })
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
        console.error('Erreur chargement données fraîches:', error);
      }
    };
    
    loadFreshData();
    
    // Cacher le chargement après un délai plus long pour être sûr qu'il soit visible
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 7000); // 7 secondes pour bien voir le chargement
    
    // Rafraîchir les données toutes les secondes pour synchronisation temps réel
    const interval = setInterval(() => {
      loadFreshData();
    }, 1000); // 1 seconde pour synchronisation instantanée
    
    // Écouter les changements de paramètres
    
    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(interval);
    };
  }, []);

  // Écouter les mises à jour du cache
  useEffect(() => {
    const handleCacheUpdate = (event: CustomEvent) => {
      const { products: newProducts, categories: newCategories, farms: newFarms } = event.detail;
      
      if (newProducts) {
        setProducts(newProducts);
      }
      
      if (newCategories) {
        setCategories(['Toutes les catégories', ...newCategories.map((c: any) => c.name)]);
      }
      
      if (newFarms) {
        setFarms(['Toutes les farms', ...newFarms.map((f: any) => f.name)]);
      }
    };
    
    window.addEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    };
  }, []);

  // Filtrage des produits
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'Toutes les catégories' || product.category === selectedCategory;
    const farmMatch = selectedFarm === 'Toutes les farms' || product.farm === selectedFarm;
    return categoryMatch && farmMatch;
  });

  const handleTabChange = (tabId: string) => {
    if (tabId === 'social') {
      router.push('/social');
    } else if (tabId === 'infos') {
      router.push('/info');
    } else if (tabId === 'contact') {
      router.push('/contact');
    } else {
      setActiveTab(tabId);
      if (tabId === 'menu') {
        setSelectedProduct(null);
      }
    }
  };

  // Écran de chargement avec fond de thème de la boutique
  if (loading) {
    return (
      <div className="main-container">
        <div className="global-overlay"></div>
        <div className="content-layer">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center bg-black/60 backdrop-blur-md rounded-2xl p-6 sm:p-8 max-w-md mx-auto border border-white/20">
              {/* Logo animé moderne avec cercle tournant */}
              <div className="mb-6">
                <div className="relative w-32 h-32 mx-auto">
                  {/* Cercle tournant avec image de fond */}
                  <div className="absolute inset-0 rounded-full overflow-hidden animate-spin-slow">
                    <div className="w-full h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-80"></div>
                    {settings?.backgroundImage && (
                      <div 
                        className="absolute inset-2 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${settings.backgroundImage})` }}
                      />
                    )}
                  </div>
                  {/* Bordure animée */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white/50 animate-spin"></div>
                </div>
              </div>
              
              {/* Titre avec taille réduite */}
              <h1 className="text-3xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text">
                PARISCOFFEE
              </h1>
              
              <p className="text-lg text-white mb-6 font-medium">
                Préparation en cours...
              </p>
              
              {/* Barre de chargement plus petite */}
              <div className="w-64 max-w-full mx-auto mb-6">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-full animate-loading-bar"></div>
                </div>
                <div className="mt-2 text-xs text-white/80">Chargement...</div>
              </div>
              
              {/* Animation de particules plus petites */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
              
              {/* Footer */}
              <div className="text-white text-sm font-medium drop-shadow-md">
                <p>© 2025 JUNIOR X PARISCOFFEE</p>
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
                {filteredProducts.length === 0 && products.length > 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-white/60 text-base sm:text-lg">
                      Aucun produit ne correspond à vos critères de recherche
                    </p>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onClick={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                ) : null}
                </main>
              </div>
            )}
      </div>
      
      {/* BottomNav - caché quand un produit est sélectionné */}
      {!selectedProduct && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}