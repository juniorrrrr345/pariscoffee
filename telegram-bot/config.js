const mongoose = require('mongoose');
require('dotenv').config();

// Configuration par défaut qui sera TOUJOURS disponible
const defaultConfig = {
    botId: 'main',
    welcomeMessage: "🤖 Bienvenue {firstname} sur notre bot!\n\nUtilisez les boutons ci-dessous pour naviguer.",
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
let mongoConnected = false;
let Config = null;

// Connexion MongoDB (non bloquante)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/?retryWrites=true&w=majority&appName=Pariscoffee';

// Initialiser MongoDB en arrière-plan
async function initMongoDB() {
    try {
        const mongoOptions = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        };

        await mongoose.connect(MONGODB_URI, mongoOptions);
        console.log('✅ Connecté à MongoDB');
        mongoConnected = true;

        // Schéma pour la configuration du bot
        const configSchema = new mongoose.Schema({
            botId: { type: String, default: 'main', unique: true, required: true },
            welcomeMessage: { type: String, default: defaultConfig.welcomeMessage },
            welcomeImage: { type: String, default: null },
            infoText: { type: String, default: defaultConfig.infoText },
            miniApp: {
                url: { type: String, default: null },
                text: { type: String, default: "🎮 Mini Application" }
            },
            socialNetworks: [{
                name: String,
                url: String,
                emoji: String
            }],
            socialButtonsPerRow: { type: Number, default: 3 },
            lastModified: { type: Date, default: Date.now }
        }, { timestamps: true });

        // Vérifier si le modèle existe déjà
        try {
            Config = mongoose.model('BotConfig');
        } catch (error) {
            Config = mongoose.model('BotConfig', configSchema);
        }

        // Charger la configuration depuis MongoDB
        const dbConfig = await Config.findOne({ botId: 'main' }).lean();
        if (dbConfig) {
            currentConfig = dbConfig;
            console.log('✅ Configuration MongoDB chargée');
        } else {
            // Créer la configuration par défaut dans MongoDB
            const newConfig = await Config.create(defaultConfig);
            currentConfig = newConfig.toObject();
            console.log('✅ Configuration par défaut créée dans MongoDB');
        }
    } catch (error) {
        console.log('⚠️ MongoDB non disponible, utilisation de la config locale:', error.message);
        mongoConnected = false;
    }
}

// Lancer l'initialisation MongoDB sans bloquer
initMongoDB().catch(console.error);

// Charger la configuration (retourne toujours une config valide)
async function loadConfig() {
    // Si MongoDB est connecté, essayer de recharger
    if (mongoConnected && Config) {
        try {
            const dbConfig = await Config.findOne({ botId: 'main' }).lean();
            if (dbConfig) {
                currentConfig = dbConfig;
            }
        } catch (error) {
            console.error('⚠️ Erreur chargement MongoDB:', error.message);
        }
    }
    
    // Toujours retourner la config actuelle (jamais null)
    return currentConfig;
}

// Sauvegarder la configuration
async function saveConfig(configData) {
    try {
        // Mettre à jour en mémoire
        currentConfig = { ...currentConfig, ...configData };
        
        // Si MongoDB est connecté, sauvegarder
        if (mongoConnected && Config) {
            const dataToSave = {
                botId: 'main',
                welcomeMessage: currentConfig.welcomeMessage,
                welcomeImage: currentConfig.welcomeImage,
                infoText: currentConfig.infoText,
                miniApp: currentConfig.miniApp,
                socialNetworks: currentConfig.socialNetworks,
                socialButtonsPerRow: currentConfig.socialButtonsPerRow || 3,
                lastModified: new Date()
            };
            
            await Config.findOneAndUpdate(
                { botId: 'main' },
                { $set: dataToSave },
                { 
                    new: true, 
                    upsert: true,
                    runValidators: true
                }
            );
            console.log('✅ Configuration sauvegardée dans MongoDB');
        } else {
            console.log('💾 Configuration sauvegardée en mémoire (MongoDB non disponible)');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        return false;
    }
}

// Obtenir l'URL d'une image
function getImagePath(imageUrl) {
    return imageUrl;
}

// Obtenir la configuration actuelle
function getCurrentConfig() {
    return currentConfig;
}

module.exports = {
    loadConfig,
    saveConfig,
    getImagePath,
    getCurrentConfig,
    IMAGES_DIR: null
};