# Configuration des Variables d'Environnement pour Vercel

## 📋 Variables à configurer dans Vercel

### 1. Variables MongoDB
```
MONGODB_URI = mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/?retryWrites=true&w=majority&appName=Pariscoffee
```

### 2. Variables Cloudinary
```
CLOUDINARY_URL = cloudinary://293224922946996:yb9nRJW_k7toUQFbQg28T_gM9eQ@dvglphdty
CLOUDINARY_CLOUD_NAME = dvglphdty
CLOUDINARY_API_KEY = 293224922946996
CLOUDINARY_API_SECRET = yb9nRJW_k7toUQFbQg28T_gM9eQ
CLOUDINARY_UPLOAD_PRESET = leloup_preset
```

## 🚀 Comment configurer sur Vercel

1. **Connectez-vous à Vercel** : https://vercel.com

2. **Accédez aux paramètres du projet** :
   - Cliquez sur votre projet
   - Allez dans "Settings" (Paramètres)
   - Cliquez sur "Environment Variables"

3. **Ajoutez chaque variable** :
   - Cliquez sur "Add New"
   - Entrez le nom de la variable (ex: `MONGODB_URI`)
   - Collez la valeur correspondante
   - Sélectionnez les environnements (Production, Preview, Development)
   - Cliquez sur "Save"

4. **Répétez pour toutes les variables**

## 🔧 Configuration de l'Upload Preset Cloudinary

### Étapes pour créer un Upload Preset :

1. **Connectez-vous à Cloudinary** : https://cloudinary.com/console

2. **Accédez aux Settings** :
   - Cliquez sur "Settings" (icône engrenage)
   - Allez dans "Upload" → "Upload presets"

3. **Créez un nouveau preset** :
   - Cliquez sur "Add upload preset"
   - Nom du preset : `leloup_preset` (votre preset existant)
   - Signing Mode : **Unsigned** (pour les uploads côté client)
   
4. **Configuration recommandée** :
   - **Folder** : `uploads/` (ou votre structure préférée)
   - **Allowed formats** : jpg, png, gif, webp
   - **Max file size** : 10MB (ajustez selon vos besoins)
   - **Transformations** : 
     - Quality : auto
     - Format : auto
   - **Tags** : ajoutez des tags si nécessaire

5. **Sauvegardez** le preset

## 🔒 Sécurité

⚠️ **IMPORTANT** : 
- Ne partagez JAMAIS vos clés API publiquement
- Utilisez toujours les variables d'environnement
- Ne committez jamais le fichier `.env.local` sur Git
- Pour la production, utilisez uniquement l'interface Vercel pour gérer les variables

## 📝 Utilisation dans votre code

### Pour MongoDB (exemple avec Mongoose) :
```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);
```

### Pour Cloudinary :
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Pour l'upload côté client
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
```

## 🧪 Test de connexion

Après configuration, redéployez votre application sur Vercel pour que les nouvelles variables soient prises en compte.