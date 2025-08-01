# 🚀 Configuration Vercel pour Paris Coffee

## ✅ Boutique dupliquée avec succès !

J'ai copié exactement la boutique LAMAINVRTR avec vos configurations personnalisées.

## 📋 Variables d'environnement à ajouter dans Vercel

Copiez-collez ces variables **EXACTEMENT** comme ci-dessous :

```
MONGODB_URI
mongodb+srv://coffeelivraison4:FCiljtFGv5iKaKL3@pariscoffee.x0f0tsy.mongodb.net/?retryWrites=true&w=majority&appName=Pariscoffee

CLOUDINARY_URL
cloudinary://293224922946996:yb9nRJW_k7toUQFbQg28T_gM9eQ@dvglphdty

CLOUDINARY_CLOUD_NAME
dvglphdty

CLOUDINARY_API_KEY
293224922946996

CLOUDINARY_API_SECRET
yb9nRJW_k7toUQFbQg28T_gM9eQ

CLOUDINARY_UPLOAD_PRESET
leloup_preset

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
dvglphdty

NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
leloup_preset

ADMIN_PASSWORD
VotreMotDePasseSecurise123
```

⚠️ **IMPORTANT** : Changez `VotreMotDePasseSecurise123` par votre propre mot de passe sécurisé !

## 🔧 Configuration Vercel

1. **Framework Preset** : Next.js (devrait être détecté automatiquement)
2. **Build Command** : Laissez vide (utilise `npm run build`)
3. **Output Directory** : Laissez vide (utilise `.next`)
4. **Install Command** : Laissez vide (utilise `npm install`)
5. **Root Directory** : Laissez vide

## 📝 Étapes de déploiement

1. Allez sur https://vercel.com/dashboard
2. Si le projet existe déjà, il devrait se redéployer automatiquement
3. Sinon, créez un nouveau projet et importez `juniorrrrr345/pariscoffee`
4. Ajoutez TOUTES les variables d'environnement ci-dessus
5. Déployez !

## 🔐 Accès Admin

Une fois déployé, accédez au panel admin :
- URL : https://votre-domaine.vercel.app/admin
- Mot de passe : Celui que vous avez défini dans `ADMIN_PASSWORD`

Si vous n'avez pas ajouté `ADMIN_PASSWORD` dans Vercel, le mot de passe par défaut sera : `admin123`

## ✨ Fonctionnalités de votre boutique

- ✅ Design moderne avec animations
- ✅ Panier d'achat fonctionnel
- ✅ Upload d'images via Cloudinary
- ✅ Base de données MongoDB
- ✅ Responsive mobile/desktop
- ✅ SEO optimisé

## 🎯 URL de votre boutique

Une fois déployé, votre boutique sera accessible à :
- https://pariscoffee.vercel.app (ou votre domaine personnalisé)

C'est tout ! La boutique LAMAINVRTR est maintenant votre boutique Paris Coffee avec vos propres configurations.