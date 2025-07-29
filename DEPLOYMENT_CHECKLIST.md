# ✅ CHECKLIST DE DÉPLOIEMENT - BOUTIQUE LMVRT2

## 📋 Avant le déploiement

- [ ] **Fichier .env.local créé** avec toutes les variables
- [ ] **README_INDEPENDENT.md lu** pour comprendre la configuration
- [ ] **Compte GitHub prêt** pour héberger le code
- [ ] **Compte Vercel prêt** pour le déploiement

## 🚀 Étapes de déploiement

### 1. Préparer GitHub
```bash
cd LMVRT2_INDEPENDENT
git init
git add .
git commit -m "Initial commit - Boutique LMVRT2"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git push -u origin main
```

### 2. Configurer Cloudinary
- [ ] Se connecter à Cloudinary
- [ ] Créer l'upload preset `boutique_ilage`
- [ ] Mode : Unsigned
- [ ] Dossier : `boutique`

### 3. Déployer sur Vercel
- [ ] Importer le repository GitHub
- [ ] Ajouter TOUTES les variables d'environnement :
  ```
  MONGODB_URI
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  ADMIN_USERNAME
  ADMIN_PASSWORD
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  ```
- [ ] Cliquer sur Deploy

## 🔒 Après le déploiement

- [ ] **Changer le mot de passe admin** immédiatement
- [ ] **Mettre à jour NEXTAUTH_URL** avec l'URL Vercel réelle
- [ ] **Tester la connexion admin** sur `/admin`
- [ ] **Ajouter un produit test** pour vérifier Cloudinary

## ⚠️ En cas de problème

1. **Erreur 500** : Vérifier les variables d'environnement dans Vercel
2. **Images ne s'upload pas** : Vérifier l'upload preset Cloudinary
3. **Connexion MongoDB échoue** : Vérifier l'URI et les credentials
4. **Page admin inaccessible** : Vérifier ADMIN_USERNAME et ADMIN_PASSWORD

## 📱 URLs importantes

- **Boutique** : `https://votre-projet.vercel.app`
- **Admin** : `https://votre-projet.vercel.app/admin`
- **API Health** : `https://votre-projet.vercel.app/api/health`

---

✨ Une fois toutes les cases cochées, votre boutique est prête !