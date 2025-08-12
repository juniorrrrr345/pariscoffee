# 🔒 GUIDE DE SÉCURITÉ - VOTRE BOUTIQUE PROTÉGÉE

## 📋 Table des matières
1. [Configuration initiale](#configuration-initiale)
2. [Protections activées](#protections-activées)
3. [Comment utiliser les protections](#comment-utiliser)
4. [Checklist de déploiement](#checklist-déploiement)
5. [Maintenance et monitoring](#maintenance)

---

## 🚀 Configuration initiale <a id="configuration-initiale"></a>

### 1. Variables d'environnement (.env.local)

**⚠️ IMPORTANT : Ne JAMAIS commit le fichier .env.local sur Git !**

```bash
# Changez TOUTES ces valeurs avant la production !
ADMIN_PASSWORD=VotreMotDePasseSuper$ecure123!
ADMIN_TOKEN=token_aleatoire_minimum_32_caracteres_xyz789abc
JWT_SECRET=secret_jwt_tres_long_et_complexe_minimum_32_chars
ENCRYPTION_KEY=cle_de_chiffrement_32_caracteres_minimum_abc123
```

### 2. Ajouter les variables sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Ajoutez TOUTES les variables du fichier .env.local
5. Redéployez votre site

---

## 🛡️ Protections activées <a id="protections-activées"></a>

### ✅ Protections ACTIVES par défaut :

1. **Protection /admin** : Authentification requise
2. **Headers de sécurité** : Anti-XSS, Anti-clickjacking
3. **Rate limiting** : 100 requêtes/15min par IP
4. **Validation des données** : Avec Zod
5. **Chiffrement** : Mots de passe hashés avec bcrypt

### 🔐 Protections OPTIONNELLES :

Pour protéger TOUT le site (pas seulement /admin) :
```env
SITE_PROTECTION_ENABLED=true
SITE_USERNAME=votre_username
SITE_PASSWORD=votre_password_fort
```

---

## 💻 Comment utiliser les protections <a id="comment-utiliser"></a>

### 1. Accéder à /admin

Quand vous allez sur `votresite.com/admin`, une fenêtre de connexion apparaît :
- **Username** : La valeur de `SITE_USERNAME` 
- **Password** : La valeur de `ADMIN_PASSWORD`

### 2. Utiliser la validation dans vos API

```typescript
// Dans vos routes API
import { productSchema, validateAndSanitize } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Valider les données
  const { success, data, errors } = validateAndSanitize(productSchema, body);
  
  if (!success) {
    return Response.json({ errors }, { status: 400 });
  }
  
  // Utiliser 'data' qui est maintenant validé et sûr
  // ...
}
```

### 3. Hacher les mots de passe

```typescript
import { hashPassword, verifyPassword } from '@/lib/security';

// Pour enregistrer un utilisateur
const hashedPassword = await hashPassword(userPassword);
// Sauvegarder hashedPassword dans la base de données

// Pour vérifier lors de la connexion
const isValid = await verifyPassword(inputPassword, hashedPassword);
```

### 4. Utiliser les tokens JWT

```typescript
import { createToken, verifyToken } from '@/lib/security';

// Créer un token après connexion
const token = createToken({
  userId: user.id,
  email: user.email,
  role: 'admin'
});

// Vérifier un token
const payload = verifyToken(token);
if (payload) {
  // Token valide, utilisateur authentifié
}
```

### 5. Chiffrer des données sensibles

```typescript
import { encrypt, decrypt } from '@/lib/security';

// Chiffrer
const encrypted = encrypt('données sensibles');
// Sauvegarder encrypted.encrypted, encrypted.iv, encrypted.authTag

// Déchiffrer
const decrypted = decrypt({
  encrypted: savedEncrypted,
  iv: savedIv,
  authTag: savedAuthTag
});
```

---

## ✅ Checklist de déploiement <a id="checklist-déploiement"></a>

Avant de mettre en production :

- [ ] **Changer TOUS les mots de passe par défaut dans .env.local**
- [ ] **Ajouter toutes les variables d'environnement sur Vercel**
- [ ] **Vérifier que .env.local est dans .gitignore**
- [ ] **Tester la protection /admin**
- [ ] **Activer SITE_PROTECTION_ENABLED si site en développement**
- [ ] **Configurer un domaine personnalisé avec HTTPS**
- [ ] **Activer les logs de sécurité**
- [ ] **Tester le rate limiting**
- [ ] **Vérifier les headers de sécurité** sur [SecurityHeaders.com](https://securityheaders.com)

---

## 🔧 Maintenance et monitoring <a id="maintenance"></a>

### Logs de sécurité

Les événements de sécurité sont loggés automatiquement :
- Tentatives de connexion échouées
- Rate limiting déclenché
- Activités suspectes

### Mise à jour des dépendances

```bash
# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement
npm audit fix

# Mettre à jour les packages de sécurité
npm update bcryptjs jsonwebtoken zod
```

### Test de sécurité

1. **Tester la protection admin** :
   ```bash
   curl -I https://votresite.com/admin
   # Doit retourner 401 Unauthorized
   ```

2. **Tester le rate limiting** :
   ```bash
   for i in {1..150}; do curl https://votresite.com/api/test; done
   # Après 100 requêtes : 429 Too Many Requests
   ```

3. **Vérifier les headers** :
   ```bash
   curl -I https://votresite.com
   # Doit montrer X-Frame-Options, X-Content-Type-Options, etc.
   ```

---

## 🚨 En cas de problème

### Le site est bloqué ?

1. Mettez `SITE_PROTECTION_ENABLED=false` sur Vercel
2. Redéployez

### Mot de passe admin oublié ?

1. Changez `ADMIN_PASSWORD` sur Vercel
2. Redéployez

### Trop de rate limiting ?

Augmentez dans .env.local :
```env
RATE_LIMIT_MAX_REQUESTS=500
RATE_LIMIT_WINDOW_MS=900000
```

---

## 📞 Support

Pour toute question de sécurité :
1. **NE JAMAIS** partager vos variables d'environnement
2. **NE JAMAIS** commit des secrets sur Git
3. Utilisez des mots de passe forts (16+ caractères)
4. Activez l'authentification à deux facteurs sur Vercel

---

## 🎯 Résumé rapide

**Votre site est maintenant protégé avec :**
- ✅ Protection /admin par mot de passe
- ✅ Headers de sécurité anti-attaques
- ✅ Rate limiting anti-spam
- ✅ Validation des données
- ✅ Chiffrement des mots de passe
- ✅ Protection CSRF
- ✅ Anonymisation des logs

**Pour activer :** Changez les mots de passe dans .env.local et déployez !

---

*Dernière mise à jour : Configuration de sécurité complète avec middleware, validation Zod, et fonctions de sécurité.*