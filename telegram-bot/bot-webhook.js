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
    
    // Connexion à MongoDB
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Bot connecté à MongoDB');
            loadUsersFromMongoDB();
        })
        .catch(err => {
            console.error('⚠️ Erreur MongoDB, utilisation des fichiers JSON:', err.message);
            loadUsersFromFiles();
        });
} catch (error) {
    console.log('⚠️ MongoDB non installé, utilisation des fichiers JSON');
}

// État des utilisateurs et configuration
const userStates = {};
const activeMessages = {};
let config = loadConfig();

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

// Fonction pour envoyer le message d'accueil
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

    // Répondre au callback pour éviter le spinner
    await bot.answerCallbackQuery(callbackQuery.id);

    // Vérifier si l'utilisateur est enregistré
    if (!users.has(userId)) {
        users.add(userId);
        saveUsers();
        await saveUserToMongoDB(userId, {
            username: callbackQuery.from.username,
            firstName: callbackQuery.from.first_name,
            lastName: callbackQuery.from.last_name
        });
    }

    // Gestion des différentes actions
    switch(data) {
        case 'back_to_main':
            delete userStates[chatId];
            await sendWelcomeMessage(chatId, messageId, callbackQuery.from);
            break;

        case 'admin_menu':
            if (!admins.has(userId)) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: '❌ Accès refusé',
                    show_alert: true
                });
                return;
            }
            await updateMessage(chatId, messageId, '🔧 Menu Administrateur', {
                reply_markup: getAdminKeyboard()
            });
            break;

        case 'edit_welcome':
            if (!admins.has(userId)) return;
            userStates[chatId] = { action: 'editing_welcome' };
            await updateMessage(chatId, messageId, 
                '✏️ Envoyez le nouveau message d\'accueil.\n\n' +
                '💡 Vous pouvez utiliser ces variables :\n' +
                '• {firstname} - Prénom de l\'utilisateur\n' +
                '• {lastname} - Nom de famille\n' +
                '• {username} - @username\n' +
                '• {fullname} - Nom complet\n\n' +
                'Vous pouvez aussi utiliser du HTML pour formater le texte.',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
            );
            break;

        case 'edit_welcome_image':
            if (!admins.has(userId)) return;
            userStates[chatId] = { action: 'editing_welcome_image' };
            await updateMessage(chatId, messageId, 
                '🖼 Envoyez la nouvelle image d\'accueil.\n\n' +
                '⚠️ L\'image sera affichée avec le message d\'accueil.',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
            );
            break;

        case 'manage_social':
            if (!admins.has(userId)) return;
            await updateMessage(chatId, messageId, '📱 Gestion des réseaux sociaux', {
                reply_markup: getSocialManageKeyboard()
            });
            break;

        case 'add_social':
            if (!admins.has(userId)) return;
            userStates[chatId] = { action: 'adding_social_name' };
            await updateMessage(chatId, messageId, 
                '➕ Ajout d\'un réseau social\n\n' +
                '1️⃣ Envoyez le nom du réseau social (ex: Instagram, Twitter, etc.)',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'manage_social' }]] }}
            );
            break;

        case 'edit_social':
            if (!admins.has(userId)) return;
            if (!config.socialNetworks || config.socialNetworks.length === 0) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Aucun réseau social configuré',
                    show_alert: true
                });
                return;
            }
            
            const editButtons = config.socialNetworks.map((social, index) => [{
                text: `${social.icon || '🔗'} ${social.name}`,
                callback_data: `edit_social_${index}`
            }]);
            editButtons.push([{ text: '🔙 Retour', callback_data: 'manage_social' }]);
            
            await updateMessage(chatId, messageId, '✏️ Sélectionnez le réseau social à modifier :', {
                reply_markup: { inline_keyboard: editButtons }
            });
            break;

        case 'delete_social':
            if (!admins.has(userId)) return;
            if (!config.socialNetworks || config.socialNetworks.length === 0) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Aucun réseau social configuré',
                    show_alert: true
                });
                return;
            }
            
            const deleteButtons = config.socialNetworks.map((social, index) => [{
                text: `🗑 ${social.name}`,
                callback_data: `delete_social_${index}`
            }]);
            deleteButtons.push([{ text: '🔙 Retour', callback_data: 'manage_social' }]);
            
            await updateMessage(chatId, messageId, '🗑 Sélectionnez le réseau social à supprimer :', {
                reply_markup: { inline_keyboard: deleteButtons }
            });
            break;

        case 'social_layout':
            if (!admins.has(userId)) return;
            await updateMessage(chatId, messageId, 
                '📐 Disposition des boutons de réseaux sociaux\n\n' +
                `Disposition actuelle : ${config.socialLayout === 'horizontal' ? 'Horizontal (2 par ligne)' : 'Vertical (1 par ligne)'}`,
                { reply_markup: getSocialLayoutKeyboard(config.socialLayout) }
            );
            break;

        case 'layout_vertical':
            if (!admins.has(userId)) return;
            config.socialLayout = 'vertical';
            saveConfig(config);
            await updateMessage(chatId, messageId, 
                '✅ Disposition changée en vertical (1 bouton par ligne)',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'manage_social' }]] }}
            );
            break;

        case 'layout_horizontal':
            if (!admins.has(userId)) return;
            config.socialLayout = 'horizontal';
            saveConfig(config);
            await updateMessage(chatId, messageId, 
                '✅ Disposition changée en horizontal (2 boutons par ligne)',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'manage_social' }]] }}
            );
            break;

        case 'stats':
            if (!admins.has(userId)) return;
            const stats = `📊 Statistiques du bot\n\n` +
                `👥 Utilisateurs totaux : ${users.size}\n` +
                `👮‍♂️ Administrateurs : ${admins.size}\n` +
                `📱 Réseaux sociaux : ${config.socialNetworks ? config.socialNetworks.length : 0}`;
            
            await updateMessage(chatId, messageId, stats, {
                reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }
            });
            break;

        case 'broadcast':
            if (!admins.has(userId)) return;
            userStates[chatId] = { action: 'broadcasting' };
            await updateMessage(chatId, messageId, 
                '📢 Envoyez le message à diffuser à tous les utilisateurs.\n\n' +
                '⚠️ Ce message sera envoyé à tous les utilisateurs du bot.',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'admin_menu' }]] }}
            );
            break;

        case 'manage_admins':
            if (userId !== ADMIN_ID) {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: '❌ Seul l\'administrateur principal peut gérer les admins',
                    show_alert: true
                });
                return;
            }
            
            const adminList = Array.from(admins).map(id => `• ${id}`).join('\n');
            await updateMessage(chatId, messageId, 
                `👮‍♂️ Gestion des administrateurs\n\n` +
                `Admins actuels :\n${adminList}\n\n` +
                `Pour ajouter : /addadmin [ID]\n` +
                `Pour retirer : /removeadmin [ID]`,
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
            );
            break;

        default:
            // Gestion des callbacks dynamiques
            if (data.startsWith('social_')) {
                const socialIndex = parseInt(data.replace('social_', ''));
                if (config.socialNetworks && config.socialNetworks[socialIndex]) {
                    const social = config.socialNetworks[socialIndex];
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: `Ouverture de ${social.name}...`,
                        url: social.url
                    });
                }
            } else if (data.startsWith('edit_social_')) {
                if (!admins.has(userId)) return;
                const index = parseInt(data.replace('edit_social_', ''));
                userStates[chatId] = { 
                    action: 'editing_social', 
                    socialIndex: index 
                };
                const social = config.socialNetworks[index];
                await updateMessage(chatId, messageId, 
                    `✏️ Modification de ${social.name}\n\n` +
                    `URL actuelle : ${social.url}\n` +
                    `Icône actuelle : ${social.icon || '🔗'}\n\n` +
                    `Envoyez la nouvelle URL :`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'edit_social' }]] }}
                );
            } else if (data.startsWith('delete_social_')) {
                if (!admins.has(userId)) return;
                const index = parseInt(data.replace('delete_social_', ''));
                const social = config.socialNetworks[index];
                userStates[chatId] = { 
                    action: 'confirming_delete_social', 
                    socialIndex: index 
                };
                await updateMessage(chatId, messageId, 
                    `⚠️ Êtes-vous sûr de vouloir supprimer ${social.name} ?`,
                    { reply_markup: getConfirmKeyboard() }
                );
            } else if (data === 'confirm_yes' && userStates[chatId]?.action === 'confirming_delete_social') {
                if (!admins.has(userId)) return;
                const index = userStates[chatId].socialIndex;
                const socialName = config.socialNetworks[index].name;
                config.socialNetworks.splice(index, 1);
                saveConfig(config);
                delete userStates[chatId];
                await updateMessage(chatId, messageId, 
                    `✅ ${socialName} a été supprimé avec succès.`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'manage_social' }]] }}
                );
            } else if (data === 'confirm_no' && userStates[chatId]?.action === 'confirming_delete_social') {
                delete userStates[chatId];
                await updateMessage(chatId, messageId, 
                    '❌ Suppression annulée.',
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'delete_social' }]] }}
                );
            }
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

    // Gestion selon l'état de l'utilisateur
    switch(state.action) {
        case 'editing_welcome':
            if (!admins.has(userId)) return;
            if (msg.text) {
                config.welcomeMessage = msg.text;
                saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    '✅ Message d\'accueil mis à jour avec succès !',
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
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Annuler', callback_data: 'manage_social' }]] }}
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
                saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    `✅ ${state.socialName} a été ajouté avec succès !`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'manage_social' }]] }}
                );
            }
            break;

        case 'editing_social':
            if (!admins.has(userId)) return;
            if (msg.text) {
                config.socialNetworks[state.socialIndex].url = msg.text;
                saveConfig(config);
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
                saveConfig(config);
                delete userStates[chatId];
                await sendNewMessage(chatId, 
                    `✅ ${config.socialNetworks[state.socialIndex].name} a été mis à jour avec succès !`,
                    { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'manage_social' }]] }}
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

    if (state.action === 'editing_welcome_image') {
        if (!admins.has(userId)) return;
        
        const photo = msg.photo[msg.photo.length - 1];
        const fileId = photo.file_id;
        
        try {
            const file = await bot.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
            
            const response = await fetch(fileUrl);
            const buffer = await response.buffer();
            
            const imageName = `welcome_${Date.now()}.jpg`;
            const imagePath = path.join(IMAGES_DIR, imageName);
            
            fs.ensureDirSync(IMAGES_DIR);
            fs.writeFileSync(imagePath, buffer);
            
            config.welcomeImage = imageName;
            saveConfig(config);
            
            delete userStates[chatId];
            await sendNewMessage(chatId, 
                '✅ Image d\'accueil mise à jour avec succès !',
                { reply_markup: { inline_keyboard: [[{ text: '🔙 Retour', callback_data: 'admin_menu' }]] }}
            );
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'image:', error);
            await sendNewMessage(chatId, 
                '❌ Erreur lors de la sauvegarde de l\'image. Veuillez réessayer.',
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