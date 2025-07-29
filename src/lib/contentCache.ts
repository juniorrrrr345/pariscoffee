// Cache global pour avoir les données admin instantanément disponibles
interface CachedData {
  settings?: any;
  infoPage?: any;
  contactPage?: any;
  socialLinks?: any[];
  products?: any[];
  categories?: any[];
  farms?: any[];
  pages?: {
    info?: { title: string; content: string };
    contact?: { title: string; content: string };
  };
}

class ContentCache {
  private data: any = {};
  private lastUpdate: number = 0;
  private cacheDuration: number = 30000; // 30 secondes au lieu de 1 seconde
  private isRefreshing: boolean = false; // Éviter les refresh simultanés

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromLocalStorage();
      // Refresh moins fréquent et avec protection
      setInterval(() => this.refreshIfNeeded(), 5000); // Toutes les 5 secondes au lieu de 500ms
    }
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('contentCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.data = parsed.data || {};
        this.lastUpdate = parsed.timestamp || 0;
      }
    } catch (error) {
      console.log('📱 Cache localStorage non disponible');
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('contentCache', JSON.stringify({
        data: this.data,
        timestamp: this.lastUpdate
      }));
    } catch (error) {
      // Storage non disponible
    }
  }

  private async refreshIfNeeded() {
    const now = Date.now();
    // Éviter les refresh trop fréquents et simultanés
    if (!this.isRefreshing && now - this.lastUpdate > this.cacheDuration) {
      await this.refresh();
    }
  }

  async initialize() {
    // Ne pas forcer le refresh si les données sont récentes
    if (!this.data.settings && Date.now() - this.lastUpdate > 60000) {
      await this.refresh();
    }
  }

  async refresh() {
    // Éviter les refresh simultanés
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    
    try {
      // Charger toutes les données en parallèle
      const [settingsRes, productsRes, categoriesRes, farmsRes, infoRes, contactRes] = await Promise.all([
        fetch('/api/settings').catch(() => null),
        fetch('/api/products').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/farms').catch(() => null),
        fetch('/api/pages/info').catch(() => null),
        fetch('/api/pages/contact').catch(() => null)
      ]);

      if (settingsRes?.ok) {
        this.data.settings = await settingsRes.json();
      }

      if (productsRes?.ok) {
        this.data.products = await productsRes.json();
      }

      if (categoriesRes?.ok) {
        this.data.categories = await categoriesRes.json();
      }

      if (farmsRes?.ok) {
        this.data.farms = await farmsRes.json();
      }

      // Ajouter les pages au cache
      if (!this.data.pages) {
        this.data.pages = {};
      }

      if (infoRes?.ok) {
        const infoData = await infoRes.json();
        this.data.pages.info = {
          title: infoData.title || 'Page Info',
          content: infoData.content || ''
        };
      }

      if (contactRes?.ok) {
        const contactData = await contactRes.json();
        this.data.pages.contact = {
          title: contactData.title || 'Page Contact',
          content: contactData.content || ''
        };
      }

      this.lastUpdate = Date.now();
      this.saveToLocalStorage();
      
      console.log('✅ Cache rafraîchi:', {
        settings: !!this.data.settings,
        products: this.data.products?.length || 0,
        categories: this.data.categories?.length || 0,
        farms: this.data.farms?.length || 0,
        infoPage: !!this.data.pages?.info,
        contactPage: !!this.data.pages?.contact
      });
    } catch (error) {
      console.error('❌ Erreur refresh cache:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  // Force refresh - utilisé après une sauvegarde
  async forceRefresh() {
    console.log('🔄 FORCE REFRESH - Récupération immédiate des données admin...');
    this.lastUpdate = 0; // Force un refresh
    await this.refreshAll();
  }

  // Obtenir les settings instantanément - TOUJOURS depuis l'API admin
  getSettings() {
    // Retourner null si pas de données admin pour forcer le chargement depuis l'API
    return this.data.settings || null;
  }

  // Obtenir le contenu info instantanément - TOUJOURS depuis cache frais
  getInfoContent() {
    return this.data.infoPage?.content || null; // Retourner null si pas de données admin
  }

  // Obtenir le contenu contact instantanément - TOUJOURS depuis cache frais
  getContactContent() {
    return this.data.contactPage?.content || null; // Retourner null si pas de données admin
  }

  // Obtenir les produits instantanément
  getProducts() {
    return this.data.products || [];
  }

  // Obtenir les catégories instantanément
  getCategories() {
    return this.data.categories || [];
  }

  // Obtenir les farms instantanément
  getFarms() {
    return this.data.farms || [];
  }

  // Obtenir les liens sociaux
  getSocialLinks() {
    return this.data.socialLinks || [];
  }

  // Getters pour les pages
  getInfoPage() {
    return this.data.pages?.info || null;
  }

  getContactPage() {
    return this.data.pages?.contact || null;
  }

  // Updaters pour les pages
  updateInfoPage(page: { title: string; content: string }) {
    if (!this.data.pages) {
      this.data.pages = {};
    }
    this.data.pages.info = page;
    this.saveToLocalStorage();
  }

  updateContactPage(page: { title: string; content: string }) {
    if (!this.data.pages) {
      this.data.pages = {};
    }
    this.data.pages.contact = page;
    this.saveToLocalStorage();
  }



  updateSettings(settings: any) {
    this.data.settings = settings;
    this.saveToLocalStorage();
  }

  updateProducts(products: any[]) {
    this.data.products = products;
    this.saveToLocalStorage();
  }

  updateCategories(categories: any[]) {
    this.data.categories = categories;
    this.saveToLocalStorage();
  }

  updateFarms(farms: any[]) {
    this.data.farms = farms;
    this.saveToLocalStorage();
  }

  // Invalidate cache - force une nouvelle récupération IMMÉDIATE
  invalidate() {
    console.log('♻️ CACHE INVALIDÉ - Prochaine requête sera ultra-fraîche');
    this.lastUpdate = 0;
    this.data = {}; // Vider complètement les données
    if (typeof window !== 'undefined') {
      localStorage.removeItem('contentCache');
    }
  }

  // Obtenir le timestamp de la dernière mise à jour
  getLastUpdate() {
    return this.lastUpdate;
  }

  // Vérifier si le cache est frais
  isFresh() {
    return (Date.now() - this.lastUpdate) < this.cacheDuration;
  }
}

// Instance singleton
const contentCache = new ContentCache();

// Export pour compatibilité avec l'ancien code
export const instantContent = contentCache;

export default contentCache;
