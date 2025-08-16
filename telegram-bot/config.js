const fs = require('fs-extra');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'bot-config.json');
const IMAGES_DIR = path.join(__dirname, 'images');

// S'assurer que le dossier images existe
fs.ensureDirSync(IMAGES_DIR);

// Configuration par défaut qui sera TOUJOURS utilisée au démarrage
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
    socialButtonsPerRow: 3
};

// Variable pour stocker la configuration actuelle
let currentConfig = { ...defaultConfig };

// Tentative de chargement MongoDB (sans bloquer)
let mongoDBAvailable = false;
let saveConfigToMongoDB = null;
let loadConfigFromMongoDB = null;

// Essayer de charger MongoDB en arrière-plan
setTimeout(() => {
    try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            const configMongoDB = require('./config-mongodb');
            loadConfigFromMongoDB = configMongoDB.loadConfigFromMongoDB;
            saveConfigToMongoDB = configMongoDB.saveConfigToMongoDB;
            mongoDBAvailable = true;
            console.log('✅ MongoDB disponible pour les configurations');
            
            // Charger la config depuis MongoDB en arrière-plan
            loadConfigFromMongoDB().then(config => {
                if (config) {
                    currentConfig = config;
                    console.log('✅ Configuration MongoDB chargée');
                }
            }).catch(err => {
                console.log('⚠️ Erreur chargement config MongoDB:', err.message);
            });
        }
    } catch (error) {
        console.log('ℹ️ MongoDB non disponible, utilisation de la config locale');
    }
}, 2000);

// Charger la configuration (retourne toujours une config valide immédiatement)
async function loadConfig() {
    // Toujours retourner la config actuelle immédiatement
    return currentConfig;
}

// Sauvegarder la configuration
async function saveConfig(config) {
    try {
        // Mettre à jour la config en mémoire
        currentConfig = config;
        
        // Sauvegarder dans MongoDB si disponible
        if (mongoDBAvailable && saveConfigToMongoDB) {
            try {
                await saveConfigToMongoDB(config);
                console.log('✅ Configuration sauvegardée dans MongoDB');
            } catch (error) {
                console.error('⚠️ Erreur sauvegarde MongoDB:', error.message);
            }
        }
        
        // Toujours sauvegarder dans le fichier JSON comme backup
        fs.writeJsonSync(CONFIG_FILE, config, { spaces: 2 });
        console.log('💾 Configuration sauvegardée localement');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

// Obtenir le chemin complet d'une image
function getImagePath(filename) {
    if (!filename) return null;
    return path.join(IMAGES_DIR, filename);
}

// Obtenir la configuration actuelle
function getCurrentConfig() {
    return currentConfig;
}

// Charger la config depuis le fichier JSON si elle existe
try {
    if (fs.existsSync(CONFIG_FILE)) {
        const savedConfig = fs.readJsonSync(CONFIG_FILE);
        currentConfig = { ...defaultConfig, ...savedConfig };
        console.log('📂 Configuration locale chargée');
    }
} catch (error) {
    console.log('ℹ️ Utilisation de la configuration par défaut');
}

module.exports = {
    loadConfig,
    saveConfig,
    getImagePath,
    getCurrentConfig,
    IMAGES_DIR
};