require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const { loadConfig, saveConfig } = require('./config');
const { User, Image } = require('./models');
const { getMainKeyboard, getAdminKeyboard, getSocialManageKeyboard, getSocialLayoutKeyboard, getConfirmKeyboard } = require('./keyboards');

// Configuration Express pour webhook
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '10mb' }));

// Vérifier les variables d'environnement
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN n\'est pas défini dans le fichier .env');
    process.exit(1);
}

if (!process.env.ADMIN_ID) {
    console.error('❌ ADMIN_ID n\'est pas défini dans le fichier .env');
    process.exit(1);
}

const ADMIN_ID = parseInt(process.env.ADMIN_ID);

// Configuration webhook
const WEBHOOK_URL = process.env.WEBHOOK_URL || 
                    process.env.RENDER_EXTERNAL_URL || 
                    'https://idffull.onrender.com';
const WEBHOOK_PATH = `/bot${process.env.BOT_TOKEN}`;

// Variables globales
let bot;
let retryCount = 0;
const maxRetries = 3;
let keepAliveInterval;

// État des utilisateurs
const userStates = {};
const activeMessages = {};
const messageHistory = {};

// Configuration globale
let config = {};

// Temps de démarrage
const botStartTime = new Date();

// Routes Express
app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    res.json({
        status: '✅ Bot en ligne',
        uptime: `${hours}h ${minutes}m`,
        webhook: WEBHOOK_URL + WEBHOOK_PATH
    });
});

app.get('/health', async (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.post(WEBHOOK_PATH, (req, res) => {
    if (bot) {
        bot.processUpdate(req.body);
    }
    res.sendStatus(200);
});

// Système keep-alive
function startKeepAlive() {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEPALIVE === 'true') {
        console.log('🔄 Keep-alive activé');
        keepAliveInterval = setInterval(async () => {
            try {
                await axios.get(`${WEBHOOK_URL}/health`, { timeout: 5000 });
            } catch (error) {
                // Ignorer les erreurs
            }
        }, 5 * 60 * 1000);
    }
}

// Fonction pour sauvegarder/mettre à jour un utilisateur
async function saveUser(userId, userInfo = {}) {
    try {
        await User.findOneAndUpdate(
            { userId },
            {
                userId,
                username: userInfo.username,
                firstName: userInfo.first_name,
                lastName: userInfo.last_name,
                lastSeen: new Date(),
                $inc: { messageCount: 1 }
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Erreur sauvegarde utilisateur:', error);
    }
}

// Vérifier si un utilisateur est admin
async function isAdmin(userId) {
    try {
        const user = await User.findOne({ userId, isAdmin: true });
        return !!user;
    } catch (error) {
        return userId === ADMIN_ID;
    }
}

// Fonction pour supprimer tous les messages d'un chat
async function deleteAllMessages(chatId) {
    if (!messageHistory[chatId]) return;
    
    for (const msgId of messageHistory[chatId]) {
        try {
            await bot.deleteMessage(chatId, msgId);
        } catch (error) {
            // Message déjà supprimé ou erreur
        }
    }
    messageHistory[chatId] = [];
}

// Fonction pour ajouter un message à l'historique
function addToHistory(chatId, messageId) {
    if (!messageHistory[chatId]) {
        messageHistory[chatId] = [];
    }
    messageHistory[chatId].push(messageId);
    
    // Garder seulement les 10 derniers messages
    if (messageHistory[chatId].length > 10) {
        messageHistory[chatId].shift();
    }
}

// Fonction améliorée pour envoyer ou éditer un message
async function sendOrEditMessage(chatId, text, keyboard, parseMode = 'HTML', forceNew = false) {
    try {
        // Si forceNew, supprimer tous les anciens messages
        if (forceNew) {
            await deleteAllMessages(chatId);
            delete activeMessages[chatId];
        }
        
        if (activeMessages[chatId] && !forceNew) {
            try {
                await bot.editMessageText(text, {
                    chat_id: chatId,
                    message_id: activeMessages[chatId],
                    reply_markup: keyboard,
                    parse_mode: parseMode
                });
                return activeMessages[chatId];
            } catch (error) {
                // Si l'édition échoue, envoyer un nouveau message
            }
        }
        
        const sentMsg = await bot.sendMessage(chatId, text, {
            reply_markup: keyboard,
            parse_mode: parseMode
        });
        activeMessages[chatId] = sentMsg.message_id;
        addToHistory(chatId, sentMsg.message_id);
        return sentMsg.message_id;
    } catch (error) {
        console.error('Erreur envoi message:', error);
    }
}

// Définir tous les handlers du bot
function setupBotHandlers() {
    // Commande /start
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        // Sauvegarder l'utilisateur
        await saveUser(userId, msg.from);
        
        // NE PAS supprimer la commande /start - la laisser visible
        
        // Supprimer tous les anciens messages du bot
        await deleteAllMessages(chatId);
        
        // Message personnalisé
        const firstName = msg.from.first_name || 'là';
        const welcomeText = config.welcomeMessage
            ? config.welcomeMessage.replace('{firstname}', firstName)
            : `Bienvenue ${firstName}! 👋`;
        
        // Envoyer le message d'accueil
        if (config.welcomeImage) {
            try {
                const sentMsg = await bot.sendPhoto(chatId, config.welcomeImage, {
                    caption: welcomeText,
                    reply_markup: getMainKeyboard(config),
                    parse_mode: 'HTML'
                });
                activeMessages[chatId] = sentMsg.message_id;
                addToHistory(chatId, sentMsg.message_id);
            } catch (error) {
                // Si l'image échoue, envoyer juste le texte
                await sendOrEditMessage(chatId, welcomeText, getMainKeyboard(config), 'HTML', true);
            }
        } else {
            await sendOrEditMessage(chatId, welcomeText, getMainKeyboard(config), 'HTML', true);
        }
    });

    // Commande /admin
    bot.onText(/\/admin/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        // Supprimer le message de commande
        try {
            await bot.deleteMessage(chatId, msg.message_id);
        } catch (error) {}
        
        // Vérifier si l'utilisateur est admin
        if (!await isAdmin(userId)) {
            const errorMsg = await bot.sendMessage(chatId, '❌ Accès refusé. Cette commande est réservée aux administrateurs.');
            setTimeout(() => bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {}), 3000);
            return;
        }
        
        // Supprimer tous les anciens messages
        await deleteAllMessages(chatId);
        
        // Afficher le menu admin
        await showAdminMenu(chatId);
    });

    // Commande /notifications - Gérer les préférences de notifications
    bot.onText(/\/notifications/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        
        try {
            // Récupérer l'utilisateur depuis la DB
            let user = await User.findOne({ userId });
            
            if (!user) {
                // Créer l'utilisateur s'il n'existe pas
                user = await User.create({
                    userId,
                    username: msg.from.username,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    notificationsEnabled: true
                });
            }
            
            const currentStatus = user.notificationsEnabled ? '✅ Activées' : '❌ Désactivées';
            
            await sendOrEditMessage(chatId,
                `🔔 <b>Gestion des notifications</b>\n\n` +
                `État actuel: ${currentStatus}\n\n` +
                `Les notifications vous permettent de recevoir des messages importants de l'administrateur.\n\n` +
                `<i>Vous pouvez modifier ce paramètre à tout moment.</i>`,
                {
                    inline_keyboard: [
                        [
                            { 
                                text: user.notificationsEnabled ? '🔕 Désactiver' : '🔔 Activer', 
                                callback_data: user.notificationsEnabled ? 'notifications_off' : 'notifications_on' 
                            }
                        ],
                        [{ text: '🔙 Retour au menu', callback_data: 'back_to_menu' }]
                    ]
                }
            );
        } catch (error) {
            console.error('Erreur gestion notifications:', error);
            await bot.sendMessage(chatId, '❌ Une erreur s\'est produite. Veuillez réessayer.');
        }
    });

    // Callback pour les boutons
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const userId = callbackQuery.from.id;
        const data = callbackQuery.data;
        
        // Répondre au callback pour enlever le "chargement"
        await bot.answerCallbackQuery(callbackQuery.id);
        
        // Gestion des différents callbacks
        switch(data) {
            case 'info':
                await handleInfo(chatId);
                break;
                
            case 'back_to_menu':
                await handleBackToMenu(chatId, userId);
                break;
                
            case 'admin_message':
                if (await isAdmin(userId)) {
                    userStates[userId] = 'waiting_welcome_message';
                    await sendOrEditMessage(chatId, 
                        '📝 <b>Modifier le message d\'accueil</b>\n\n' +
                        'Envoyez le nouveau message d\'accueil.\n' +
                        'Vous pouvez utiliser {firstname} pour personnaliser le message.\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_back' }]] }
                    );
                }
                break;
                
            case 'admin_photo':
                if (await isAdmin(userId)) {
                    userStates[userId] = 'waiting_welcome_photo';
                    await sendOrEditMessage(chatId,
                        '🖼️ <b>Modifier la photo d\'accueil</b>\n\n' +
                        'Envoyez la nouvelle photo d\'accueil.\n' +
                        'La photo sera affichée avec le message d\'accueil.\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_back' }]] }
                    );
                }
                break;
                
            case 'admin_miniapp':
                if (await isAdmin(userId)) {
                    await handleMiniAppConfig(chatId, userId);
                }
                break;
                
            case 'admin_social':
                if (await isAdmin(userId)) {
                    await handleSocialConfig(chatId);
                }
                break;
                
            case 'admin_info':
                if (await isAdmin(userId)) {
                    userStates[userId] = 'waiting_info_text';
                    await sendOrEditMessage(chatId,
                        'ℹ️ <b>Modifier les informations</b>\n\n' +
                        'Envoyez le nouveau texte pour la section informations.\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_back' }]] }
                    );
                }
                break;
                
            case 'admin_broadcast':
                if (await isAdmin(userId)) {
                    await handleBroadcast(chatId, userId);
                }
                break;
                
            case 'admin_admins':
                if (await isAdmin(userId)) {
                    await handleAdminManagement(chatId, userId);
                }
                break;
                
            case 'admin_stats':
                if (await isAdmin(userId)) {
                    await handleStats(chatId);
                }
                break;
                
            case 'admin_back':
                if (await isAdmin(userId)) {
                    // Nettoyer l'état et retourner au menu admin
                    delete userStates[userId];
                    
                    // Supprimer tous les anciens messages
                    await deleteAllMessages(chatId);
                    
                    // Afficher le menu admin
                    await showAdminMenu(chatId);
                }
                break;
                
            // Gestion des réseaux sociaux
            case 'social_add':
                if (await isAdmin(userId)) {
                    userStates[userId] = 'adding_social_name';
                    await sendOrEditMessage(chatId,
                        '➕ <b>Ajouter un réseau social</b>\n\n' +
                        '1️⃣ Envoyez le nom du réseau (ex: Instagram)\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_social' }]] }
                    );
                }
                break;
                
            case 'social_remove':
                if (await isAdmin(userId)) {
                    await handleSocialRemove(chatId);
                }
                break;
                
            case 'social_layout':
                if (await isAdmin(userId)) {
                    await handleSocialLayout(chatId);
                }
                break;
                
            // Gestion des admins
            case 'admin_add':
                if (userId === ADMIN_ID) {
                    userStates[userId] = 'adding_admin';
                    await sendOrEditMessage(chatId,
                        '➕ <b>Ajouter un administrateur</b>\n\n' +
                        'Envoyez l\'ID Telegram du nouvel admin.\n' +
                        'Pour obtenir un ID, la personne doit utiliser @userinfobot\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_admins' }]] }
                    );
                }
                break;
                
            case 'admin_remove':
                if (userId === ADMIN_ID) {
                    await handleAdminRemove(chatId);
                }
                break;
                
            case 'broadcast_all':
                if (await isAdmin(userId)) {
                    userStates[userId] = 'broadcast_message';
                    await sendOrEditMessage(chatId,
                        '📢 <b>Message à tous les utilisateurs</b>\n\n' +
                        'Envoyez le message à diffuser.\n' +
                        'Il sera envoyé à tous les utilisateurs du bot.\n\n' +
                        '<i>Envoyez /cancel pour annuler.</i>',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_back' }]] }
                    );
                }
                break;
        }
        
        // Callbacks pour supprimer un réseau social
        if (data.startsWith('remove_social_')) {
            const index = parseInt(data.replace('remove_social_', ''));
            if (config.socialNetworks && config.socialNetworks[index]) {
                config.socialNetworks.splice(index, 1);
                await saveConfig(config);
                await sendOrEditMessage(chatId, '✅ Réseau social supprimé!', { inline_keyboard: [] });
                setTimeout(() => handleSocialConfig(chatId), 1000);
            }
        }
        
        // Callbacks pour supprimer un admin
        if (data.startsWith('remove_admin_')) {
            const adminId = parseInt(data.replace('remove_admin_', ''));
            if (userId === ADMIN_ID && adminId !== ADMIN_ID) {
                await User.findOneAndUpdate({ userId: adminId }, { isAdmin: false });
                await sendOrEditMessage(chatId, '✅ Administrateur supprimé!', { inline_keyboard: [] });
                setTimeout(() => handleAdminManagement(chatId, userId), 1000);
            }
        }
        
        // Callbacks pour le layout des réseaux sociaux
        if (data.startsWith('layout_')) {
            const buttonsPerRow = parseInt(data.replace('layout_', ''));
            config.socialButtonsPerRow = buttonsPerRow;
            await saveConfig(config);
            await sendOrEditMessage(chatId, `✅ Disposition mise à jour: ${buttonsPerRow} boutons par ligne`, { inline_keyboard: [] });
            setTimeout(() => handleSocialConfig(chatId), 1000);
        }

        // Gestion des notifications
        if (data === 'notifications_on') {
            await User.findOneAndUpdate(
                { userId },
                { notificationsEnabled: true },
                { upsert: true }
            );
            
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '✅ Notifications activées!',
                show_alert: true
            });
            
            await sendOrEditMessage(chatId,
                `✅ <b>Notifications activées</b>\n\n` +
                `Vous recevrez désormais les messages importants de l'administrateur.\n\n` +
                `<i>Vous pouvez modifier ce paramètre à tout moment avec /notifications</i>`,
                {
                    inline_keyboard: [[{ text: '🔙 Retour au menu', callback_data: 'back_to_menu' }]]
                }
            );
        } else if (data === 'notifications_off') {
            await User.findOneAndUpdate(
                { userId },
                { notificationsEnabled: false },
                { upsert: true }
            );
            
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '🔕 Notifications désactivées',
                show_alert: true
            });
            
            await sendOrEditMessage(chatId,
                `🔕 <b>Notifications désactivées</b>\n\n` +
                `Vous ne recevrez plus de messages de diffusion.\n\n` +
                `<i>Vous pouvez réactiver les notifications à tout moment avec /notifications</i>`,
                {
                    inline_keyboard: [[{ text: '🔙 Retour au menu', callback_data: 'back_to_menu' }]]
                }
            );
        }
    });

    // Gestion des messages texte
    bot.on('message', async (msg) => {
        if (msg.text && msg.text.startsWith('/')) return;
        if (msg.photo) return; // Géré séparément
        
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const userState = userStates[userId];
        
        // Supprimer le message de l'utilisateur pour garder le chat propre
        if (userState) {
            try {
                await bot.deleteMessage(chatId, msg.message_id);
            } catch (error) {}
        }
        
        // Gérer les annulations
        if (msg.text === '/cancel') {
            delete userStates[userId];
            await sendOrEditMessage(chatId, '❌ Action annulée.', { inline_keyboard: [] });
            setTimeout(() => showAdminMenu(chatId), 1000);
            return;
        }
        
        // Gérer les différents états
        switch(userState) {
            case 'waiting_welcome_message':
                config.welcomeMessage = msg.text;
                await saveConfig(config);
                delete userStates[userId];
                await sendOrEditMessage(chatId, '✅ Message d\'accueil mis à jour!', { inline_keyboard: [] });
                setTimeout(() => showAdminMenu(chatId), 1000);
                break;
                
            case 'waiting_info_text':
                config.infoText = msg.text;
                await saveConfig(config);
                delete userStates[userId];
                await sendOrEditMessage(chatId, '✅ Texte des informations mis à jour!', { inline_keyboard: [] });
                setTimeout(() => showAdminMenu(chatId), 1000);
                break;
                
            case 'config_miniapp':
                if (msg.text.toLowerCase() === 'remove') {
                    config.miniApp = { url: null, text: '🎮 Mini Application' };
                    await saveConfig(config);
                    delete userStates[userId];
                    await sendOrEditMessage(chatId, '✅ Mini application supprimée!', { inline_keyboard: [] });
                    setTimeout(() => showAdminMenu(chatId), 1000);
                } else if (msg.text.startsWith('http')) {
                    userStates[userId] = 'config_miniapp_text';
                    userStates[userId + '_url'] = msg.text;
                    await sendOrEditMessage(chatId,
                        '📱 <b>Configuration Mini App - Étape 2/2</b>\n\n' +
                        'Maintenant, envoyez le texte du bouton.\n' +
                        'Exemple: 🎮 Jouer maintenant',
                        { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_back' }]] }
                    );
                } else {
                    await sendOrEditMessage(chatId, '❌ URL invalide. Elle doit commencer par http:// ou https://', { inline_keyboard: [] });
                }
                break;
                
            case 'config_miniapp_text':
                const url = userStates[userId + '_url'];
                config.miniApp = { url, text: msg.text };
                await saveConfig(config);
                delete userStates[userId];
                delete userStates[userId + '_url'];
                await sendOrEditMessage(chatId, '✅ Mini application configurée!', { inline_keyboard: [] });
                setTimeout(() => showAdminMenu(chatId), 1000);
                break;
                
            case 'adding_social_name':
                userStates[userId] = 'adding_social_url';
                userStates[userId + '_social_name'] = msg.text;
                await sendOrEditMessage(chatId,
                    '➕ <b>Ajouter un réseau social - Étape 2/3</b>\n\n' +
                    '2️⃣ Maintenant, envoyez l\'URL complète.\n' +
                    'Exemple: https://instagram.com/votrepage',
                    { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_social' }]] }
                );
                break;
                
            case 'adding_social_url':
                userStates[userId] = 'adding_social_emoji';
                userStates[userId + '_social_url'] = msg.text;
                await sendOrEditMessage(chatId,
                    '➕ <b>Ajouter un réseau social - Étape 3/3</b>\n\n' +
                    '3️⃣ Enfin, envoyez un emoji pour ce réseau.\n' +
                    'Exemple: 📷 ou 🐦 ou 👍',
                    { inline_keyboard: [[{ text: '❌ Annuler', callback_data: 'admin_social' }]] }
                );
                break;
                
            case 'adding_social_emoji':
                const name = userStates[userId + '_social_name'];
                const socialUrl = userStates[userId + '_social_url'];
                const emoji = msg.text;
                
                if (!config.socialNetworks) config.socialNetworks = [];
                config.socialNetworks.push({ name, url: socialUrl, emoji });
                await saveConfig(config);
                
                delete userStates[userId];
                delete userStates[userId + '_social_name'];
                delete userStates[userId + '_social_url'];
                
                await sendOrEditMessage(chatId, '✅ Réseau social ajouté!', { inline_keyboard: [] });
                setTimeout(() => handleSocialConfig(chatId), 1000);
                break;
                
            case 'adding_admin':
                const newAdminId = parseInt(msg.text);
                if (!isNaN(newAdminId)) {
                    await User.findOneAndUpdate(
                        { userId: newAdminId },
                        { userId: newAdminId, isAdmin: true },
                        { upsert: true }
                    );
                    delete userStates[userId];
                    await sendOrEditMessage(chatId, '✅ Nouvel administrateur ajouté!', { inline_keyboard: [] });
                    setTimeout(() => handleAdminManagement(chatId, userId), 1000);
                } else {
                    await sendOrEditMessage(chatId, '❌ ID invalide. Envoyez un nombre.', { inline_keyboard: [] });
                }
                break;
                
            case 'broadcast_message':
                await handleBroadcastSend(chatId, userId, msg.text);
                break;
        }
    });

    // Gestion des photos
    bot.on('photo', async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const userState = userStates[userId];
        
        // Supprimer le message photo pour garder le chat propre
        if (userState === 'waiting_welcome_photo') {
            try {
                await bot.deleteMessage(chatId, msg.message_id);
            } catch (error) {}
            
            try {
                // Récupérer la photo la plus grande
                const photo = msg.photo[msg.photo.length - 1];
                const fileId = photo.file_id;
                
                // Sauvegarder l'ID de la photo (Telegram garde les photos)
                config.welcomeImage = fileId;
                await saveConfig(config);
                
                delete userStates[userId];
                await sendOrEditMessage(chatId, '✅ Photo d\'accueil mise à jour!', { inline_keyboard: [] });
                
                setTimeout(() => showAdminMenu(chatId), 1000);
            } catch (error) {
                console.error('Erreur sauvegarde photo:', error);
                await sendOrEditMessage(chatId, '❌ Erreur lors de la sauvegarde de la photo.', { inline_keyboard: [] });
            }
        }
    });

    // Gestion des erreurs
    bot.on('polling_error', async (error) => {
        console.error('Erreur polling:', error.message);
        
        // Si c'est une erreur 409 (conflit), essayer de redémarrer
        if (error.message && error.message.includes('409')) {
            console.log('⚠️ Conflit détecté, tentative de reconnexion...');
            
            try {
                // Arrêter le polling actuel
                await bot.stopPolling();
                
                // Attendre un peu
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Redémarrer
                await createBot();
            } catch (restartError) {
                console.error('❌ Impossible de redémarrer:', restartError.message);
            }
        }
    });
}

// Fonctions helper
async function showAdminMenu(chatId) {
    // Afficher le menu admin
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    const uptime = Math.floor((Date.now() - botStartTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const adminText = `🔧 <b>Panel d'administration</b>\n\n` +
        `📊 <b>Statistiques:</b>\n` +
        `• Utilisateurs: ${totalUsers}\n` +
        `• Administrateurs: ${totalAdmins}\n` +
        `• En ligne depuis: ${hours}h ${minutes}min\n\n` +
        `Que souhaitez-vous faire?`;
    
    await sendOrEditMessage(chatId, adminText, getAdminKeyboard(), 'HTML', true);
}

async function handleInfo(chatId) {
    const infoText = config.infoText || 'ℹ️ Aucune information disponible.';
    
    // Supprimer tous les anciens messages
    await deleteAllMessages(chatId);
    
    if (config.welcomeImage) {
        try {
            const sentMsg = await bot.sendPhoto(chatId, config.welcomeImage, {
                caption: infoText,
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🔙 Retour', callback_data: 'back_to_menu' }
                    ]]
                },
                parse_mode: 'HTML'
            });
            activeMessages[chatId] = sentMsg.message_id;
            addToHistory(chatId, sentMsg.message_id);
        } catch (error) {
            // Si l'image échoue, envoyer juste le texte
            await sendOrEditMessage(chatId, infoText, {
                inline_keyboard: [[
                    { text: '🔙 Retour', callback_data: 'back_to_menu' }
                ]]
            }, 'HTML', true);
        }
    } else {
        await sendOrEditMessage(chatId, infoText, {
            inline_keyboard: [[
                { text: '🔙 Retour', callback_data: 'back_to_menu' }
            ]]
        }, 'HTML', true);
    }
}

async function handleBackToMenu(chatId, userId) {
    // Supprimer tous les anciens messages
    await deleteAllMessages(chatId);
    
    const user = await User.findOne({ userId });
    const firstName = user?.firstName || 'là';
    const welcomeText = config.welcomeMessage
        ? config.welcomeMessage.replace('{firstname}', firstName)
        : `Bienvenue ${firstName}! 👋`;
    
    // Afficher le message d'accueil avec l'image si elle existe
    if (config.welcomeImage) {
        try {
            const sentMsg = await bot.sendPhoto(chatId, config.welcomeImage, {
                caption: welcomeText,
                reply_markup: getMainKeyboard(config),
                parse_mode: 'HTML'
            });
            activeMessages[chatId] = sentMsg.message_id;
            addToHistory(chatId, sentMsg.message_id);
        } catch (error) {
            // Si l'image échoue, envoyer juste le texte
            await sendOrEditMessage(chatId, welcomeText, getMainKeyboard(config), 'HTML', true);
        }
    } else {
        await sendOrEditMessage(chatId, welcomeText, getMainKeyboard(config), 'HTML', true);
    }
}

async function handleMiniAppConfig(chatId, userId) {
    userStates[userId] = 'config_miniapp';
    await sendOrEditMessage(chatId,
        '📱 <b>Configuration Mini App</b>\n\n' +
        `URL actuelle: ${config.miniApp?.url || 'Non définie'}\n` +
        `Texte du bouton: ${config.miniApp?.text || '🎮 Mini Application'}\n\n` +
        'Envoyez l\'URL de votre mini application ou "remove" pour la supprimer.\n' +
        'Format: https://votre-app.com\n\n' +
        '<i>Envoyez /cancel pour annuler.</i>',
        { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_back' }]] }
    );
}

async function handleSocialConfig(chatId) {
    const text = '🌐 <b>Gestion des réseaux sociaux</b>\n\n' +
        'Réseaux actuels:\n' +
        (config.socialNetworks?.map((n, i) => `${i + 1}. ${n.emoji} ${n.name}`).join('\n') || 'Aucun') +
        '\n\nQue voulez-vous faire?';
    
    await sendOrEditMessage(chatId, text, getSocialManageKeyboard());
}

async function handleSocialRemove(chatId) {
    if (!config.socialNetworks || config.socialNetworks.length === 0) {
        await sendOrEditMessage(chatId, '❌ Aucun réseau social à supprimer.', { inline_keyboard: [] });
        setTimeout(() => handleSocialConfig(chatId), 1000);
        return;
    }
    
    const keyboard = config.socialNetworks.map((network, index) => [{
        text: `❌ ${network.emoji} ${network.name}`,
        callback_data: `remove_social_${index}`
    }]);
    
    keyboard.push([{ text: '🔙 Retour', callback_data: 'admin_social' }]);
    
    await sendOrEditMessage(chatId,
        '❌ <b>Supprimer un réseau social</b>\n\nCliquez sur le réseau à supprimer:',
        { inline_keyboard: keyboard }
    );
}

async function handleSocialLayout(chatId) {
    await sendOrEditMessage(chatId,
        '📐 <b>Disposition des boutons</b>\n\n' +
        `Actuellement: ${config.socialButtonsPerRow || 3} boutons par ligne\n\n` +
        'Choisissez le nombre de boutons par ligne:',
        getSocialLayoutKeyboard()
    );
}

async function handleBroadcast(chatId, userId) {
    const totalUsers = await User.countDocuments();
    const consentingUsers = await User.countDocuments({ notificationsEnabled: true, botBlocked: { $ne: true } });
    
    await sendOrEditMessage(chatId,
        '📢 <b>Diffusion de message</b>\n\n' +
        `📊 Statistiques:\n` +
        `• Utilisateurs totaux: ${totalUsers}\n` +
        `• Utilisateurs avec notifications activées: ${consentingUsers}\n` +
        `• Utilisateurs exclus: ${totalUsers - consentingUsers}\n\n` +
        `⚠️ <b>Important:</b> Le message sera envoyé uniquement aux utilisateurs ayant activé les notifications.\n\n` +
        'Choisissez une option:',
        {
            inline_keyboard: [
                [{ text: `📤 Envoyer à ${consentingUsers} utilisateurs`, callback_data: 'broadcast_all' }],
                [{ text: '🔙 Retour', callback_data: 'admin_back' }]
            ]
        }
    );
}

async function handleBroadcastSend(chatId, userId, message) {
    delete userStates[userId];
    
    await sendOrEditMessage(chatId, '📤 Préparation de l\'envoi...\n⏳ Cela peut prendre quelques minutes pour respecter les limites Telegram.', { inline_keyboard: [] });
    
    // Ne récupérer que les utilisateurs ayant consenti aux notifications et n'ayant pas bloqué le bot
    const users = await User.find({ 
        notificationsEnabled: true,
        botBlocked: { $ne: true }
    });
    
    let sent = 0;
    let failed = 0;
    let blocked = 0;
    
    // Configuration pour respecter les limites Telegram
    const BATCH_SIZE = 25; // Nombre de messages par batch
    const BATCH_DELAY = 1100; // Délai entre les batches (1.1 seconde)
    const ERROR_RETRY_DELAY = 5000; // Délai après une erreur 429 (5 secondes)
    
    // Message avec footer de désinscription
    const messageWithFooter = `${message}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `<i>Pour désactiver les notifications, envoyez /notifications</i>`;
    
    // Diviser les utilisateurs en batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const batchPromises = [];
        
        for (const user of batch) {
            const sendPromise = bot.sendMessage(user.userId, messageWithFooter, { parse_mode: 'HTML' })
                .then(() => {
                    sent++;
                })
                .catch(async (error) => {
                    // Gestion spécifique des erreurs Telegram
                    if (error.response && error.response.statusCode === 429) {
                        // Too Many Requests - attendre avant de réessayer
                        console.log('⚠️ Rate limit atteint, pause de 5 secondes...');
                        await new Promise(resolve => setTimeout(resolve, ERROR_RETRY_DELAY));
                        
                        // Réessayer une fois après le délai
                        try {
                            await bot.sendMessage(user.userId, messageWithFooter, { parse_mode: 'HTML' });
                            sent++;
                        } catch (retryError) {
                            failed++;
                            console.error(`Échec définitif pour l'utilisateur ${user.userId}:`, retryError.message);
                        }
                    } else if (error.response && error.response.statusCode === 403) {
                        // L'utilisateur a bloqué le bot
                        blocked++;
                        // Marquer l'utilisateur comme bloqué dans la DB
                        await User.findOneAndUpdate(
                            { userId: user.userId },
                            { botBlocked: true, botBlockedAt: new Date() }
                        ).catch(() => {});
                    } else {
                        failed++;
                        console.error(`Erreur envoi à ${user.userId}:`, error.message);
                    }
                });
            
            batchPromises.push(sendPromise);
        }
        
        // Attendre que tous les messages du batch soient traités
        await Promise.all(batchPromises);
        
        // Mettre à jour le statut après chaque batch
        const progress = Math.round(((i + batch.length) / users.length) * 100);
        await sendOrEditMessage(chatId,
            `📤 <b>Envoi en cours...</b>\n\n` +
            `📊 Progression: ${progress}%\n` +
            `✅ Envoyés: ${sent}\n` +
            `❌ Échecs: ${failed}\n` +
            `🚫 Bloqués: ${blocked}\n\n` +
            `⏳ Veuillez patienter...`,
            { inline_keyboard: [] }
        );
        
        // Attendre avant le prochain batch (sauf pour le dernier)
        if (i + BATCH_SIZE < users.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
    }
    
    // Message final avec statistiques complètes
    let statusEmoji = '✅';
    let statusText = 'Diffusion terminée avec succès!';
    
    if (failed > users.length * 0.3) {
        statusEmoji = '⚠️';
        statusText = 'Diffusion terminée avec des erreurs';
    } else if (failed > 0) {
        statusEmoji = '✅';
        statusText = 'Diffusion terminée';
    }
    
    await sendOrEditMessage(chatId,
        `${statusEmoji} <b>${statusText}</b>\n\n` +
        `📊 <b>Statistiques détaillées:</b>\n` +
        `• Messages envoyés: ${sent}\n` +
        `• Échecs techniques: ${failed}\n` +
        `• Utilisateurs ayant bloqué le bot: ${blocked}\n` +
        `• Total traité: ${users.length}\n\n` +
        `💡 <i>Les messages ont été envoyés uniquement aux utilisateurs ayant activé les notifications.</i>`,
        { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_back' }]] }
    );
}

async function handleAdminManagement(chatId, userId) {
    const admins = await User.find({ isAdmin: true });
    
    const adminList = admins.map(admin => 
        `• ${admin.userId === ADMIN_ID ? '👑' : '👤'} ${admin.firstName || admin.username || admin.userId}`
    ).join('\n');
    
    const keyboard = [];
    
    if (userId === ADMIN_ID) {
        keyboard.push([{ text: '➕ Ajouter un admin', callback_data: 'admin_add' }]);
        if (admins.length > 1) {
            keyboard.push([{ text: '❌ Retirer un admin', callback_data: 'admin_remove' }]);
        }
    }
    
    keyboard.push([{ text: '🔙 Retour', callback_data: 'admin_back' }]);
    
    await sendOrEditMessage(chatId,
        `👥 <b>Gestion des administrateurs</b>\n\n` +
        `Administrateurs actuels:\n${adminList}\n\n` +
        `${userId === ADMIN_ID ? 'Vous êtes le super-admin 👑' : ''}`,
        { inline_keyboard: keyboard }
    );
}

async function handleAdminRemove(chatId) {
    const admins = await User.find({ isAdmin: true, userId: { $ne: ADMIN_ID } });
    
    if (admins.length === 0) {
        await sendOrEditMessage(chatId, '❌ Aucun admin à retirer.', { inline_keyboard: [] });
        setTimeout(() => handleAdminManagement(chatId, ADMIN_ID), 1000);
        return;
    }
    
    const keyboard = admins.map(admin => [{
        text: `❌ ${admin.firstName || admin.username || admin.userId}`,
        callback_data: `remove_admin_${admin.userId}`
    }]);
    
    keyboard.push([{ text: '🔙 Retour', callback_data: 'admin_admins' }]);
    
    await sendOrEditMessage(chatId,
        '❌ <b>Retirer un administrateur</b>\n\nCliquez sur l\'admin à retirer:',
        { inline_keyboard: keyboard }
    );
}

async function handleStats(chatId) {
    const totalUsers = await User.countDocuments();
    const activeToday = await User.countDocuments({
        lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    
    const uptime = Math.floor((Date.now() - botStartTime) / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await sendOrEditMessage(chatId,
        `📊 <b>Statistiques détaillées</b>\n\n` +
        `👥 <b>Utilisateurs:</b>\n` +
        `• Total: ${totalUsers}\n` +
        `• Actifs aujourd'hui: ${activeToday}\n` +
        `• Administrateurs: ${totalAdmins}\n\n` +
        `⏱️ <b>Uptime:</b>\n` +
        `${days}j ${hours}h ${minutes}min\n\n` +
        `🤖 <b>Version:</b> 1.0.0`,
        {
            inline_keyboard: [[
                { text: '🔙 Retour', callback_data: 'admin_back' }
            ]]
        }
    );
}

// Créer et démarrer le bot
async function createBot() {
    try {
        // Créer le bot en mode webhook
        bot = new TelegramBot(process.env.BOT_TOKEN, { 
            webHook: {
                port: PORT,
                autoOpen: false
            }
        });
        
        // Supprimer l'ancien webhook s'il existe
        await bot.deleteWebHook();
        console.log('✅ Ancien webhook supprimé');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Configurer le nouveau webhook
        const webhookUrl = `${WEBHOOK_URL}${WEBHOOK_PATH}`;
        await bot.setWebHook(webhookUrl, {
            max_connections: 100,
            allowed_updates: ['message', 'callback_query', 'inline_query']
        });
        console.log(`✅ Webhook configuré: ${webhookUrl}`);
        
        // Vérifier le webhook
        const info = await bot.getWebHookInfo();
        console.log('📊 Info webhook:', {
            url: info.url,
            pending: info.pending_update_count,
            last_error: info.last_error_message
        });
        
        // Configurer tous les handlers
        setupBotHandlers();
        
        // Démarrer le keep-alive
        startKeepAlive();
        
        // Réinitialiser le compteur de retry
        retryCount = 0;
        
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du bot:', error.message);
        
        if (error.message.includes('409') && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ Nouvelle tentative dans 5 secondes... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return createBot();
        } else {
            console.error('❌ Impossible de démarrer le bot après', maxRetries, 'tentatives');
            process.exit(1);
        }
    }
}

// Connexion MongoDB et initialisation
async function initializeBot() {
    try {
        console.log('🚀 Initialisation du bot...');
        
        // Charger la configuration
        config = await loadConfig();
        console.log('✅ Configuration chargée');
        
        // S'assurer que l'admin principal est dans la DB
        await User.findOneAndUpdate(
            { userId: ADMIN_ID },
            { userId: ADMIN_ID, isAdmin: true },
            { upsert: true }
        );
        
        // Créer et démarrer le bot
        await createBot();
        
        console.log('✅ Bot prêt!');
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du bot...');
    try {
        if (bot) {
            await bot.stopPolling();
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du bot...');
    try {
        if (bot) {
            await bot.stopPolling();
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error('Erreur lors de l\'arrêt:', error);
    }
    process.exit(0);
});

// Démarrer le serveur Express et initialiser le bot
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Serveur Express démarré sur le port ${PORT}`);
    console.log(`📍 URL webhook: ${WEBHOOK_URL}${WEBHOOK_PATH}`);
    
    // Démarrer l'initialisation du bot
    initializeBot();
});