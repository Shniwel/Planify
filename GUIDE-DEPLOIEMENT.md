# 🚀 Guide de déploiement — Planify sur Vercel avec Gmail SMTP

## Structure du projet à créer

```
planify/
├── api/
│   └── send-email.js       ← Fonction serverless Vercel (envoi email)
├── public/
│   └── index.html
├── src/
│   ├── App.jsx             ← Votre application React (fichier App.jsx fourni)
│   └── index.js
├── .env.local              ← Variables secrètes (NE PAS commiter)
├── .gitignore
├── package.json
└── vercel.json
```

---

## ÉTAPE 1 — Préparer votre compte Gmail

> ⚠️ Vous ne pouvez PAS utiliser votre mot de passe Gmail normal.
> Google exige un "Mot de passe d'application" pour les apps tierces.

1. Allez sur : https://myaccount.google.com/security
2. Activez la **Validation en 2 étapes** (si pas déjà fait)
3. Allez sur : https://myaccount.google.com/apppasswords
4. Choisissez **"Autre (nom personnalisé)"** → tapez "Planify"
5. Cliquez **Générer**
6. **Copiez le mot de passe de 16 caractères** (ex: `abcd efgh ijkl mnop`)
   → Gardez-le précieusement, il ne s'affiche qu'une fois !

---

## ÉTAPE 2 — Créer le projet en local

```bash
# 1. Installer Node.js si pas déjà fait
# https://nodejs.org (version LTS recommandée)

# 2. Créer l'app React
npx create-react-app planify
cd planify

# 3. Installer les dépendances
npm install nodemailer
npm install -D vercel

# 4. Remplacer src/App.js par le fichier App.jsx fourni
# (renommez-le en App.js ou adaptez l'import dans index.js)
```

---

## ÉTAPE 3 — Créer les fichiers

### `api/send-email.js`
Copiez le fichier `send-email.js` fourni dans un dossier `api/` à la racine.

### `vercel.json` (racine du projet)
```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build",
      "config": { "distDir": "build" } }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### `.env.local` (racine du projet — ne pas commiter !)
```
GMAIL_USER=votre-email@gmail.com
GMAIL_PASS=abcd efgh ijkl mnop
```

### `.gitignore` — ajoutez ces lignes
```
.env.local
.env
node_modules/
```

---

## ÉTAPE 4 — Tester en local

```bash
# Installer Vercel CLI
npm install -g vercel

# Lancer en mode développement (lit automatiquement .env.local)
vercel dev
```

→ Ouvrez http://localhost:3000
→ Ajoutez un créneau → vérifiez que l'email arrive dans la boîte du destinataire

---

## ÉTAPE 5 — Déployer sur Vercel

### Option A : Via GitHub (recommandé)

```bash
# 1. Créer un repo GitHub
git init
git add .
git commit -m "Initial commit — Planify"
git remote add origin https://github.com/VOTRE-USERNAME/planify.git
git push -u origin main

# 2. Sur https://vercel.com
#    → "New Project" → Importer votre repo GitHub
#    → Framework: Create React App
#    → Cliquez "Deploy"
```

### Option B : Via CLI directement

```bash
vercel --prod
```

---

## ÉTAPE 6 — Ajouter les variables d'environnement sur Vercel

> ⚠️ OBLIGATOIRE — sans ça, les emails ne partiront pas !

1. Allez sur https://vercel.com → votre projet → **Settings**
2. Cliquez **Environment Variables**
3. Ajoutez :

| Nom          | Valeur                        | Environnement |
|--------------|-------------------------------|---------------|
| GMAIL_USER   | votre-email@gmail.com         | Production    |
| GMAIL_PASS   | abcd efgh ijkl mnop           | Production    |

4. Cliquez **Save**
5. **Redéployez** : onglet Deployments → "Redeploy"

---

## ÉTAPE 7 — Vérification finale

1. Ouvrez votre URL Vercel (ex: `https://planify-xxx.vercel.app`)
2. Connectez-vous : `admin@planify.fr` / `admin123`
3. Ajoutez un créneau à un employé avec une vraie adresse email
4. ✅ L'email doit arriver dans la boîte dans les 10-30 secondes

---

## 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| "Invalid login" | Vérifiez GMAIL_PASS, utilisez un mot de passe d'application |
| "Less secure apps" | N'activez PAS ça — utilisez les mots de passe d'application |
| Email dans les spams | Ajoutez un domaine SPF ou utilisez Resend.com |
| API 500 error | Vérifiez les variables d'environnement sur Vercel |
| Variables non lues | Redéployez après avoir ajouté les variables |

---

## 📦 Fichiers fournis

- `send-email.js` → à placer dans `api/send-email.js`
- `App.jsx` → à placer dans `src/App.jsx` (ou App.js)
- Ce guide PDF

**URL de votre app après déploiement :** `https://planify-[hash].vercel.app`
