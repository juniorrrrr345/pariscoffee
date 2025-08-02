require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const { loadConfig, saveConfig, getImagePath, IMAGES_DIR } = require('./config');
const { getMainKeyboard, getAdminKeyboard, getSocialManageKeyboard, getSocialLayoutKeyboard, getConfirmKeyboard } = require('./keyboards');

// Vérifier les variables d'environnement
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN n\'est pas défini dans le fichier .env');
    process.exit(1);
}

if (!process.env.ADMIN_ID) {
    console.error('❌ ADMIN_ID n\'est pas défini dans le fichier .env');
    process.exit(1);
}

// Initialiser le bot
console.log('🤖 Démarrage du bot...');
console.log(`📡 Bot Token: ${process.env.BOT_TOKEN ? '✅ Configuré' : '❌ Manquant'}`);
console.log(`👤 Admin ID: ${process.env.ADMIN_ID ? '✅ Configuré' : '❌ Manquant'}`);

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = parseInt(process.env.ADMIN_ID);

// État des utilisateurs (pour gérer les conversations)
const userStates = {};
// Stocker l'ID du dernier message pour chaque chat (un seul message actif par chat)
const activeMessages = {};
// Stocker les utilisateurs qui ont interagi avec le bot
const users = new Set();
// Stocker les administrateurs
const admins = new Set([ADMIN_ID]);

// Temps de démarrage du bot
const botStartTime = new Date();

// Charger la configuration au démarrage
let config = loadConfig();

// Charger les utilisateurs sauvegardés
const USERS_FILE = path.join(__dirname, 'users.json');
const ADMINS_FILE = path.join(__dirname, 'admins.json');

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readJsonSync(USERS_FILE);
            data.forEach(userId => users.add(userId));
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
    }
}

function saveUsers() {
    try {
        fs.writeJsonSync(USERS_FILE, Array.from(users));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
    }
}

function loadAdmins() {
    try {
        if (fs.existsSync(ADMINS_FILE)) {
            const data = fs.readJsonSync(ADMINS_FILE);
            data.forEach(adminId => admins.add(adminId));
        }
    } catch (error) {
        console.error('Erreur lors du chargement des admins:', error);
    }
}

function saveAdmins() {
    try {
        fs.writeJsonSync(ADMINS_FILE, Array.from(admins));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des admins:', error);
    }
}

loadUsers();
loadAdmins();

console.log('⚠️  Bot en mode temporaire - MongoDB sera activé prochainement');
console.log('✅ Bot démarré avec succès!');

// Le reste du code du bot original continue ici...