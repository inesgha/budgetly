# Budgetly

**Le budget des étudiants, enfin simple : suis tes dépenses, fixe tes limites et reçois une alerte avant qu'il ne soit trop tard.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-10-512BD4?logo=dotnet&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL_Server-Express-CC2927?logo=microsoftsqlserver&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-xUnit-5B3FE0)

Budgetly est une application web complète (API REST + interface React) pensée pour les étudiants : on y saisit ses revenus (bourse, famille, petits boulots) et ses dépenses en dinars tunisiens, on fixe un budget par catégorie, et l'application prévient dès qu'un budget atteint 80 % puis 100 %.

---

## Démo en ligne

**[LIEN_DEMO](LIEN_DEMO)**

| Email | Mot de passe |
| --- | --- |
| `demo@budgetly.tn` | `Demo1234!` |

Ou plus simplement : bouton **« Essayer avec le compte démo »** sur la page de connexion.

> **Premier chargement lent ?** C'est normal : l'API (Azure App Service, offre gratuite) s'endort quand personne ne l'utilise, et la base Azure SQL serverless se met en pause. Le premier appel les réveille, ce qui peut prendre jusqu'à une minute ; ensuite, tout est rapide.

---

## Aperçu

| Tableau de bord | Transactions |
| --- | --- |
| ![Tableau de bord](docs/screenshots/dashboard.png) | ![Transactions](docs/screenshots/transactions.png) |

| Budgets | Statistiques |
| --- | --- |
| ![Budgets](docs/screenshots/budgets.png) | ![Statistiques](docs/screenshots/stats.png) |

<p align="center"><img src="docs/screenshots/mobile.png" alt="Version mobile" width="300" /></p>

---

## Fonctionnalités

- **Compte personnel** : inscription, connexion par JWT, catégories créées automatiquement.
- **Transactions** : ajout, modification, suppression ; recherche, filtres (type, catégorie), pagination et **export CSV** compatible Excel.
- **Budgets mensuels** par catégorie, avec une barre de progression et un statut (OK, 80 %, atteint, dépassé) ; copie des budgets du mois précédent en un clic.
- **Alertes automatiques** à 80 % et à 100 % d'un budget, dans une cloche avec le nombre d'alertes non lues.
- **Tableau de bord** : solde du mois, revenus, dépenses, répartition par catégorie (anneau) et évolution sur 6 mois (barres).
- **Statistiques** : revenus vs dépenses sur 6 ou 12 mois, taux d'épargne, comparaison avec le mois précédent par catégorie.
- **Paramètres** : gestion des catégories (nom, type, couleur).
- **Interface soignée** : responsive (mobile, tablette, ordinateur), accessible (clavier, lecteurs d'écran, contrastes), en français.
- **Compte démo** prêt à l'emploi avec 6 mois de données réalistes.

---

## Stack technique

| Côté | Technologies |
| --- | --- |
| Front-end | React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, Axios |
| Back-end | ASP.NET Core 10 (Web API, contrôleurs), Entity Framework Core 10 |
| Base de données | SQL Server (Express) |
| Sécurité | JWT (Bearer), BCrypt, limitation de débit, CORS |
| Tests | xUnit, EF Core InMemory |
| Hébergement | Azure App Service (API), Azure SQL Database serverless (base), Vercel (front) |

### Architecture

```mermaid
flowchart LR
    A["Navigateur<br/>React 19 · Vite · Tailwind"] -- "JSON + en-tête Authorization: Bearer JWT" --> B["API REST<br/>ASP.NET Core 10"]
    B --> S["Services<br/>AlertService · TokenService"]
    B --> C["EF Core 10"]
    S --> C
    C --> D[("SQL Server")]
```

### Modèle de données

```mermaid
erDiagram
    USER ||--o{ CATEGORY : "possède"
    USER ||--o{ TRANSACTION : "saisit"
    USER ||--o{ BUDGET : "fixe"
    USER ||--o{ ALERT : "reçoit"
    CATEGORY ||--o{ TRANSACTION : "classe"
    CATEGORY ||--o{ BUDGET : "limite"
    BUDGET ||--o{ ALERT : "déclenche"

    USER {
        int Id PK
        string Name
        string Email UK
        string PasswordHash
        string Currency
        datetime CreatedAt
    }
    CATEGORY {
        int Id PK
        string Name
        string Color
        string Type "Expense ou Income"
        int UserId FK
    }
    TRANSACTION {
        int Id PK
        decimal Amount "decimal(10,3)"
        string Type
        date Date "DateOnly"
        string Note
        int UserId FK
        int CategoryId FK
    }
    BUDGET {
        int Id PK
        decimal Limit "decimal(10,3)"
        int Month
        int Year
        int UserId FK
        int CategoryId FK "unique avec Month et Year"
    }
    ALERT {
        int Id PK
        int Level "80 ou 100"
        string Message
        bool IsRead
        datetime CreatedAt
        int UserId FK
        int BudgetId FK "unique avec Level"
    }
```

### Routes de l'API

Toutes les routes sauf `register`, `login` et `/health` demandent un token JWT (`Authorization: Bearer <token>`).

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/api/auth/register` | Créer un compte (5 essais / minute / IP) |
| POST | `/api/auth/login` | Se connecter, recevoir un JWT (5 essais / minute / IP) |
| GET | `/api/auth/me` | Utilisateur connecté |
| GET | `/api/categories?type=` | Catégories (filtre Expense / Income) |
| POST · PUT · DELETE | `/api/categories` · `/api/categories/{id}` | Créer, modifier, supprimer une catégorie (409 si elle est utilisée) |
| GET | `/api/transactions?month=&year=&type=&categoryId=&search=&page=&pageSize=` | Liste paginée et filtrée |
| GET | `/api/transactions/{id}` | Une transaction |
| POST · PUT · DELETE | `/api/transactions` · `/api/transactions/{id}` | Créer, modifier, supprimer une transaction |
| GET | `/api/budgets?month=&year=` | Budgets du mois avec dépensé, reste, % et statut |
| POST · PUT · DELETE | `/api/budgets` · `/api/budgets/{id}` | Créer, modifier la limite, supprimer (avec ses alertes) |
| GET | `/api/alerts?unreadOnly=` | Alertes, les plus récentes d'abord |
| GET | `/api/alerts/unread-count` | Nombre d'alertes non lues |
| PATCH | `/api/alerts/{id}/read` · `/api/alerts/read-all` | Marquer une alerte ou toutes les alertes comme lues |
| GET | `/api/stats/summary?month=&year=` | Résumé du mois : totaux, dépenses par catégorie, 5 dernières transactions |
| GET | `/api/stats/monthly?months=6` | Revenus et dépenses des N derniers mois |
| GET | `/health` | Sonde de santé (renvoie `OK`) |

Les erreurs suivent le format standard **ProblemDetails** (RFC 9110) ; les messages sont en français.

---

## Points techniques

- **Authentification JWT + BCrypt** : le mot de passe n'est jamais stocké, seulement son empreinte BCrypt (salée et volontairement lente). À la connexion, l'API signe un JWT (HMAC-SHA256) que le front envoie à chaque requête ; la clé de signature est gardée hors du code (`dotnet user-secrets`).
- **Isolation des données par utilisateur** : chaque requête filtre sur l'identifiant lu dans le token. Une ressource d'un autre utilisateur renvoie **404** (et non 403) pour ne pas révéler qu'elle existe.
- **Alertes automatiques dans un service** : `AlertService` est appelé après chaque création, modification ou suppression de dépense ou de budget. La règle métier est écrite une seule fois, testée, et un **index unique (BudgetId, Level)** garantit qu'une alerte n'est jamais créée en double, même en cas de requêtes simultanées.
- **Agrégations côté SQL** : les totaux (`SUM`, `GROUP BY`) sont calculés par SQL Server via EF Core ; aucune liste de transactions n'est chargée en mémoire pour faire une somme.
- **`DateOnly` pour les dates** : une transaction a une date sans heure ni fuseau (colonne SQL `date`). Fini les dépenses du 1er du mois qui basculent au mois précédent à cause d'un décalage UTC. Côté front, les dates sont construites en heure locale (jamais `toISOString()`).
- **Montants en `decimal(10,3)`** : le dinar tunisien compte 3 décimales (millimes) ; aucun nombre à virgule flottante pour l'argent.
- **Limitation de débit** : 5 tentatives par minute et par adresse IP sur la connexion et l'inscription (réponse 429 en français) contre les attaques par force brute.
- **Gestion globale des erreurs** : toute exception non gérée devient une réponse ProblemDetails propre, sans pile d'appels ; le détail part dans les logs.
- **Tests unitaires** (xUnit) : statut d'un budget aux limites exactes (80 % et 100 %, au millime près) et `AlertService` (création des alertes 80 et 100, pas de doublon, isolation par utilisateur et par mois).
- **Front robuste** : hooks personnalisés (`useApi`) avec annulation des requêtes, mois sélectionné gardé dans l'URL, chargement des pages à la demande, `ErrorBoundary`, squelettes de chargement et états d'erreur avec « Réessayer ».

---

## Installation

### Prérequis

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- SQL Server ou SQL Server Express (instance `localhost\SQLEXPRESS` par défaut)
- [Node.js](https://nodejs.org/) 22 ou plus récent
- L'outil EF Core : `dotnet tool install --global dotnet-ef`

### 1. Back-end (API)

```bash
cd Budgetly.Api

# Clé de signature des JWT (au moins 64 caractères aléatoires), stockée hors du dépôt
dotnet user-secrets set "Jwt:Key" "<colle ici une longue clé aléatoire>"
#   Pour générer une clé :  openssl rand -base64 64
#   ou, en PowerShell 7 :   [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

# Créer la base BudgetlyDb et ses tables
dotnet ef database update

# (Facultatif) Créer le compte démo avec 6 mois de données
dotnet run -- --seed-demo

# Lancer l'API sur http://localhost:5194
dotnet run
```

> Autre serveur SQL ? Remplace la chaîne de connexion sans toucher au code :
> `dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=BudgetlyDb;..."`

### 2. Front-end

```bash
cd budgetly-web
cp .env.example .env      # contient VITE_API_URL=http://localhost:5194
npm install
npm run dev               # http://localhost:5173
```

### 3. Tests

```bash
# À la racine du dépôt
dotnet test
```

### Compte démo

| Email | Mot de passe |
| --- | --- |
| `demo@budgetly.tn` | `Demo1234!` |

Sur la page de connexion, le bouton **« Essayer avec le compte démo »** remplit et envoie ces identifiants.
Le compte est créé par `dotnet run -- --seed-demo` : jamais au démarrage normal de l'API, uniquement sur cette commande explicite (ce qui permet aussi de remplir la base de production depuis son PC). Relancer la commande recrée le compte démo sans toucher aux autres comptes.

### 4. Mise en ligne

Le guide pas à pas (Azure SQL Database, Azure App Service, Vercel) est dans **[DEPLOY.md](DEPLOY.md)**.

---

## Structure du dépôt

```
Budgetly/
├── Budgetly.sln
├── Budgetly.Api/              API ASP.NET Core
│   ├── Controllers/           Auth, Categories, Transactions, Budgets, Alerts, Stats
│   ├── Data/                  AppDbContext, catégories par défaut, compte démo
│   ├── Dtos/                  Objets échangés avec le front (jamais les entités EF)
│   ├── Infrastructure/        Gestion globale des erreurs, limitation de débit
│   ├── Migrations/            Migrations EF Core
│   ├── Models/                Entités : User, Category, Transaction, Budget, Alert
│   └── Services/              AlertService, BudgetCalculator, TokenService
├── Budgetly.Tests/            Tests unitaires xUnit
├── budgetly-web/              Front-end React
│   └── src/
│       ├── api/               Client Axios, appels à l'API, messages d'erreur
│       ├── components/        Composants (ui, dashboard, budgets, stats…)
│       ├── context/           Authentification, notifications (toasts)
│       ├── hooks/             Hooks personnalisés (useApi, useSelectedMonth…)
│       ├── pages/             Une page par route
│       └── utils/             Formats (DT, dates), CSV, couleurs
└── docs/screenshots/          Captures d'écran du README
```

---

## Autrice

**Ines Ghammam** — étudiante en Licence DSI (Développement des Systèmes d'Information) à l'ISET de Mahdia.

- GitHub : [github.com/inesgha](https://github.com/inesgha)
- LinkedIn : [linkedin.com/in/ines-ghammam-2a6794350](https://www.linkedin.com/in/ines-ghammam-2a6794350)
- Portfolio : [inesgha.github.io](https://inesgha.github.io/)

---

## English summary

**Budgetly** is a full-stack personal budgeting app for students: track income and expenses in Tunisian dinars, set a monthly budget per category, and get automatic alerts at 80 % and 100 % of each budget.

- **Stack**: React 19 + Vite + Tailwind CSS 4 + Recharts (front-end), ASP.NET Core 10 Web API + Entity Framework Core 10 (back-end), SQL Server, xUnit.
- **Highlights**: JWT authentication with BCrypt password hashing, per-user data isolation (404 on foreign resources), alert logic in a dedicated, unit-tested service with a unique index against duplicates, SQL-side aggregations, `DateOnly` dates to avoid UTC shifts, rate limiting on authentication endpoints, global ProblemDetails error handling, responsive and accessible French UI.
- **Live demo**: [LIEN_DEMO](LIEN_DEMO) — the first load can take up to a minute while the free Azure API and serverless database wake up.
- **Run it**: set `Jwt:Key` with `dotnet user-secrets`, run `dotnet ef database update` and `dotnet run` in `Budgetly.Api`, then `npm install` and `npm run dev` in `budgetly-web`. Demo account: `demo@budgetly.tn` / `Demo1234!` (created with `dotnet run -- --seed-demo`).
