const mongoose = require('mongoose');

// Schéma pour les configurations du bot
const botConfigSchema = new mongoose.Schema({
    configId: { 
        type: String, 
        required: true, 
        unique: true, 
        default: 'main' // Une seule config principale
    },
    welcomeMessage: {
        type: String,
        default: "🤖 Bienvenue sur notre bot!\n\nUtilisez les boutons ci-dessous pour naviguer."
    },
    welcomeImage: {
        type: String,
        default: null
    },
    infoText: {
        type: String,
        default: "ℹ️ Informations\n\nCeci est la section d'informations du bot."
    },
    miniApp: {
        url: { type: String, default: null },
        text: { type: String, default: "🎮 Mini Application" }
    },
    socialNetworks: [{
        name: String,
        url: String,
        emoji: String
    }],
    socialButtonsPerRow: {
        type: Number,
        default: 3,
        min: 1,
        max: 8
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Mettre à jour automatiquement la date de modification
botConfigSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

botConfigSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const BotConfig = mongoose.model('BotConfig', botConfigSchema);

// Configuration par défaut
const defaultConfig = {
    configId: 'main',
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

// Charger la configuration depuis MongoDB
async function loadConfigFromMongoDB() {
    try {
        let config = await BotConfig.findOne({ configId: 'main' });
        
        if (!config) {
            // Si aucune config n'existe, créer la config par défaut
            console.log('📝 Création de la configuration par défaut dans MongoDB...');
            config = await BotConfig.create(defaultConfig);
            console.log('✅ Configuration par défaut créée dans MongoDB');
        }
        
        return config.toObject();
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la configuration depuis MongoDB:', error);
        return defaultConfig;
    }
}

// Sauvegarder la configuration dans MongoDB
async function saveConfigToMongoDB(configData) {
    try {
        // S'assurer que configId est toujours 'main'
        configData.configId = 'main';
        
        const config = await BotConfig.findOneAndUpdate(
            { configId: 'main' },
            configData,
            { 
                new: true, 
                upsert: true,
                runValidators: true
            }
        );
        
        console.log('✅ Configuration sauvegardée dans MongoDB');
        return config.toObject();
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la configuration dans MongoDB:', error);
        throw error;
    }
}

// Réinitialiser la configuration aux valeurs par défaut
async function resetConfigToDefault() {
    try {
        const config = await BotConfig.findOneAndUpdate(
            { configId: 'main' },
            defaultConfig,
            { 
                new: true, 
                upsert: true,
                runValidators: true
            }
        );
        
        console.log('🔄 Configuration réinitialisée aux valeurs par défaut');
        return config.toObject();
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation de la configuration:', error);
        throw error;
    }
}

module.exports = {
    BotConfig,
    loadConfigFromMongoDB,
    saveConfigToMongoDB,
    resetConfigToDefault,
    defaultConfig
};