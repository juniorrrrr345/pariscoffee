const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'bot-config.json');
const IMAGES_DIR = path.join(__dirname, 'images');

// S'assurer que le dossier images existe
fs.ensureDirSync(IMAGES_DIR);

// Import des fonctions MongoDB pour les configurations
let loadConfigFromMongoDB, saveConfigToMongoDB;
let useMongoDBConfig = false;
let mongoose = null;

try {
    mongoose = require('mongoose');
    const configMongoDB = require('./config-mongodb');
    loadConfigFromMongoDB = configMongoDB.loadConfigFromMongoDB;
    saveConfigToMongoDB = configMongoDB.saveConfigToMongoDB;
    useMongoDBConfig = true;
    console.log('✅ Module MongoDB pour configurations chargé');
} catch (error) {
    console.log('⚠️ Module MongoDB non disponible, utilisation du fichier JSON local');
}

// Configuration par défaut
const defaultConfig = {
    welcomeMessage: "🤖 Bienvenue sur notre bot!\n\nUtilisez les boutons ci-dessous pour naviguer.",
    welcomeImage: null,
    infoText: "ℹ️ Informations\n\nCeci est la section d'informations du bot.",
    miniApp: {
        url: null,
        text: "🎮 Mini Application"
    },
    socialNetworks: [
        { name: "Twitter", url: "https://twitter.com", emoji: "🐦" },
        { name: "Instagram", url: "https://instagram.com", emoji: "📷" },
        { name: "Facebook", url: "https://facebook.com", emoji: "👍" }
    ],
    socialButtonsPerRow: 3 // Nombre de boutons par ligne (1-8)
};

// Variable pour stocker la configuration en mémoire
let currentConfig = null;

// Charger la configuration (MongoDB ou fichier JSON)
async function loadConfig() {
    try {
        // Essayer d'abord MongoDB si disponible
        if (useMongoDBConfig && loadConfigFromMongoDB) {
            // Attendre que MongoDB soit connecté
            if (mongoose && mongoose.connection.readyState !== 1) {
                console.log('⏳ Attente de la connexion MongoDB pour charger la configuration...');
                // Attendre jusqu'à 10 secondes pour la connexion
                const maxWait = 10000;
                const startTime = Date.now();
                
                while (mongoose.connection.readyState !== 1 && (Date.now() - startTime) < maxWait) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                if (mongoose.connection.readyState === 1) {
                    console.log('✅ MongoDB connecté');
                } else {
                    console.log('⚠️ Timeout MongoDB, utilisation du fallback');
                    throw new Error('MongoDB connection timeout');
                }
            }
            
            console.log('📂 Chargement de la configuration depuis MongoDB...');
            currentConfig = await loadConfigFromMongoDB();
            console.log('✅ Configuration chargée depuis MongoDB');
            console.log('📝 Config actuelle:', {
                welcomeMessage: currentConfig.welcomeMessage ? 
                    currentConfig.welcomeMessage.substring(0, 30) + '...' : 'Non défini',
                socialNetworks: currentConfig.socialNetworks ? 
                    currentConfig.socialNetworks.length + ' réseaux' : '0 réseaux'
            });
            return currentConfig;
        }
    } catch (error) {
        console.error('⚠️ Erreur MongoDB, basculement vers le fichier JSON:', error.message);
    }
    
    // Fallback sur le fichier JSON
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const savedConfig = fs.readJsonSync(CONFIG_FILE);
            currentConfig = { ...defaultConfig, ...savedConfig };
            
            // Si MongoDB est disponible, migrer la config
            if (useMongoDBConfig && saveConfigToMongoDB) {
                console.log('📤 Migration de la configuration vers MongoDB...');
                await saveConfigToMongoDB(currentConfig);
                // Supprimer l'ancien fichier JSON après migration réussie
                fs.removeSync(CONFIG_FILE);
                console.log('✅ Configuration migrée vers MongoDB');
            }
            
            return currentConfig;
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
    }
    
    // Retourner la configuration par défaut si rien n'est trouvé
    currentConfig = defaultConfig;
    await saveConfig(defaultConfig);
    return currentConfig;
}

// Sauvegarder la configuration (MongoDB ou fichier JSON)
async function saveConfig(config) {
    try {
        currentConfig = config;
        
        // Essayer d'abord MongoDB si disponible
        if (useMongoDBConfig && saveConfigToMongoDB) {
            await saveConfigToMongoDB(config);
            return true;
        }
        
        // Fallback sur le fichier JSON
        fs.writeJsonSync(CONFIG_FILE, config, { spaces: 2 });
        console.log('💾 Configuration sauvegardée dans le fichier JSON');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la configuration:', error);
        return false;
    }
}

// Obtenir le chemin complet d'une image
function getImagePath(filename) {
    if (!filename) return null;
    return path.join(IMAGES_DIR, filename);
}

// Fonction pour obtenir la configuration actuelle en mémoire
function getCurrentConfig() {
    return currentConfig || defaultConfig;
}

module.exports = {
    loadConfig,
    saveConfig,
    getImagePath,
    getCurrentConfig,
    IMAGES_DIR
};