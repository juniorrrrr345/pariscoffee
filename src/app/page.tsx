'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

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
  const [loading, setLoading] = useState(() => {
    // Afficher le chargement seulement si c'est la première visite
    if (typeof window !== 'undefined') {
      const hasVisited = sessionStorage.getItem('hasVisited');
      if (!hasVisited) {
        sessionStorage.setItem('hasVisited', 'true');
        return true;
      }
    }
    return false;
  });
  
  // Charger immédiatement depuis localStorage si disponible
  const getInitialProducts = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('products');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {}
    }
    return contentCache.getProducts();
  };
  
  const getInitialCategories = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('categories');
        if (cached) {
          const categories = JSON.parse(cached);
          return ['Toutes les catégories', ...categories.map((c: any) => c.name)];
        }
      } catch (e) {}
    }
    const cached = contentCache.getCategories();
    return cached.length > 0 ? ['Toutes les catégories', ...cached.map((c: any) => c.name)] : ['Toutes les catégories'];
  };
  
  const getInitialFarms = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('farms');
        if (cached) {
          const farms = JSON.parse(cached);
          return ['Toutes les farms', ...farms.map((f: any) => f.name)];
        }
      } catch (e) {}
    }
    const cached = contentCache.getFarms();
    return cached.length > 0 ? ['Toutes les farms', ...cached.map((f: any) => f.name)] : ['Toutes les farms'];
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
    
    // Cacher le chargement après un court délai
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 secondes
    
    // Rafraîchir les données toutes les 2 secondes pour synchronisation
    const interval = setInterval(() => {
      loadFreshData();
    }, 2000);
    
    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(interval);
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

  // Écran de chargement original avec fond de thème
  if (loading) {
    return (
      <div className="main-container">
        <div className="global-overlay"></div>
        <div className="content-layer">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              {/* Animation de connexion */}
              <div className="mb-8 relative">
                <div className="inline-flex items-center gap-4 text-4xl sm:text-5xl md:text-6xl">
                  <span className="animate-pulse">📲</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
                  </div>
                  <span className="animate-pulse animation-delay-1000">🔌</span>
                </div>
              </div>
              
              {/* Texte de connexion */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 animate-pulse">
                Connexion en cours
              </h2>
              
              {/* Barre de progression */}
              <div className="w-64 h-1 bg-white/20 rounded-full mx-auto mb-8 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-loading-bar"></div>
              </div>
              
              {/* Signature discrète */}
              <p className="text-xs text-white/40 font-light tracking-wider">
                JUNIOR X JBEL
              </p>
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
      
      {/* BottomNav toujours visible - en dehors du content-layer */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}