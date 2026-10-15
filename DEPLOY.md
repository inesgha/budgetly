# Mettre Budgetly en ligne

Ce guide explique, pas à pas, comment publier Budgetly **gratuitement** :

| Partie | Service | Offre |
| --- | --- | --- |
| Base de données | Azure SQL Database | Offre gratuite (serverless, pause automatique) |
| API (Budgetly.Api) | Azure App Service | Plan **Free F1** |
| Site (budgetly-web) | Vercel | Plan **Hobby** (gratuit) |

```
Navigateur ──► Vercel (React) ──► Azure App Service (API .NET 10) ──► Azure SQL Database
```

> Les écrans du portail Azure évoluent souvent : si un libellé est légèrement différent de ce guide, cherchez l'option la plus proche, le principe reste le même.

---

## Sommaire

0. [Avant de commencer](#0-avant-de-commencer)
1. [Créer la base Azure SQL (offre gratuite)](#1-créer-la-base-azure-sql-offre-gratuite)
2. [Récupérer la chaîne de connexion](#2-récupérer-la-chaîne-de-connexion)
3. [Créer les tables et le compte démo depuis votre PC](#3-créer-les-tables-et-le-compte-démo-depuis-votre-pc)
4. [Créer l'App Service (l'hébergement de l'API)](#4-créer-lapp-service-lhébergement-de-lapi)
5. [Configurer les variables de l'API](#5-configurer-les-variables-de-lapi)
6. [Déployer l'API depuis VS Code](#6-déployer-lapi-depuis-vs-code)
7. [Déployer le site sur Vercel](#7-déployer-le-site-sur-vercel)
8. [Autoriser l'URL Vercel dans l'API (CORS)](#8-autoriser-lurl-vercel-dans-lapi-cors)
9. [Vérification finale](#9-vérification-finale)
10. [Mettre à jour le site plus tard](#10-mettre-à-jour-le-site-plus-tard)
11. [Problèmes fréquents](#11-problèmes-fréquents)

Tout au long du guide, notez vos valeurs dans un **gestionnaire de mots de passe** ou un fichier **hors du dépôt Git** (jamais dans le projet) :

| À noter | Exemple | Où on l'obtient |
| --- | --- | --- |
| Nom du serveur SQL | `budgetly-sql-ines` | Étape 1 |
| Identifiant administrateur SQL | `budgetlyadmin` | Étape 1 |
| Mot de passe administrateur SQL | *(le vôtre)* | Étape 1 |
| Chaîne de connexion | `Server=tcp:...` | Étape 2 |
| Clé JWT de production | *(générée)* | Étape 5 |
| URL de l'API | `https://budgetly-api-ines-....azurewebsites.net` | Étape 4 |
| URL du site | `https://budgetly-ines.vercel.app` | Étape 7 |

---

## 0. Avant de commencer

### Ce qu'il vous faut

- **Un compte Azure.** Étudiante, vous pouvez utiliser l'offre **[Azure for Students](https://azure.microsoft.com/free/students/)** : 100 $ de crédit, sans carte bancaire, avec votre adresse e-mail étudiante. Ce guide n'utilise que des offres gratuites : le crédit n'est pas consommé.
- **Un compte [GitHub](https://github.com)** avec le projet Budgetly poussé dessus (Vercel le récupère depuis GitHub).
- **Un compte [Vercel](https://vercel.com)** : inscrivez-vous avec « Continue with GitHub ».
- Sur votre PC :
  - le **SDK .NET 10** (`dotnet --version` doit afficher `10.x`) ;
  - l'outil EF Core : `dotnet tool install --global dotnet-ef` (ou `dotnet tool update --global dotnet-ef`) ;
  - **VS Code** avec l'extension **Azure App Service** (éditeur : Microsoft). Elle installe aussi « Azure Resources », qui permet de se connecter à Azure.

### Le projet est déjà prêt pour la production

- Aucun secret n'est dans le code : la chaîne de connexion et la clé JWT sont lues dans la **configuration**. En ligne, ce sont des **variables d'environnement** que vous définirez dans Azure (étape 5).
- Le nom d'une variable remplace le `:` de la configuration par `__` (deux tirets bas) : `ConnectionStrings:DefaultConnection` devient `ConnectionStrings__DefaultConnection`.
- L'API refuse de démarrer avec un message clair s'il manque la chaîne de connexion ou si la clé JWT est trop courte (voir [Problèmes fréquents](#11-problèmes-fréquents)).
- L'API réessaie automatiquement de se connecter si la base Azure est en pause (elle se réveille en quelques dizaines de secondes).

### Choisir une région

Prenez **la même région pour la base et pour l'API** (sinon chaque requête traverse l'Europe et coûte du temps). Une région proche de la Tunisie, par exemple **France Central**, est un bon choix. Si l'offre gratuite n'est pas proposée dans une région, essayez-en une autre (West Europe, Italy North…) et gardez-la pour tout le reste.

---

## 1. Créer la base Azure SQL (offre gratuite)

1. Ouvrez le [portail Azure](https://portal.azure.com) et connectez-vous.
2. Dans la barre de recherche en haut, tapez **SQL databases** et ouvrez le service.
3. Cliquez sur **+ Create** (Créer).
4. Un bandeau propose l'offre gratuite (« Want to try Azure SQL Database for free? »). Cliquez sur **Apply offer** (Appliquer l'offre).
   > Si le bandeau n'apparaît pas, c'est souvent que la subscription a déjà utilisé ses bases gratuites, ou que la région ne les propose pas encore : changez de région à l'étape suivante.

### Onglet « Basics » (Bases)

| Champ | Valeur |
| --- | --- |
| Subscription | votre abonnement (ex. *Azure for Students*) |
| Resource group | **Create new** → `budgetly-rg` (ce « dossier » regroupera la base et l'API) |
| Database name | `BudgetlyDb` |
| Server | **Create new** (voir ci-dessous) |
| Want to use SQL elastic pool? | **No** |
| Workload environment | *Development* (si le choix est proposé) |
| Compute + storage | déjà réglé par l'offre gratuite : **General Purpose – Serverless** |
| Backup storage redundancy | **Locally-redundant** (le moins cher, suffisant ici) |

**Création du serveur** (fenêtre « Create SQL Database Server ») :

| Champ | Valeur |
| --- | --- |
| Server name | un nom unique au monde, en minuscules, ex. `budgetly-sql-ines` |
| Location | votre région, ex. **France Central** |
| Authentication method | **Use SQL authentication** |
| Server admin login | ex. `budgetlyadmin` (pas `admin` ni `sa`, interdits) |
| Password / Confirm password | un mot de passe fort (voir l'encadré) |

> **Conseil mot de passe** : au moins 16 caractères avec majuscules, minuscules et chiffres, et seulement des symboles simples comme `!`, `-`, `_`. Évitez `;`, `'`, `"` et `$` : ils compliquent l'écriture de la chaîne de connexion et des commandes PowerShell.
> Notez-le tout de suite dans votre gestionnaire de mots de passe : Azure ne vous le remontrera jamais.

Cliquez sur **OK**.

**Comportement à la fin du quota gratuit** : dans la section de l'offre gratuite (« Free database offer »), choisissez **Auto-pause the database until next month** (Mettre la base en pause jusqu'au mois suivant).

> L'offre gratuite inclut chaque mois un quota de calcul et 32 Go de stockage. Avec cette option, si le quota est épuisé, la base se met en pause jusqu'au 1er du mois suivant au lieu de vous facturer. **Vous ne paierez jamais rien**, au pire la démo est indisponible quelques jours.

### Onglet « Networking » (Réseau)

| Champ | Valeur |
| --- | --- |
| Connectivity method | **Public endpoint** |
| Allow Azure services and resources to access this server | **Yes** (l'API hébergée sur Azure doit pouvoir se connecter) |
| Add current client IP address | **Yes** (votre PC doit pouvoir se connecter pour créer les tables) |
| Connection policy | *Default* |
| Minimum TLS version | **1.2** |

### Onglet « Security » (Sécurité)

- **Microsoft Defender for SQL** : **Not now** (option payante, inutile ici).

### Onglets suivants

- **Additional settings** → *Use existing data* : **None** (la base doit être vide, les tables seront créées par les migrations).
- **Tags** : rien à faire.

Cliquez sur **Review + create**, vérifiez que l'estimation de coût indique bien l'offre gratuite, puis **Create**. Le déploiement prend quelques minutes. À la fin, cliquez sur **Go to resource**.

> Sur la page de la base (**Overview**), une section indique le **quota gratuit restant** pour le mois. Pratique pour surveiller.

---

## 2. Récupérer la chaîne de connexion

1. Sur la page de la base **BudgetlyDb**, menu de gauche : **Settings → Connection strings**.
2. Onglet **ADO.NET (SQL authentication)**.
3. Copiez la chaîne. Elle ressemble à ceci :

   ```
   Server=tcp:budgetly-sql-ines.database.windows.net,1433;Initial Catalog=BudgetlyDb;Persist Security Info=False;User ID=budgetlyadmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

4. Modifiez-la (dans votre gestionnaire de mots de passe, **pas dans le projet**) :
   - remplacez `{your_password}` **accolades comprises** par votre mot de passe : `Password=MonMotDePasse;` ;
   - remplacez `Connection Timeout=30` par **`Connection Timeout=60`** : une base en pause met parfois plus de 30 secondes à se réveiller.

C'est cette chaîne complète que les étapes suivantes appellent « **la chaîne de connexion** ». Elle contient votre mot de passe : ne la mettez **jamais** dans un fichier du projet, ni dans un message, ni dans une capture d'écran.

---

## 3. Créer les tables et le compte démo depuis votre PC

La base est vide. On crée les tables avec les **migrations EF Core**, puis on remplit le **compte démo**, le tout depuis votre PC.

1. Ouvrez un terminal **PowerShell** dans VS Code et allez dans le dossier de l'API :

   ```powershell
   cd Budgetly.Api
   ```

2. Placez la chaîne de connexion dans une **variable de ce terminal uniquement**. Avec `Read-Host`, vous la collez au clavier et elle n'apparaît pas dans l'historique des commandes :

   ```powershell
   $env:ConnectionStrings__DefaultConnection = Read-Host "Chaîne de connexion Azure"
   ```

   Collez la chaîne (clic droit dans le terminal), puis **Entrée**.

3. Créez les tables :

   ```powershell
   dotnet ef database update --connection $env:ConnectionStrings__DefaultConnection
   ```

   ✅ Résultat attendu : des lignes `Applying migration '..._InitialCreate'`, puis `Done.`
   Le premier essai peut être long (réveil de la base). En cas d'erreur de pare-feu, voir [Problèmes fréquents](#migrations-refusées-par-le-pare-feu).

4. Créez le compte démo (6 mois de données réalistes) :

   ```powershell
   dotnet run -- --seed-demo
   ```

   La variable du terminal remplace la base locale : le compte est créé **dans Azure**.
   ✅ Résultat attendu : `Compte démo prêt : demo@budgetly.tn (177 transactions, 30 budgets et 15 alertes sur 6 mois)`.

   > Cette commande peut être relancée sans risque : elle recrée uniquement le compte démo, sans toucher aux autres comptes. Elle ne s'exécute **jamais** au démarrage normal de l'API.

5. **Important** : effacez la variable, pour que vos prochains `dotnet run` utilisent à nouveau la base locale :

   ```powershell
   Remove-Item Env:ConnectionStrings__DefaultConnection
   ```

   (Fermer le terminal a le même effet.)

---

## 4. Créer l'App Service (l'hébergement de l'API)

1. Dans le portail, recherchez **App Services**, puis **+ Create → Web App**.

### Onglet « Basics »

| Champ | Valeur |
| --- | --- |
| Subscription | la même que la base |
| Resource group | `budgetly-rg` (le même que la base) |
| Name | un nom unique, ex. `budgetly-api-ines` |
| Secure unique default hostname | laissez la valeur proposée (activé) |
| Publish | **Code** |
| Runtime stack | **.NET 10 (LTS)** |
| Operating System | **Windows** |
| Region | **la même que la base**, ex. France Central |
| Windows Plan | **Create new** → ex. `budgetly-plan` |
| Pricing plan | cliquez sur **Explore pricing plans** et choisissez **Free F1** |

### Autres onglets

- **Database** : ne cochez rien (la base existe déjà).
- **Deployment** : *Continuous deployment* **Disable** (on déploie depuis VS Code).
- **Networking** : *Enable public access* **On**.
- **Monitoring** : *Enable Application Insights* **No** (plus simple ; les journaux restent visibles dans « Log stream »).

Cliquez sur **Review + create**, puis **Create**, puis **Go to resource**.

### Noter l'URL de l'API

Sur la page **Overview** de l'App Service, copiez **Default domain**. Avec l'option « unique default hostname », il ressemble à :

```
budgetly-api-ines-abcd1234efgh5678.francecentral-01.azurewebsites.net
```

L'URL de l'API est ce domaine précédé de `https://`, **sans `/` à la fin**.

### Forcer le HTTPS

Menu de gauche : **Settings → Configuration → General settings** → **HTTPS Only : On** (souvent déjà activé) → **Save**.

> **À savoir sur le plan F1** : l'application s'endort après environ 20 minutes sans visite (l'option « Always On » n'existe pas en gratuit) et dispose de 60 minutes de calcul par jour, largement assez pour une démo de portfolio.

---

## 5. Configurer les variables de l'API

L'API lit sa configuration dans des **variables d'environnement**. Aucune ne doit apparaître dans le code ou dans Git.

### Générer une nouvelle clé JWT de production

Utilisez une clé **différente** de celle de votre PC. Dans PowerShell :

```powershell
$bytes = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); [Convert]::ToBase64String($bytes)
```

Copiez le résultat (88 caractères) directement dans Azure (ci-dessous). Inutile de le sauvegarder ailleurs : si vous le perdez, il suffit d'en générer un nouveau (les utilisateurs devront juste se reconnecter).

### Ajouter les variables

1. Sur la page de l'App Service : **Settings → Environment variables**, onglet **App settings**.
2. Pour chaque ligne du tableau : **+ Add**, remplissez **Name** et **Value**, cliquez sur **Apply**.

| Name | Value |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | la chaîne de connexion complète (étape 2) |
| `Jwt__Key` | la clé générée ci-dessus |
| `Cors__AllowedOrigins__0` | provisoirement `https://exemple.vercel.app` (vous mettrez la vraie URL à l'étape 8) |

3. En bas de la page, cliquez sur **Apply**, puis **Confirm** : l'application redémarre avec ces valeurs.

> `Cors__AllowedOrigins__0` correspond à la première case du tableau `Cors:AllowedOrigins`. Pour autoriser un deuxième site plus tard (un nom de domaine personnalisé, par exemple), ajoutez `Cors__AllowedOrigins__1`.
> Ne créez **pas** de variable `ASPNETCORE_ENVIRONMENT` : Azure démarre l'API en **Production**, c'est ce qu'on veut.

---

## 6. Déployer l'API depuis VS Code

1. Dans VS Code, cliquez sur l'icône **Azure** de la barre latérale, puis **Sign in to Azure** et connectez-vous.
2. Dans l'**Explorateur** de fichiers, faites un **clic droit sur le dossier `Budgetly.Api`** (pas sur la racine du projet, qui contient aussi les tests), puis **Deploy to Web App…**
3. Choisissez votre abonnement, puis l'application **budgetly-api-ines**.
4. Si VS Code indique qu'il manque une configuration de déploiement (« Required configuration to deploy is missing »), cliquez sur **Add Config** : il crée une tâche qui compile l'API en mode Release (`dotnet publish`) avant chaque envoi. Le dossier `.vscode/` créé n'est pas envoyé sur GitHub (il est dans le `.gitignore`).
5. Confirmez l'écrasement du contenu existant (**Deploy**).
6. Suivez la progression dans le panneau **Output**. À la fin : « Deployment to "budgetly-api-ines" completed ».

### Tester l'API

Ouvrez dans le navigateur :

```
https://<default-domain-de-votre-api>/health
```

✅ La page doit afficher **OK** (la première fois, attendez jusqu'à une minute : l'application démarre).

Si vous voyez une erreur **500.30** ou une page d'erreur, ouvrez **Monitoring → Log stream** dans le portail : le message de l'API explique ce qui manque (voir [Problèmes fréquents](#erreur-50030-au-démarrage-de-lapi)).

---

## 7. Déployer le site sur Vercel

> Prérequis : le projet est poussé sur GitHub (avec `budgetly-web/vercel.json`, qui permet de recharger n'importe quelle page sans erreur 404).

1. Sur [vercel.com](https://vercel.com), cliquez sur **Add New… → Project**.
2. Dans **Import Git Repository**, choisissez votre dépôt Budgetly → **Import**.
   > Le dépôt n'apparaît pas ? Cliquez sur **Adjust GitHub App Permissions** et autorisez Vercel à lire ce dépôt.
3. Écran **Configure Project** :

   | Champ | Valeur |
   | --- | --- |
   | Project Name | ex. `budgetly-ines` (il donnera l'adresse `budgetly-ines.vercel.app` si elle est libre) |
   | Root Directory | **Edit** → choisissez **`budgetly-web`** |
   | Framework Preset | **Vite** (détecté automatiquement une fois le dossier choisi) |
   | Build Command / Output Directory | laissez les valeurs par défaut (`npm run build`, `dist`) |

4. Déroulez **Environment Variables** et ajoutez :

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | l'URL de l'API, ex. `https://budgetly-api-ines-abcd1234efgh5678.francecentral-01.azurewebsites.net` (en **https**, **sans `/` final**) |

5. Cliquez sur **Deploy**. Après une à deux minutes : « Congratulations! ».
6. Notez l'**URL de production** affichée dans **Domains** sur la page du projet (ex. `https://budgetly-ines.vercel.app`).

> **Attention** : Vercel crée aussi une URL différente pour chaque déploiement (ex. `budgetly-ines-git-main-ines.vercel.app`). Utilisez toujours le domaine de **production** (celui de « Domains »), c'est le seul autorisé par l'API.
> Les variables `VITE_...` sont **intégrées au moment de la compilation** : si vous modifiez `VITE_API_URL`, il faut **redéployer** (onglet **Deployments** → menu `…` du dernier déploiement → **Redeploy**).

---

## 8. Autoriser l'URL Vercel dans l'API (CORS)

Par sécurité, l'API n'accepte que les appels venant des sites listés dans `Cors__AllowedOrigins`. Il faut y mettre la vraie adresse Vercel.

1. Portail Azure → votre App Service → **Settings → Environment variables**.
2. Cliquez sur `Cors__AllowedOrigins__0` et remplacez la valeur provisoire par l'URL de production Vercel, ex. :

   ```
   https://budgetly-ines.vercel.app
   ```

   (en **https**, **sans `/` à la fin**, sans chemin après le domaine)
3. **Apply**, puis **Apply** en bas de page et **Confirm** : l'API redémarre.

---

## 9. Vérification finale

1. Ouvrez l'URL Vercel.
2. Cliquez sur **Essayer avec le compte démo**.
   - Si le serveur dormait, le message « Le serveur se réveille, cela peut prendre jusqu'à une minute… » s'affiche : c'est normal.
3. Vous arrivez sur le tableau de bord de **Yasmine** avec ses graphiques, ses budgets et 3 alertes non lues.
4. Rechargez la page (F5) sur `/transactions` : elle doit s'afficher (pas d'erreur 404).
5. Dans le README, remplacez `[LIEN_DEMO]` par l'URL Vercel.

🎉 Budgetly est en ligne.

### Après la mise en ligne (sécurité)

- Si vous ne comptez plus lancer de migrations depuis votre PC, supprimez la règle de pare-feu de votre adresse IP : base SQL → serveur → **Security → Networking** → règle de votre IP → supprimer → **Save**.
- Ne partagez jamais la chaîne de connexion ni la clé JWT. Si l'une d'elles a fuité : changez le mot de passe SQL (serveur SQL → **Reset password**) ou générez une nouvelle clé, puis mettez à jour les variables de l'étape 5.

---

## 10. Mettre à jour le site plus tard

| Je modifie… | Ce que je fais |
| --- | --- |
| Le front (`budgetly-web`) | `git push` sur GitHub : Vercel redéploie automatiquement. |
| L'API (`Budgetly.Api`) | VS Code → clic droit sur `Budgetly.Api` → **Deploy to Web App…** (comme à l'étape 6). |
| Le modèle de données (nouvelle migration) | Refaire l'étape 3 (points 1, 2, 3 et 5) **avant** de déployer la nouvelle API. |
| Les données du compte démo | Refaire l'étape 3 (points 1, 2, 4 et 5). Pensez-y une fois par mois : les données suivent la date du jour. |

---

## 11. Problèmes fréquents

### Erreur CORS dans le navigateur

**Symptôme** : rien ne se passe à la connexion, et la console du navigateur (F12 → Console) affiche :
`Access to XMLHttpRequest at 'https://...azurewebsites.net/api/auth/login' from origin 'https://...vercel.app' has been blocked by CORS policy`.

**Causes et solutions** :
- `Cors__AllowedOrigins__0` ne correspond pas **exactement** à l'adresse affichée dans la barre du navigateur : vérifiez `https://`, l'orthographe, et qu'il n'y a pas de chemin après le domaine.
- Vous utilisez une URL de **déploiement** Vercel (avec `-git-` ou un code au milieu) au lieu du domaine de **production** : ouvrez le domaine de production, ou ajoutez cette adresse dans `Cors__AllowedOrigins__1`.
- Les variables ont été modifiées sans cliquer sur **Apply / Confirm** : l'API n'a pas redémarré.
- **Piège** : si l'API plante, sa réponse d'erreur n'a pas d'en-têtes CORS, et le navigateur affiche aussi une « erreur CORS ». Vérifiez d'abord que `https://<api>/health` répond **OK**.

### Erreur 500.30 au démarrage de l'API

**Symptôme** : `/health` affiche « HTTP Error 500.30 – ASP.NET Core app failed to start ».

**Où regarder** : portail → App Service → **Monitoring → Log stream** (ou **Diagnose and solve problems**). Les messages de l'API sont explicites :

| Message dans les journaux | Solution |
| --- | --- |
| `ConnectionStrings:DefaultConnection est manquante` | Ajouter la variable `ConnectionStrings__DefaultConnection` (étape 5), avec **deux** tirets bas. |
| `Jwt:Key est manquante ou trop courte` | Ajouter `Jwt__Key` avec une clé générée (88 caractères). |
| Erreur parlant de runtime ou de framework introuvable | **Settings → Configuration → Stack settings** : vérifier **.NET** et la version **.NET 10**. |

Après chaque correction : **Apply / Confirm**, attendez une minute, puis rouvrez `/health`.

### La base est en pause (premier chargement très lent)

**Symptôme** : la première connexion de la journée met jusqu'à une minute ; le site affiche « Le serveur se réveille… ».

**C'est normal** : l'API gratuite s'endort après ~20 minutes sans visite, et la base serverless se met en pause après une période d'inactivité. L'API réessaie automatiquement pendant le réveil de la base. Les visites suivantes sont rapides.

**Si la base reste inaccessible des heures** (erreur répétée, journaux indiquant que la base « is not currently available ») : le **quota gratuit du mois** est peut-être épuisé. Vérifiez sur la page **Overview** de la base : avec l'option « Auto-pause the database until next month », elle redeviendra disponible le 1er du mois suivant, sans frais.

### Migrations refusées par le pare-feu

**Symptôme** à l'étape 3 :
`Cannot open server 'budgetly-sql-ines' requested by the login. Client with IP address 'x.x.x.x' is not allowed to access the server.`

**Cause** : l'adresse IP de votre PC n'est pas autorisée (elle change souvent, par exemple quand la box redémarre).

**Solution** :
1. Portail → **SQL servers** → votre serveur → **Security → Networking**.
2. **Add your client IPv4 address** (l'adresse indiquée dans le message d'erreur doit apparaître).
3. **Save**, attendez une à deux minutes, relancez la commande.

### Autres messages

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| `Login failed for user 'budgetlyadmin'` | Mot de passe incorrect dans la chaîne, ou `{your_password}` pas remplacé | Corriger la chaîne (étape 2) et la variable Azure (étape 5). |
| Page **404** en rechargeant `/budgets` sur Vercel | `vercel.json` absent, ou **Root Directory** différent de `budgetly-web` | Vérifier le dossier dans **Settings → Build and Deployment** puis redéployer. |
| Console : `VITE_API_URL est absente`, ou appels vers `localhost` | Variable non définie au moment de la compilation | Ajouter `VITE_API_URL` dans Vercel (**Settings → Environment Variables**) puis **Redeploy**. |
| Console : `Mixed Content` | `VITE_API_URL` commence par `http://` | Mettre l'adresse en **https://** puis redéployer. |
| Message « Trop de tentatives. Patiente une minute… » | Protection contre les essais de mots de passe en série (5 par minute) | Attendre une minute. |
| « This web app is stopped » / quota dépassé | Les 60 minutes de calcul quotidiennes du plan F1 sont épuisées | Attendre le lendemain (le quota se réinitialise chaque jour). |
| `dotnet ef` : commande introuvable | Outil EF Core non installé | `dotnet tool install --global dotnet-ef`, puis rouvrir le terminal. |
