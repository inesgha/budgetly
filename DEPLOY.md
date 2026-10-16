# Mettre Budgetly en ligne (Vercel + Neon)

Ce guide explique, pas à pas, comment publier Budgetly **gratuitement**, entièrement depuis Vercel :

| Partie | Où | Comment |
| --- | --- | --- |
| Site (`budgetly-web`) | Vercel, projet n°1 | Site statique Vite |
| API (`Budgetly.Api`) | Vercel, projet n°2 | Conteneur Docker (`Dockerfile.vercel`) |
| Base de données | Neon, via le Marketplace Vercel | PostgreSQL serverless, offre gratuite |

```
Navigateur ──► Vercel : site React ──► Vercel : API .NET 10 (conteneur Docker) ──► Neon : PostgreSQL
```

> Les écrans de Vercel et de Neon évoluent : si un libellé diffère un peu de ce guide, cherchez l'option la plus proche, le principe reste le même.
> Les conteneurs Docker sur Vercel sont encore une fonctionnalité **bêta**. Si Vercel refuse de déployer l'API sur le plan gratuit, suivez le **[plan B (Render)](#9-plan-b--lapi-sur-render)** : seule l'API change d'hébergeur.

---

## Sommaire

0. [Avant de commencer](#0-avant-de-commencer)
1. [Se connecter à Vercel avec GitHub](#1-se-connecter-à-vercel-avec-github)
2. [Créer le projet de l'API](#2-créer-le-projet-de-lapi)
3. [Ajouter la base PostgreSQL (Neon)](#3-ajouter-la-base-postgresql-neon)
4. [Créer les tables et le compte démo depuis votre PC](#4-créer-les-tables-et-le-compte-démo-depuis-votre-pc)
5. [Configurer les variables de l'API et redéployer](#5-configurer-les-variables-de-lapi-et-redéployer)
6. [Créer le projet du site](#6-créer-le-projet-du-site)
7. [Autoriser l'adresse du site dans l'API (CORS)](#7-autoriser-ladresse-du-site-dans-lapi-cors)
8. [Problèmes fréquents](#8-problèmes-fréquents)
9. [Plan B : l'API sur Render](#9-plan-b--lapi-sur-render)
10. [Mettre à jour plus tard](#10-mettre-à-jour-plus-tard)

Au fil du guide, notez ces valeurs dans un **gestionnaire de mots de passe** (jamais dans un fichier du projet) :

| À noter | Exemple | Étape |
| --- | --- | --- |
| Adresse de l'API | `https://budgetly-api.vercel.app` | 2 |
| Adresse directe de la base (`DATABASE_URL_UNPOOLED`) | `postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require` | 4 |
| Clé JWT de production | *(générée, 88 caractères)* | 5 |
| Adresse du site | `https://budgetly-ines.vercel.app` | 6 |

---

## 0. Avant de commencer

### Ce qu'il vous faut

- Le projet **poussé sur GitHub**, avec ces fichiers (ils sont déjà dans le dépôt) :
  - `Budgetly.Api/Dockerfile.vercel` et `Budgetly.Api/vercel.json` (pour l'API) ;
  - `budgetly-web/vercel.json` (pour que le rechargement d'une page ne donne pas d'erreur 404).
- Sur votre PC : le **SDK .NET 10** et l'outil EF Core (`dotnet tool install --global dotnet-ef`).

### Ce que le projet fait déjà pour la production

- **Aucun secret dans le code.** L'API lit sa configuration dans des **variables d'environnement**, que vous définirez dans Vercel :

  | Variable | Rôle | Qui la crée |
  | --- | --- | --- |
  | `DATABASE_URL` | adresse de la base | Neon, automatiquement (étape 3) |
  | `Jwt__Key` | clé de signature des connexions | vous (étape 5) |
  | `Cors__AllowedOrigins__0` | adresse du site autorisé à appeler l'API | vous (étapes 5 et 7) |
  | `PORT` | port d'écoute de l'API dans le conteneur | vous (étape 5) : `8080` |

  Le double tiret bas `__` remplace le `:` de la configuration .NET (`Jwt:Key` devient `Jwt__Key`).
- L'API **refuse de démarrer avec un message clair** s'il manque la base ou la clé JWT (visible dans les journaux Vercel).
- L'API **réessaie automatiquement** de se connecter quand la base Neon se réveille.
- L'adresse `postgres://…` fournie par Neon est **convertie automatiquement** (avec chiffrement SSL obligatoire).

---

## 1. Se connecter à Vercel avec GitHub

1. Allez sur [vercel.com](https://vercel.com) et cliquez sur **Sign Up** (ou **Log In**).
2. Choisissez le plan **Hobby** (gratuit, pour les projets personnels).
3. Cliquez sur **Continue with GitHub** et autorisez Vercel à accéder à votre compte.
4. Si Vercel le demande, donnez-lui accès au dépôt Budgetly (**Only select repositories** → choisissez le dépôt).

---

## 2. Créer le projet de l'API

1. Sur le tableau de bord Vercel : **Add New… → Project**.
2. Dans **Import Git Repository**, cliquez sur **Import** à côté du dépôt Budgetly.
   > Le dépôt n'apparaît pas ? Cliquez sur **Adjust GitHub App Permissions** et autorisez-le.
3. Écran **Configure Project** :

   | Champ | Valeur |
   | --- | --- |
   | Project Name | `budgetly-api` |
   | Root Directory | **Edit** → choisissez **`Budgetly.Api`** → **Continue** |
   | Framework Preset | **Other** (Vercel utilise `vercel.json` et `Dockerfile.vercel`) |
   | Build and Output Settings | ne rien changer |
   | Environment Variables | rien pour l'instant (étapes 3 et 5) |

4. Cliquez sur **Deploy**. La première construction de l'image Docker prend plusieurs minutes.
   > **C'est normal si l'API ne fonctionne pas encore** : il lui manque la base et la clé JWT. Le déploiement réussit, mais l'API refusera de démarrer tant que les étapes 3 à 5 ne sont pas faites.
5. Sur la page du projet, notez l'**adresse de l'API** affichée dans **Domains**, par exemple `https://budgetly-api.vercel.app` (si le nom est déjà pris, Vercel ajoute un suffixe). Utilisez-la **sans `/` à la fin**.

---

## 3. Ajouter la base PostgreSQL (Neon)

1. Ouvrez le projet **budgetly-api**, onglet **Storage**.
2. Cliquez sur **Create Database** (ou **Browse Marketplace**), puis choisissez **Neon** (Serverless Postgres) → **Continue**.
3. Acceptez les conditions, puis réglez :

   | Champ | Valeur |
   | --- | --- |
   | Region | la plus proche de la Tunisie, ex. **Frankfurt (eu-central-1)** |
   | Plan | **Free** |
   | Database name | `budgetly` |

4. Cliquez sur **Create** (ou **Continue**), puis attendez que la base soit prête.
5. Reliez-la au projet de l'API : **Connect Project** (si Vercel ne l'a pas déjà fait), choisissez **budgetly-api**, cochez au moins **Production** (et **Preview** si vous le souhaitez), puis **Connect**.
   > Laissez désactivées les options avancées de « Preview Branching » : elles créent une copie de la base pour chaque branche Git, inutile ici.

Vercel ajoute alors automatiquement au projet plusieurs variables, dont les deux qui comptent pour nous :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | adresse **avec pooler** (regroupement de connexions) : celle que l'**API** utilise |
| `DATABASE_URL_UNPOOLED` | adresse **directe** : celle à utiliser **depuis votre PC** pour les migrations |

Vous pouvez les voir dans **Settings → Environment Variables** du projet (cliquez sur l'œil pour révéler une valeur).

> **Offre gratuite Neon** : la base « s'endort » après quelques minutes sans activité et se réveille au premier appel (en général en moins d'une seconde à quelques secondes). Le quota gratuit est largement suffisant pour une démo de portfolio.

---

## 4. Créer les tables et le compte démo depuis votre PC

La base est vide. On crée les tables avec les **migrations EF Core**, puis on remplit le **compte démo**, depuis votre PC.

1. Dans Vercel : projet **budgetly-api → Settings → Environment Variables**, révélez **`DATABASE_URL_UNPOOLED`** et copiez sa valeur.
   > On utilise l'adresse **directe** : pendant une migration, EF Core pose un verrou sur la base, qui fonctionne mal à travers le pooler.
2. Ouvrez un terminal **PowerShell** dans VS Code, dans le dossier de l'API :

   ```powershell
   cd Budgetly.Api
   ```

3. Placez l'adresse dans une **variable de ce terminal uniquement**. Avec `Read-Host`, vous la collez et elle n'est pas enregistrée dans l'historique des commandes :

   ```powershell
   $env:DATABASE_URL = Read-Host "Adresse directe Neon (DATABASE_URL_UNPOOLED)"
   ```

   Collez l'adresse (clic droit dans le terminal), puis **Entrée**.
   L'API donne la priorité à `DATABASE_URL` sur votre base locale : tant que cette variable existe, les commandes de ce terminal visent **Neon**.

4. Créez les tables :

   ```powershell
   dotnet ef database update
   ```

   ✅ Résultat attendu : `Applying migration '..._InitialPostgres'`, puis `Done.`
   (Une ligne `fail` concernant `__EFMigrationsHistory` peut apparaître juste avant : c'est normal la toute première fois, EF Core vérifie l'historique avant de créer sa table.)

5. Créez le compte démo (6 mois de données réalistes) :

   ```powershell
   dotnet run -- --seed-demo
   ```

   ✅ Résultat attendu : `Compte démo prêt : demo@budgetly.tn (177 transactions, 36 budgets et 27 alertes sur 6 mois)`.
   > La commande peut être relancée sans risque : elle recrée uniquement le compte démo. Elle ne s'exécute **jamais** au démarrage normal de l'API.
   > Variante sans variable d'environnement : `dotnet run -- --seed-demo --connection "<adresse>"` (mais l'adresse, et donc le mot de passe, reste alors dans l'historique du terminal).

6. **Important** : effacez la variable pour que vos prochaines commandes utilisent à nouveau la base locale :

   ```powershell
   Remove-Item Env:DATABASE_URL
   ```

   (Fermer le terminal a le même effet.)

---

## 5. Configurer les variables de l'API et redéployer

### Générer la clé JWT de production

Utilisez une clé **différente** de celle de votre PC. Dans PowerShell :

```powershell
$bytes = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

Copiez le résultat directement dans Vercel (ci-dessous). Si vous la perdez, générez-en simplement une nouvelle : les utilisateurs devront juste se reconnecter.

### Ajouter les variables

1. Projet **budgetly-api → Settings → Environment Variables**.
2. Pour chaque ligne : saisissez **Key** et **Value**, cochez l'environnement **Production** (et **Preview** si vous l'utilisez), puis **Save**.

| Key | Value |
| --- | --- |
| `Jwt__Key` | la clé générée ci-dessus (cochez **Sensitive** si l'option est proposée) |
| `Cors__AllowedOrigins__0` | provisoirement `https://exemple.vercel.app` (la vraie adresse à l'étape 7) |
| `PORT` | `8080` |

> **Pourquoi `PORT=8080` ?** L'image Docker tourne sans droits administrateur et ne peut pas écouter sur le port 80. Cette variable indique à Vercel d'envoyer les requêtes sur le port 8080, celui où l'API écoute.
> `DATABASE_URL` est déjà là (étape 3) : ne la modifiez pas.

### Redéployer

Sur Vercel, une variable modifiée ne s'applique qu'au **prochain déploiement** :

1. Onglet **Deployments**.
2. Sur le dernier déploiement, menu **⋯** → **Redeploy** → **Redeploy**.

### Tester l'API

Ouvrez `https://<adresse-de-l-api>/health` dans le navigateur.

✅ La page affiche **OK**.

Sinon, regardez les journaux : onglet **Logs** du projet (ou **Deployments → le déploiement → Runtime Logs**). L'API y écrit clairement ce qui manque (voir [Problèmes fréquents](#8-problèmes-fréquents)). Au démarrage, vous devez voir : `Now listening on: http://0.0.0.0:8080`.

---

## 6. Créer le projet du site

1. Tableau de bord Vercel : **Add New… → Project**, et importez **le même dépôt** Budgetly.
2. Écran **Configure Project** :

   | Champ | Valeur |
   | --- | --- |
   | Project Name | ex. `budgetly-ines` (donnera `budgetly-ines.vercel.app` si l'adresse est libre) |
   | Root Directory | **Edit** → **`budgetly-web`** |
   | Framework Preset | **Vite** (détecté automatiquement) |
   | Build and Output Settings | valeurs par défaut (`npm run build`, dossier `dist`) |

3. Déroulez **Environment Variables** et ajoutez :

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | l'adresse de l'API de l'étape 2, ex. `https://budgetly-api.vercel.app` (**https**, **sans `/` final**) |

4. Cliquez sur **Deploy**.
5. Notez l'**adresse du site** affichée dans **Domains** (ex. `https://budgetly-ines.vercel.app`).

> Les variables `VITE_…` sont **intégrées au moment de la compilation** : si vous changez `VITE_API_URL`, il faut **redéployer** le site.
> Vercel crée aussi une adresse différente pour chaque déploiement (avec `-git-` ou un code au milieu). Utilisez toujours l'adresse de **production** affichée dans « Domains ».

---

## 7. Autoriser l'adresse du site dans l'API (CORS)

Par sécurité, l'API n'accepte que les appels venant des sites listés dans `Cors__AllowedOrigins`.

1. Projet **budgetly-api → Settings → Environment Variables**.
2. Modifiez `Cors__AllowedOrigins__0` : remplacez la valeur provisoire par l'**adresse du site**, ex. `https://budgetly-ines.vercel.app` (**https**, sans `/` à la fin, sans chemin).
3. **Save**, puis **redéployez l'API** (Deployments → **⋯** → **Redeploy**).

### Vérification finale

1. Ouvrez l'adresse du site.
2. Cliquez sur **Essayer avec le compte démo**. Si la base dormait, le message « Le serveur se réveille, cela peut prendre jusqu'à une minute… » peut s'afficher quelques secondes.
3. Vous arrivez sur le tableau de bord de **Yasmine** : graphiques, budgets, alertes.
4. Rechargez la page (F5) sur `/transactions` : elle doit s'afficher (pas d'erreur 404).
5. Dans le README, remplacez `[LIEN_DEMO]` par l'adresse du site.

🎉 Budgetly est en ligne.

---

## 8. Problèmes fréquents

### Erreur CORS dans le navigateur

**Symptôme** : rien ne se passe à la connexion, et la console du navigateur (F12 → Console) affiche :
`Access to XMLHttpRequest at 'https://budgetly-api...' from origin 'https://budgetly-ines...' has been blocked by CORS policy`.

**Solutions** :
- `Cors__AllowedOrigins__0` doit être **exactement** l'adresse affichée dans la barre du navigateur : `https://`, même orthographe, aucun chemin après le domaine.
- Vous êtes sur une adresse de **déploiement** (avec `-git-` ou un code au milieu) : ouvrez l'adresse de **production**, ou ajoutez cette adresse dans une deuxième variable `Cors__AllowedOrigins__1`.
- La variable a été modifiée mais l'API **n'a pas été redéployée** : sur Vercel, c'est obligatoire.
- **Piège** : si l'API plante, sa réponse d'erreur n'a pas d'en-têtes CORS, et le navigateur affiche aussi une « erreur CORS ». Vérifiez d'abord que `https://<api>/health` répond **OK**.

### Erreur 502 sur toutes les requêtes de l'API (le port)

**Symptôme** : `/health` renvoie **502 Bad Gateway**, ou la page d'erreur de Vercel.

**Cause** : Vercel envoie les requêtes sur un port où l'API n'écoute pas.

**Solutions** :
- Vérifiez la variable **`PORT = 8080`** (étape 5), puis **redéployez**.
- Dans les journaux (**Logs**), la ligne `Now listening on: http://0.0.0.0:8080` doit apparaître. Si l'API écoute sur un autre port, c'est que `PORT` a une autre valeur.
- Si les journaux montrent une erreur au démarrage (voir ci-dessous), l'API s'est arrêtée : corrigez l'erreur, c'est elle qui provoque le 502.

### L'API ne démarre pas, ou erreur de connexion à la base

Regardez les journaux du projet **budgetly-api** (**Logs**) :

| Message dans les journaux | Solution |
| --- | --- |
| `Aucune base de données configurée` | `DATABASE_URL` absente : reliez Neon au projet pour l'environnement **Production** (étape 3), puis redéployez. |
| `Jwt:Key est manquante ou trop courte` | Ajoutez `Jwt__Key` (88 caractères générés), avec **deux** tirets bas, puis redéployez. |
| `password authentication failed` | La variable `DATABASE_URL` a été modifiée à la main : reconnectez la base depuis l'onglet **Storage** pour la régénérer. |
| `relation "Users" does not exist` | Les tables n'existent pas : refaites l'étape 4 (migrations). |
| Délai dépassé (`timeout`) au premier appel | La base se réveillait : l'API réessaie seule ; rechargez la page après quelques secondes. |

### Migrations refusées

| Symptôme (étape 4) | Cause | Solution |
| --- | --- | --- |
| La migration s'applique à votre base **locale** au lieu de Neon | La variable `$env:DATABASE_URL` n'est pas définie **dans ce terminal** | Refaites le point 3 de l'étape 4 dans le même terminal que `dotnet ef`. |
| `password authentication failed` | Adresse mal copiée (souvent la fin coupée) | Recopiez toute la valeur de `DATABASE_URL_UNPOOLED`. |
| Blocage ou erreur de verrou pendant la migration | Vous avez utilisé l'adresse **avec pooler** (`-pooler` dans le nom) | Utilisez `DATABASE_URL_UNPOOLED`. |
| `No such host is known` / délai dépassé | Pas d'accès Internet, ou réseau qui bloque le port 5432 (certains Wi-Fi d'école ou d'entreprise) | Réessayez depuis une autre connexion (partage de connexion du téléphone, par exemple). |
| `dotnet ef` : commande introuvable | Outil non installé | `dotnet tool install --global dotnet-ef`, puis rouvrez le terminal. |

### Autres messages

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Page **404** en rechargeant `/budgets` sur le site | Root Directory du site différent de `budgetly-web` | **Settings → Build and Deployment** du projet du site, puis redéployez. |
| Console : `VITE_API_URL est absente`, ou appels vers `localhost` | Variable absente au moment de la compilation | Ajoutez `VITE_API_URL` au projet du site, puis redéployez. |
| Console : `Mixed Content` | `VITE_API_URL` commence par `http://` | Mettez l'adresse en **https://**, puis redéployez le site. |
| « Trop de tentatives. Patiente une minute… » | Protection contre les essais de mots de passe en série (5 par minute et par adresse IP) | Attendez une minute. |
| Le déploiement de l'API échoue (« container » non disponible, ou erreur sur `services`) | Fonctionnalité bêta non ouverte à votre compte | Passez au **plan B** ci-dessous. |

---

## 9. Plan B : l'API sur Render

Si Vercel refuse le runtime « container » sur le plan gratuit, hébergez **uniquement l'API** sur [Render](https://render.com), avec **le même Dockerfile**. La base reste sur Neon, le site reste sur Vercel.

### Créer le service

1. Sur [render.com](https://render.com), **Get Started** → connectez-vous avec **GitHub**.
2. **New → Web Service**, puis choisissez le dépôt Budgetly (autorisez Render à y accéder si besoin).
3. Réglez le service :

   | Champ | Valeur |
   | --- | --- |
   | Name | `budgetly-api` (donnera `https://budgetly-api.onrender.com` si le nom est libre) |
   | Language | **Docker** |
   | Branch | `main` (ou votre branche principale) |
   | Region | **Frankfurt (EU Central)** (proche de la base Neon) |
   | Root Directory | `Budgetly.Api` |
   | Dockerfile Path | `./Dockerfile.vercel` *(relatif au Root Directory)* |
   | Docker Build Context Directory | `.` *(relatif au Root Directory)* |
   | Instance Type | **Free** |

4. **Environment Variables** : ajoutez

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | l'adresse **avec pooler** de Neon (variable `DATABASE_URL` du projet Vercel, ou console Neon) |
   | `Jwt__Key` | une clé générée (même commande qu'à l'étape 5) |
   | `Cors__AllowedOrigins__0` | l'adresse du site Vercel, ex. `https://budgetly-ines.vercel.app` |

   > Pas besoin de `PORT` : Render la définit lui-même et l'API la lit automatiquement.

5. Dans **Advanced**, mettez **Health Check Path** à `/health`.
6. Cliquez sur **Deploy Web Service**. Suivez la construction dans **Logs** : à la fin, `Now listening on: http://0.0.0.0:…` puis « Your service is live ».
7. Testez `https://budgetly-api.onrender.com/health` : la page affiche **OK**.

### Brancher le site sur Render

1. Projet du site sur Vercel → **Settings → Environment Variables** → `VITE_API_URL` = l'adresse Render (https, sans `/` final).
2. **Redéployez le site**.
3. Si vous aviez créé le projet API sur Vercel, vous pouvez le supprimer (**Settings → Advanced → Delete Project**) ; la base Neon reste utilisable par Render tant que vous ne la supprimez pas (vérifiez-le dans l'onglet **Storage** avant).

### À savoir sur l'offre gratuite de Render

- Le service **s'endort après 15 minutes** sans visite ; le réveil prend **environ une minute**. C'est exactement le cas prévu par le message « Le serveur se réveille, cela peut prendre jusqu'à une minute… » de la page de connexion.
- 750 heures gratuites par mois et par espace de travail (largement assez pour un seul service).
- Les migrations et le compte démo se font toujours depuis votre PC, exactement comme à l'étape 4.

---

## 10. Mettre à jour plus tard

| Je modifie… | Ce que je fais |
| --- | --- |
| Le site (`budgetly-web`) ou l'API (`Budgetly.Api`) | `git push` : Vercel (ou Render) reconstruit et redéploie automatiquement. |
| Le modèle de données (nouvelle migration) | Refaire l'étape 4 (points 1 à 4 puis 6) **avant** de pousser la nouvelle version de l'API. |
| Les données du compte démo | Refaire l'étape 4 (points 1 à 3, 5 et 6). Pensez-y une fois par mois : les données suivent la date du jour. |
| Une variable (clé, CORS…) | La modifier dans les réglages du projet, puis **redéployer**. |

### Bonnes pratiques de sécurité

- Ne partagez jamais `DATABASE_URL`, `DATABASE_URL_UNPOOLED` ni `Jwt__Key` (pas de capture d'écran, pas de message).
- En cas de fuite : réinitialisez le mot de passe de la base dans la console Neon (le projet Vercel reçoit la nouvelle adresse via l'intégration ; vérifiez `DATABASE_URL`), ou générez une nouvelle `Jwt__Key`, puis redéployez.
- Le fichier `.env` (mot de passe de la base locale) n'est jamais envoyé sur GitHub : il est dans le `.gitignore`.
