import { connectToDatabase } from '@/lib/mongodb-runtime';

async function initializeDatabase() {
  try {
    console.log('🔧 Initialisation de la base de données PLUG...');
    
    const { db } = await connectToDatabase();
    
    // Vérifier si l'initialisation a déjà été faite
    const settingsCollection = db.collection('settings');
    const existingSettings = await settingsCollection.findOne({});
    
    if (existingSettings) {
      console.log('✅ Base de données déjà initialisée');
      return;
    }
    
    console.log('📦 Création des données par défaut PLUG...');
    
    // Initialiser les catégories par défaut
    const categoriesCollection = db.collection('categories');
    await categoriesCollection.insertMany([
      {
        name: 'Premium',
        description: 'Produits premium PLUG',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Standard',
        description: 'Produits standard PLUG',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Exclusive',
        description: 'Collection exclusive PLUG',
        isActive: true,
        createdAt: new Date()
      }
    ]);
    console.log('✅ Catégories créées');
    
    // Initialiser les farms par défaut
    const farmsCollection = db.collection('farms');
    await farmsCollection.insertMany([
      {
        name: 'PLUG Premium',
        description: 'Fournisseur premium officiel PLUG',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'PLUG Select',
        description: 'Sélection exclusive PLUG',
        isActive: true,
        createdAt: new Date()
      }
    ]);
    console.log('✅ Fournisseurs créés');
    
    // Initialiser les paramètres PLUG
    await settingsCollection.insertOne({
      shopTitle: 'PLUG',
      shopSubtitle: 'Boutique en ligne',
      titleStyle: 'glow',
      bannerText: '',
      scrollingText: 'BIENVENUE CHEZ PLUG 3.0 📲 • CONTACT DISPONIBLE',
      backgroundImage: '',
      backgroundOpacity: 20,
      backgroundBlur: 5,
      telegramLink: 'https://t.me/plugchannel',
      canalLink: 'https://t.me/plugchannel',
      deliveryInfo: '🚚 Livraison rapide • 📦 Envoi sécurisé',
      qualityInfo: 'Qualité PLUG garantie • Produits premium',
      email: 'contact@plug.fr',
      address: 'France',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Paramètres PLUG créés');
    
    // Initialiser les pages PLUG
    const pagesCollection = db.collection('pages');
    
    await pagesCollection.insertMany([
      {
        slug: 'info',
        title: 'À propos de PLUG',
        content: `# À propos de PLUG

**PLUG** est votre boutique en ligne de référence pour des produits de qualité exceptionnelle.

## Nos spécialités PLUG
- 🔌 **Innovation PLUG** - Toujours à la pointe de la technologie
- ⚡ **Rapidité** - Livraison express en 24/48h
- 🛡️ **Sécurité** - Paiement 100% sécurisé
- ✅ **Qualité PLUG** - Produits sélectionnés avec soin
- 🎯 **Service client** - Support réactif 7j/7
- 💎 **Satisfaction** - Garantie satisfait ou remboursé

## Nos Services
- ✅ Livraison Rapide et Discrète
- ✅ Support Client 24/7
- ✅ Qualité PLUG Certifiée
- ✅ Satisfaction Garantie

## Pourquoi PLUG ?

Nous nous engageons à vous offrir la meilleure expérience d'achat possible avec des produits testés et approuvés.

*PLUG - Votre partenaire de confiance*`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        slug: 'contact',
        title: 'Contactez PLUG',
        content: `# Contactez PLUG

## Contact
**Telegram:** @plugchannel
**Email:** contact@plug.fr
**Disponibilité:** 7j/7

## Livraison
**Zone:** France entière
**Délai:** 24-48h

Rejoignez-nous sur @plugchannel !`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('✅ Pages PLUG créées');
    
    // Initialiser les liens sociaux
    const socialLinksCollection = db.collection('socialLinks');
    await socialLinksCollection.insertMany([
      {
        name: 'Telegram',
        url: 'https://t.me/plugchannel',
        icon: '📱',
        color: '#0088cc',
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Instagram',
        url: 'https://instagram.com/plug',
        icon: '📷',
        color: '#E4405F',
        isActive: true,
        createdAt: new Date()
      }
    ]);
    console.log('✅ Liens sociaux PLUG créés');
    
    console.log('🎉 Base de données PLUG initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Export pour utilisation
export { initializeDatabase };

// Si exécuté directement
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Initialisation terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

// Export par défaut pour compatibilité
export default initializeDatabase;