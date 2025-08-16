require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { loadConfig, saveConfig, getImagePath, IMAGES_DIR } = require('./config');
const { getMainKeyboard, getAdminKeyboard, getSocialManageKeyboard, getSocialLayoutKeyboard, getConfirmKeyboard } = require('./keyboards');

// Configuration Express
const app = express();
const PORT = process.env.PORT || 10000;

// Vérifier les variables d'environnement
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN n\'est pas défini dans le fichier .env');
    process.exit(1);
}

if (!process.env.ADMIN_ID) {
    console.error('❌ ADMIN_ID n\'est pas défini dans le fichier .env');
    process.exit(1);
}

// URL de votre app Render
const WEBHOOK_URL = process.env.WEBHOOK_URL || `https://telegram-bot-webhook.onrender.com`;

// Initialiser le bot en mode webhook
const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: true });
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

// Middleware Express
app.use(express.json());

// Route pour le webhook Telegram
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Route de santé pour Render
app.get('/', (req, res) => {
    res.send('Bot Telegram is running in webhook mode! 🤖');
});

// Route de santé
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mode: 'webhook',
        timestamp: new Date().toISOString() 
    });
});

// Configuration MongoDB
let mongoose;
let BotUser;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/test?retryWrites=true&w=majority&appName=Pariscoffee';
let mongoConnectionPromise = null;

// Essayer de charger MongoDB, sinon utiliser les fichiers JSON
try {
    mongoose = require('mongoose');
    
    // Schéma simple pour les utilisateurs du bot
    const botUserSchema = new mongoose.Schema({
        userId: { type: Number, required: true, unique: true },
        username: String,
        firstName: String,
        lastName: String,
        isAdmin: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now }
    });
    
    BotUser = mongoose.model('BotUser', botUserSchema);
    
    // Connexion à MongoDB avec retry
    const connectWithRetry = async () => {
        const maxRetries = 5;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                await mongoose.connect(MONGODB_URI, {
                    serverSelectionTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                });
                console.log('✅ Bot connecté à MongoDB');
                await loadUsersFromMongoDB();
                // Configuration déjà chargée, pas besoin de recharger
                return true;
            } catch (err) {
                retries++;
                console.error(`⚠️ Tentative ${retries}/${maxRetries} échouée:`, err.message);
                if (retries < maxRetries) {
                    console.log(`⏳ Nouvelle tentative dans 3 secondes...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    console.error('❌ Impossible de se connecter à MongoDB après', maxRetries, 'tentatives');
                    loadUsersFromFiles();
                    return false;
                }
            }
        }
    };
    
    // Lancer la connexion MongoDB
    mongoConnectionPromise = connectWithRetry();
    
} catch (error) {
    console.log('⚠️ MongoDB non installé, utilisation des fichiers JSON');
    loadUsersFromFiles();
}

// État des utilisateurs et configuration
const userStates = {};
const activeMessages = {};

// Charger la configuration immédiatement (toujours disponible)
let config = null;
loadConfig().then(loadedConfig => {
    config = loadedConfig;
    console.log('✅ Configuration chargée');
}).catch(error => {
    console.error('❌ Erreur de configuration, utilisation des valeurs par défaut');
    config = {
        welcomeMessage: "🤖 Bienvenue sur notre bot!",
        welcomeImage: null,
        infoText: "ℹ️ Informations",
        miniApp: { url: null, text: "🎮 Mini Application" },
        socialNetworks: [],
        socialButtonsPerRow: 3
    };
});

// Gestion des utilisateurs et admins
const users = new Set();
const admins = new Set([ADMIN_ID]);
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMINS_FILE = path.join(__dirname, 'admins.json');

// Fonctions pour MongoDB
async function loadUsersFromMongoDB() {
    try {
        const botUsers = await BotUser.find({});
        users.clear();
        admins.clear();
        admins.add(ADMIN_ID);
        
        botUsers.forEach(user => {
            users.add(user.userId);
            if (user.isAdmin) {
                admins.add(user.userId);
            }
        });
        
        console.log(`✅ ${users.size} utilisateurs chargés depuis MongoDB`);
    } catch (error) {
        console.error('❌ Erreur chargement MongoDB:', error);
        loadUsersFromFiles();
    }
}

async function saveUserToMongoDB(userId, userData = {}) {
    if (!BotUser) return;
    
    try {
        await BotUser.findOneAndUpdate(
            { userId },
            { 
                userId,
                ...userData,
                lastActive: new Date()
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('❌ Erreur sauvegarde utilisateur MongoDB:', error);
    }
}

// Fonctions pour fichiers JSON (fallback)
function loadUsersFromFiles() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readJsonSync(USERS_FILE);
            data.forEach(userId => users.add(userId));
        }
        if (fs.existsSync(ADMINS_FILE)) {
            const data = fs.readJsonSync(ADMINS_FILE);
            data.forEach(adminId => admins.add(adminId));
        }
        console.log(`📁 ${users.size} utilisateurs chargés depuis les fichiers JSON`);
    } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
    }
}

function saveUsers() {
    try {
        fs.writeJsonSync(USERS_FILE, Array.from(users));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    }
}

function saveAdmins() {
    try {
        fs.writeJsonSync(ADMINS_FILE, Array.from(admins));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des admins:', error);
    }
}

// Si MongoDB n'est pas disponible, charger depuis les fichiers
if (!mongoose) {
    loadUsersFromFiles();
}

// Fonction pour supprimer tous les messages actifs d'un chat
async function deleteActiveMessage(chatId) {
    if (activeMessages[chatId]) {
        try {
            await bot.deleteMessage(chatId, activeMessages[chatId]);
        } catch (error) {
            // Ignorer si le message est déjà supprimé
        }
        delete activeMessages[chatId];
    }
}

// Fonction pour envoyer un message et supprimer l'ancien
async function sendNewMessage(chatId, text, options = {}) {
    await deleteActiveMessage(chatId);
    
    try {
        const message = await bot.sendMessage(chatId, text, options);
        activeMessages[chatId] = message.message_id;
        return message;
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
    }
}

// Fonction pour envoyer une photo et supprimer l'ancien message
async function sendNewPhoto(chatId, photo, options = {}) {
    await deleteActiveMessage(chatId);
    
    try {
        const message = await bot.sendPhoto(chatId, photo, options);
        activeMessages[chatId] = message.message_id;
        return message;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la photo:', error);
    }
}

// Fonction pour éditer le message actif ou en envoyer un nouveau
async function updateMessage(chatId, messageId, text, options = {}) {
    try {
        if (activeMessages[chatId] === messageId) {
            await bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                ...options
            });
            return { message_id: messageId };
        } else {
            return await sendNewMessage(chatId, text, options);
        }
    } catch (error) {
        return await sendNewMessage(chatId, text, options);
    }
}

// Fonction pour envoyer le message d'info
async function sendInfoMessage(chatId, messageId) {
    const infoText = config.infoText || 'Aucune information disponible.';
    await updateMessage(chatId, messageId, infoText, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[
                { text: '⬅️ Retour', callback_data: 'back_to_main' }
            ]]
        }
    });
}

// Fonction pour envoyer le message de bienvenue
async function sendWelcomeMessage(chatId, editMessageId = null, userInfo = null) {
    try {
        let personalizedMessage = config.welcomeMessage || 'Bienvenue !';
        
        if (userInfo) {
            personalizedMessage = personalizedMessage
                .replace(/{firstname}/gi, userInfo.first_name || '')
                .replace(/{lastname}/gi, userInfo.last_name || '')
                .replace(/{username}/gi, userInfo.username ? `@${userInfo.username}` : '')
                .replace(/{fullname}/gi, `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim());
        }
        
        const options = {
            reply_markup: getMainKeyboard(config),
            parse_mode: 'HTML'
        };

        if (config.welcomeImage) {
            const imagePath = getImagePath(config.welcomeImage);
            if (fs.existsSync(imagePath)) {
                await sendNewPhoto(chatId, imagePath, {
                    caption: personalizedMessage,
                    ...options
                });
            } else {
                if (editMessageId && activeMessages[chatId] === editMessageId) {
                    await updateMessage(chatId, editMessageId, personalizedMessage, options);
                } else {
                    await sendNewMessage(chatId, personalizedMessage, options);
                }
            }
        } else {
            if (editMessageId && activeMessages[chatId] === editMessageId) {
                await updateMessage(chatId, editMessageId, personalizedMessage, options);
            } else {
                await sendNewMessage(chatId, personalizedMessage, options);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message d\'accueil:', error);
        await sendNewMessage(chatId, '❌ Une erreur s\'est produite. Veuillez réessayer.');
    }
}

// Commande /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // S'assurer que la configuration est chargée
    if (!config) {
        config = await loadConfig();
    }
    
    // Sauvegarder l'utilisateur
    await saveUserToMongoDB(userId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name
    });
    
    if (!users.has(userId)) {
        users.add(userId);
        saveUsers();
    }
    
    await sendWelcomeMessage(chatId, null, msg.from);
});

// Commande /admin
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!admins.has(userId)) {
        await sendNewMessage(chatId, '❌ Vous n\'êtes pas autorisé à accéder au menu administrateur.');
        return;
    }

    await sendNewMessage(chatId, '🔧 Menu Administrateur', {
        reply_markup: getAdminKeyboard()
    });
});

// Gestion des callbacks (boutons)
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // S'assurer que la configuration est chargée
    if (!config) {
        config = await loadConfig();
    }

    // Répondre immédiatement au callback pour éviter l'erreur de timeout
    try {
        await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
        // Ignorer les erreurs de callbacks expirés
        if (error.message && error.message.includes('query is too old')) {
            console.log('Callback expiré ignoré:', callbackQuery.id);
            return;
        }
        console.error('Erreur lors de la réponse au callback:', error.message);
        return;
    }

    // Ajouter l'utilisateur s'il n'existe pas
    if (!users.has(userId)) {
        users.add(userId);
        saveUsers();
        await saveUserToMongoDB(userId, {
            username: callbackQuery.from.username,
            firstName: callbackQuery.from.first_name,
            lastName: callbackQuery.from.last_name
        });
    }

    try {
        switch(data) {
            case 'back_to_main':
                delete userStates[chatId];
                await sendWelcomeMessage(chatId, messageId, callbackQuery.from);
                break;

            case 'info':
                await sendInfoMessage(chatId, messageId);
                break;

            case 'admin_menu':
                if (!admins.has(userId)) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: '❌ Accès refusé. Seuls les administrateurs peuvent accéder à ce menu.',
                        show_alert: true
                    });
                    return;
                }
                delete userStates[chatId];
                await updateMessage(chatId, messageId, '🔧 Menu Administrateur', {
                    reply_markup: getAdminKeyboard()
                });
                break;

            case 'admin_edit_welcome':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'editing_welcome', messageId };
                await updateMessage(chatId, messageId, '📝 Envoyez le nouveau message d\'accueil:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_edit_photo':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'editing_welcome_image', messageId };
                await updateMessage(chatId, messageId, '📸 Envoyez la nouvelle photo d\'accueil:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_edit_miniapp':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'editing_miniapp_name', messageId };
                await updateMessage(chatId, messageId, '📱 Entrez le nom de la mini application:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_edit_info':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'editing_info', messageId };
                await updateMessage(chatId, messageId, 'ℹ️ Entrez les nouvelles informations:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_manage_social':
                if (!admins.has(userId)) return;
                await updateMessage(chatId, messageId, '🌐 Gestion des réseaux sociaux', {
                    reply_markup: getSocialManageKeyboard(config)
                });
                break;

            case 'admin_add_social':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'adding_social_name', messageId };
                await updateMessage(chatId, messageId, '📝 Entrez le nom du réseau social:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_manage_social' }
                        ]]
                    }
                });
                break;

            case 'admin_social_layout':
                if (!admins.has(userId)) return;
                await updateMessage(chatId, messageId, '📐 Choisissez la disposition des boutons:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '1️⃣ Un par ligne', callback_data: 'social_layout_1' }],
                            [{ text: '2️⃣ Deux par ligne', callback_data: 'social_layout_2' }],
                            [{ text: '3️⃣ Trois par ligne', callback_data: 'social_layout_3' }],
                            [{ text: '⬅️ Retour', callback_data: 'admin_manage_social' }]
                        ]
                    }
                });
                break;

            case 'admin_broadcast':
                if (!admins.has(userId)) return;
                userStates[chatId] = { action: 'broadcast_message', messageId };
                await updateMessage(chatId, messageId, 
                    `📢 Envoyez le message à diffuser à tous les utilisateurs.\n\n` +
                    `👥 ${users.size - admins.size} utilisateurs recevront ce message.`, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_manage_admins':
                if (!admins.has(userId)) return;
                if (userId !== ADMIN_ID) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: '❌ Seul l\'administrateur principal peut gérer les autres administrateurs.',
                        show_alert: true
                    });
                    return;
                }
                const adminsList = await Promise.all(Array.from(admins).map(async (id) => {
                    try {
                        const user = await BotUser.findOne({ userId: id });
                        const name = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu';
                        const username = user ? (user.username ? `@${user.username}` : '') : '';
                        if (id === ADMIN_ID) {
                            return `👑 **${name}**${username ? ` (${username})` : ''}\n   └─ ID: \`${id}\` _(Principal)_`;
                        }
                        return `👤 **${name}**${username ? ` (${username})` : ''}\n   └─ ID: \`${id}\``;
                    } catch (error) {
                        if (id === ADMIN_ID) return `👑 ID: \`${id}\` _(Principal)_`;
                        return `👤 ID: \`${id}\``;
                    }
                }));
                
                const adminCount = admins.size;
                await updateMessage(chatId, messageId, 
                    `👥 **Gestion des Administrateurs**\n\n` +
                    `📊 Total: ${adminCount} administrateur${adminCount > 1 ? 's' : ''}\n\n` +
                    `Liste des administrateurs:\n${adminsList.join('\n\n')}`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '➕ Ajouter un admin', callback_data: 'admin_add_admin' }],
                            [{ text: '➖ Retirer un admin', callback_data: 'admin_remove_admin' }],
                            [{ text: '⬅️ Retour', callback_data: 'admin_menu' }]
                        ]
                    }
                });
                break;

            case 'admin_add_admin':
                if (!admins.has(userId) || userId !== ADMIN_ID) return;
                userStates[chatId] = { action: 'adding_admin', messageId };
                await updateMessage(chatId, messageId, 
                    `➕ **Ajouter un Administrateur**\n\n` +
                    `Envoyez l'ID de l'utilisateur à promouvoir administrateur.\n\n` +
                    `💡 _Pour obtenir l'ID d'un utilisateur, demandez-lui d'envoyer /myid au bot._`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '❌ Annuler', callback_data: 'admin_manage_admins' }
                        ]]
                    }
                });
                break;

            case 'admin_remove_admin':
                if (!admins.has(userId) || userId !== ADMIN_ID) return;
                const removableAdmins = Array.from(admins).filter(id => id !== ADMIN_ID);
                if (removableAdmins.length === 0) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: '⚠️ Aucun administrateur à retirer.',
                        show_alert: true
                    });
                    return;
                }
                
                const removableList = await Promise.all(removableAdmins.map(async (id) => {
                    try {
                        const user = await BotUser.findOne({ userId: id });
                        const name = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
                        const username = user ? (user.username ? `@${user.username}` : '') : '';
                        return [{ 
                            text: `❌ ${name}${username ? ` (${username})` : ''}`, 
                            callback_data: `remove_admin_${id}` 
                        }];
                    } catch (error) {
                        return [{ text: `❌ ID: ${id}`, callback_data: `remove_admin_${id}` }];
                    }
                }));
                
                removableList.push([{ text: '⬅️ Retour', callback_data: 'admin_manage_admins' }]);
                
                await updateMessage(chatId, messageId, 
                    `➖ **Retirer un Administrateur**\n\n` +
                    `Sélectionnez l'administrateur à retirer:`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: removableList }
                });
                break;

            case 'admin_stats':
                if (!admins.has(userId)) return;
                const totalUsers = users.size;
                const totalAdmins = admins.size;
                const regularUsers = totalUsers - totalAdmins;
                
                let mongoStatus = '❌ Non connecté';
                try {
                    if (mongoose.connection.readyState === 1) {
                        const dbUsers = await BotUser.countDocuments();
                        mongoStatus = `✅ Connecté (${dbUsers} utilisateurs)`;
                    }
                } catch (error) {
                    mongoStatus = '❌ Erreur de connexion';
                }
                
                await updateMessage(chatId, messageId, 
                    `📊 **Statistiques du Bot**\n\n` +
                    `👥 **Utilisateurs**\n` +
                    `├─ Total: ${totalUsers}\n` +
                    `├─ Utilisateurs: ${regularUsers}\n` +
                    `└─ Administrateurs: ${totalAdmins}\n\n` +
                    `🗄️ **Base de données**\n` +
                    `└─ MongoDB: ${mongoStatus}\n\n` +
                    `🤖 **Bot**\n` +
                    `├─ Mode: Webhook\n` +
                    `├─ Version: 1.0.0\n` +
                    `└─ Uptime: ${Math.floor(process.uptime() / 60)} minutes`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '⬅️ Retour', callback_data: 'admin_menu' }
                        ]]
                    }
                });
                break;

            case 'admin_close':
                if (!admins.has(userId)) return;
                delete userStates[chatId];
                await updateMessage(chatId, messageId, '✅ Panel administrateur fermé.\n\nUtilisez /admin pour rouvrir.');
                break;

            default:
                // Gérer les callbacks dynamiques
                if (data.startsWith('social_layout_')) {
                    if (!admins.has(userId)) return;
                    const layout = parseInt(data.split('_')[2]);
                    config.socialButtonsPerRow = layout;
                    await saveConfig(config);
                    await updateMessage(chatId, messageId, `✅ Disposition mise à jour: ${layout} bouton(s) par ligne`, {
                        reply_markup: getSocialManageKeyboard(config)
                    });
                } else if (data.startsWith('admin_delete_social_')) {
                    if (!admins.has(userId)) return;
                    const index = parseInt(data.split('_')[3]);
                    if (config.socialNetworks && config.socialNetworks[index]) {
                        const removed = config.socialNetworks.splice(index, 1)[0];
                        await saveConfig(config);
                        await updateMessage(chatId, messageId, `✅ "${removed.name}" supprimé!`, {
                            reply_markup: getSocialManageKeyboard(config)
                        });
                    }
                } else if (data.startsWith('remove_admin_')) {
                    if (!admins.has(userId) || userId !== ADMIN_ID) return;
                    const adminToRemove = parseInt(data.split('_')[2]);
                    if (adminToRemove && adminToRemove !== ADMIN_ID) {
                        await setAdmin(adminToRemove, false);
                        
                        // Notifier l'admin retiré
                        try {
                            await bot.sendMessage(adminToRemove, 
                                `⚠️ **Notification**\n\n` +
                                `Vos privilèges d'administrateur ont été révoqués.`, 
                                { parse_mode: 'Markdown' }
                            );
                        } catch (error) {
                            // L'utilisateur a peut-être bloqué le bot
                        }
                        
                        await bot.answerCallbackQuery(callbackQuery.id, {
                            text: '✅ Administrateur retiré avec succès',
                            show_alert: false
                        });
                        
                        // Rafraîchir la liste
                        const adminsList = await Promise.all(Array.from(admins).map(async (id) => {
                            try {
                                const user = await BotUser.findOne({ userId: id });
                                const name = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu';
                                const username = user ? (user.username ? `@${user.username}` : '') : '';
                                if (id === ADMIN_ID) {
                                    return `👑 **${name}**${username ? ` (${username})` : ''}\n   └─ ID: \`${id}\` _(Principal)_`;
                                }
                                return `👤 **${name}**${username ? ` (${username})` : ''}\n   └─ ID: \`${id}\``;
                            } catch (error) {
                                if (id === ADMIN_ID) return `👑 ID: \`${id}\` _(Principal)_`;
                                return `👤 ID: \`${id}\``;
                            }
                        }));
                        
                        const adminCount = admins.size;
                        await updateMessage(chatId, messageId, 
                            `👥 **Gestion des Administrateurs**\n\n` +
                            `✅ Administrateur retiré avec succès!\n\n` +
                            `📊 Total: ${adminCount} administrateur${adminCount > 1 ? 's' : ''}\n\n` +
                            `Liste des administrateurs:\n${adminsList.join('\n\n')}`, {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: '➕ Ajouter un admin', callback_data: 'admin_add_admin' }],
                                    [{ text: '➖ Retirer un admin', callback_data: 'admin_remove_admin' }],
                                    [{ text: '⬅️ Retour', callback_data: 'admin_menu' }]
                                ]
                            }
                        });
                    }
                }
                break;
        }
    } catch (error) {
        console.error('Erreur lors du traitement du callback:', error);
        // Ne pas faire crasher le bot
    }
});

// Gestion des messages texte
bot.on('message', async (msg) => {
    // Ignorer les commandes
    if (msg.text && msg.text.startsWith('/')) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates[chatId];

    if (!state) return;

    // Attendre que la configuration soit chargée
    if (!config) {
        try {
            config = await loadConfig();
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            await bot.sendMessage(chatId, '⚠️ Le bot est en cours d\'initialisation. Veuillez réessayer dans quelques secondes.');
            return;
        }
    }

    // Gestion selon l'état de l'utilisateur
    switch(state.action) {
        case 'editing_welcome':
            if (!admins.has(userId)) return;
            if (msg.text) {
                config.welcomeMessage = msg.text;
                await saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    '✅ Message d\'accueil mis à jour avec succès !',
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                );
            }
            break;

        case 'editing_info':
            if (!admins.has(userId)) return;
            if (msg.text) {
                config.infoText = msg.text;
                await saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    '✅ Informations mises à jour avec succès !',
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                );
            }
            break;

        case 'editing_miniapp_name':
            if (!admins.has(userId)) return;
            if (msg.text) {
                if (!config.miniApp) config.miniApp = {};
                config.miniApp.text = msg.text;
                userStates[chatId] = { action: 'editing_miniapp_url' };
                await sendNewMessage(chatId, 
                    `📱 Nom enregistré: ${msg.text}\n\n` +
                    `Maintenant, envoyez l'URL de la mini application:`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'admin_menu' }]] }}
                );
            }
            break;

        case 'editing_miniapp_url':
            if (!admins.has(userId)) return;
            if (msg.text) {
                if (!config.miniApp) config.miniApp = {};
                config.miniApp.url = msg.text;
                await saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    '✅ Mini application configurée avec succès !',
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                );
            }
            break;

        case 'adding_social_name':
            if (!admins.has(userId)) return;
            if (msg.text) {
                userStates[chatId] = { 
                    action: 'adding_social_url', 
                    socialName: msg.text 
                };
                await sendNewMessage(chatId, 
                    `2️⃣ Maintenant, envoyez l'URL pour ${msg.text}\n\n` +
                    `Format : https://...`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'admin_manage_social' }]] }}
                );
            }
            break;

        case 'adding_social_url':
            if (!admins.has(userId)) return;
            if (msg.text) {
                userStates[chatId] = { 
                    action: 'adding_social_icon', 
                    socialName: state.socialName,
                    socialUrl: msg.text 
                };
                await sendNewMessage(chatId, 
                    `3️⃣ Enfin, envoyez une icône emoji pour ${state.socialName}\n\n` +
                    `Exemples : 📷 💬 🐦 📱 🎵`,
                    { reply_markup: { inline_keyboard: [[{ text: '⏭ Utiliser icône par défaut (🔗)', callback_data: 'use_default_icon' }]] }}
                );
            }
            break;

        case 'adding_social_icon':
            if (!admins.has(userId)) return;
            if (msg.text || (msg.data === 'use_default_icon')) {
                const icon = msg.text || '🔗';
                if (!config.socialNetworks) {
                    config.socialNetworks = [];
                }
                config.socialNetworks.push({
                    name: state.socialName,
                    url: state.socialUrl,
                    icon: icon
                });
                await saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    `✅ ${state.socialName} a été ajouté avec succès !`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_manage_social' }]] }}
                );
            }
            break;

        case 'editing_social':
            if (!admins.has(userId)) return;
            if (msg.text) {
                config.socialNetworks[state.socialIndex].url = msg.text;
                await saveConfig(config);
                userStates[chatId] = { 
                    action: 'editing_social_icon', 
                    socialIndex: state.socialIndex 
                };
                await sendNewMessage(chatId, 
                    `URL mise à jour !\n\n` +
                    `Maintenant, envoyez la nouvelle icône emoji :`,
                    { reply_markup: { inline_keyboard: [[{ text: '⏭ Garder l\'icône actuelle', callback_data: 'keep_current_icon' }]] }}
                );
            }
            break;

        case 'editing_social_icon':
            if (!admins.has(userId)) return;
            if (msg.text || (msg.data === 'keep_current_icon')) {
                if (msg.text) {
                    config.socialNetworks[state.socialIndex].icon = msg.text;
                }
                await saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    `✅ ${config.socialNetworks[state.socialIndex].name} a été mis à jour avec succès !`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_manage_social' }]] }}
                );
            }
            break;

        case 'broadcasting':
            if (!admins.has(userId)) return;
            if (msg.text || msg.photo) {
                let successCount = 0;
                let failCount = 0;
                
                for (const targetUserId of users) {
                    try {
                        if (msg.photo) {
                            await bot.sendPhoto(targetUserId, msg.photo[msg.photo.length - 1].file_id, {
                                caption: msg.caption || '',
                                parse_mode: 'HTML'
                            });
                        } else {
                            await bot.sendMessage(targetUserId, msg.text, { parse_mode: 'HTML' });
                        }
                        successCount++;
                    } catch (error) {
                        failCount++;
                    }
                }
                
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    `📢 Diffusion terminée !\n\n` +
                    `✅ Envoyé à : ${successCount} utilisateurs\n` +
                    `❌ Échec : ${failCount} utilisateurs`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                );
            }
            break;
    }
});

// Gestion des photos
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = userStates[chatId];

    if (!state) return;

    // Attendre que la configuration soit chargée
    if (!config) {
        try {
            config = await loadConfig();
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            await bot.sendMessage(chatId, '⚠️ Le bot est en cours d\'initialisation. Veuillez réessayer dans quelques secondes.');
            return;
        }
    }

    if (state.action === 'editing_welcome_image') {
        if (!admins.has(userId)) return;
        
        try {
            // Obtenir la photo de meilleure qualité
            const photo = msg.photo[msg.photo.length - 1];
            const fileId = photo.file_id;

            // Télécharger la photo
            const file = await bot.getFile(fileId);
            const filePath = file.file_path;
            const downloadUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;

            // Sauvegarder la photo
            const fileName = `welcome_${Date.now()}.jpg`;
            const localPath = path.join(IMAGES_DIR, fileName);

            // Créer le dossier images s'il n'existe pas
            fs.ensureDirSync(IMAGES_DIR);

            const https = require('https');
            const fileStream = fs.createWriteStream(localPath);

            https.get(downloadUrl, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', async () => {
                    fileStream.close();
                    
                    // Supprimer l'ancienne photo si elle existe
                    if (config.welcomeImage) {
                        const oldPath = getImagePath(config.welcomeImage);
                        if (fs.existsSync(oldPath)) {
                            try {
                                fs.unlinkSync(oldPath);
                            } catch (error) {
                                console.error('Erreur lors de la suppression de l\'ancienne image:', error);
                            }
                        }
                    }

                    // Mettre à jour la configuration
                    config.welcomeImage = fileName;
                    await saveConfig(config);
                    delete userStates[chatId];

                    await sendNewMessage(chatId, 
                        '✅ Image d\'accueil mise à jour avec succès !',
                        { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                    );
                });

                fileStream.on('error', async (error) => {
                    console.error('Erreur lors de l\'écriture du fichier:', error);
                    await sendNewMessage(chatId, 
                        '❌ Erreur lors de la sauvegarde de l\'image. Veuillez réessayer.',
                        { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                    );
                });
            }).on('error', async (error) => {
                console.error('Erreur lors du téléchargement de l\'image:', error);
                await sendNewMessage(chatId, 
                    '❌ Erreur lors du téléchargement de l\'image. Veuillez réessayer.',
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
                );
            });
        } catch (error) {
            console.error('Erreur lors du traitement de la photo:', error);
            await sendNewMessage(chatId, 
                '❌ Une erreur s\'est produite lors du traitement de la photo. Veuillez réessayer.',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
            );
        }
    } else if (state.action === 'broadcasting') {
        // Géré dans le handler de message principal
        const messageHandler = bot._events.message[bot._events.message.length - 1];
        messageHandler(msg);
    }
});

// Commandes admin supplémentaires
bot.onText(/\/addadmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = parseInt(match[1]);

    if (userId !== ADMIN_ID) {
        await sendNewMessage(chatId, '❌ Seul l\'administrateur principal peut ajouter des admins.');
        return;
    }

    if (isNaN(targetId)) {
        await sendNewMessage(chatId, '❌ ID invalide. Utilisez : /addadmin [ID]');
        return;
    }

    admins.add(targetId);
    saveAdmins();
    
    if (BotUser) {
        await BotUser.findOneAndUpdate(
            { userId: targetId },
            { isAdmin: true },
            { upsert: true }
        );
    }
    
    await sendNewMessage(chatId, `✅ L'utilisateur ${targetId} est maintenant administrateur.`);
});

bot.onText(/\/removeadmin (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const targetId = parseInt(match[1]);

    if (userId !== ADMIN_ID) {
        await sendNewMessage(chatId, '❌ Seul l\'administrateur principal peut retirer des admins.');
        return;
    }

    if (targetId === ADMIN_ID) {
        await sendNewMessage(chatId, '❌ Impossible de retirer l\'administrateur principal.');
        return;
    }

    admins.delete(targetId);
    saveAdmins();
    
    if (BotUser) {
        await BotUser.findOneAndUpdate(
            { userId: targetId },
            { isAdmin: false }
        );
    }
    
    await sendNewMessage(chatId, `✅ L'utilisateur ${targetId} n'est plus administrateur.`);
});

// Démarrer le serveur Express
app.listen(PORT, async () => {
    console.log(`🌐 Serveur démarré sur le port ${PORT}`);
    
    // Configurer le webhook
    const webhookUrl = `${WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`;
    try {
        await bot.setWebHook(webhookUrl);
        console.log(`🔗 Webhook configuré: ${webhookUrl}`);
        
        const webhookInfo = await bot.getWebHookInfo();
        console.log('ℹ️ Info webhook:', {
            url: webhookInfo.url,
            has_custom_certificate: webhookInfo.has_custom_certificate,
            pending_update_count: webhookInfo.pending_update_count,
            last_error_date: webhookInfo.last_error_date,
            last_error_message: webhookInfo.last_error_message
        });
    } catch (error) {
        console.error('❌ Erreur lors de la configuration du webhook:', error);
    }
    
    console.log('🤖 Bot démarré avec succès en mode webhook!');
    console.log(`📱 Bot: @ParisCoffeee_bot`);
    console.log(`👤 Admin ID: ${ADMIN_ID}`);
});