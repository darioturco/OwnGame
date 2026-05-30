# [OwnGame](https://en.ogame.gameforge.com/)

A server-side reconstruction of [OGame](https://en.ogame.gameforge.com/), a browser-based multiplayer real-time strategy game set in space. Each player starts with a planet and expands by colonizing planets, gathering resources, building fleets, and battling other players.

Built on version *7.1.0-rc16* of the original game. Adds new moon buildings and an improved UI over the base game. The original game is owned by Gameforge — this project is for educational purposes only.

![Overview](public/Imagenes/Scrennshots/Screenshot_Overview.png?raw=true "Overview")

---

## Tech Stack

| Technology | Role |
|---|---|
| **Node.js** | Runtime — entire app is JavaScript |
| **Express** | HTTP server and routing |
| **MongoDB** | Persistent storage for all player and universe data |
| **Pug** | Server-side HTML templating |
| **Passport** | Authentication middleware |
| **Jest** | Unit/integration testing |

---

## Project Structure

```
OwnGame/
├── app.js                      # Express app setup, middleware, router mounting
├── bin/www                     # HTTP server entry point
├── package.json
│
├── routes/
│   ├── universe.js             # Core game engine: resource ticks, fleet movements, battles
│   ├── data_base.js            # MongoDB abstraction layer
│   ├── battle.js               # Combat resolution logic
│   ├── rewards.js              # Tutorial mission rewards
│   ├── expedicion.js           # Expedition mission logic
│   ├── funciones_auxiliares.js # Shared utility functions
│   ├── authenticater.js        # Passport authentication strategies
│   ├── Queue.js                # Event queue for time-based updates
│   │
│   ├── constructions/
│   │   └── costs.js            # Build costs, time formulas, tech trees
│   │
│   ├── paths/                  # Express routers (HTTP layer)
│   │   ├── index.js            # Page routes (GET /OGame_Overview.html, etc.)
│   │   ├── api.js              # JSON API routes (GET/POST /api/...)
│   │   ├── admin.js            # Admin API: create/delete universe, manage bots
│   │   └── bot.js              # Bot status endpoints
│   │
│   ├── bots/                   # AI player system
│   │   ├── bot_logic.js        # Bot decision-making engine
│   │   ├── bot_simulation.js   # Bot game-loop runner
│   │   ├── bot_names.js        # Pool of random bot names
│   │   ├── bot_types.js        # Bot type registry
│   │   └── types/
│   │       ├── miner.js        # Miner bot: prioritizes resource buildings
│   │       ├── warrior.js      # Warrior bot: prioritizes fleet and attacks
│   │       └── balanced.js     # Balanced bot: mix of both strategies
│   │
│   └── dev/
│       └── dev_functions.js    # Dev helpers: seed data, reset universe
│
├── views/                      # Pug templates (one per game screen)
│   ├── Ogame_Layout.pug        # Base layout inherited by all pages
│   ├── OGame_Overview.pug      # Planet overview
│   ├── OGame_Resources.pug     # Mine buildings
│   ├── OGame_Facilities.pug    # Facility buildings
│   ├── OGame_Research.pug      # Research lab
│   ├── OGame_Shipyard.pug      # Ship construction
│   ├── OGame_Fleet.pug         # Send fleet screen
│   ├── OGame_Movement.pug      # Active fleet movements
│   ├── OGame_Galaxy.pug        # Galaxy view
│   ├── OGame_Defence.pug       # Defense structures
│   ├── OGame_Technology.pug    # Technology tree viewer
│   ├── OGame_Calculator.pug    # Resource/fleet calculator
│   ├── MoonBuildings.pug       # Moon-specific buildings
│   ├── Landing.pug             # Universe lobby / player list
│   └── ...
│
├── public/
│   ├── Scripts/                # Client-side JavaScript (one per page)
│   └── Css/                    # Stylesheets
│
├── bots/                       # Standalone bot scripts (run outside server)
│   ├── bot_prueba.js
│   └── bot_test.js
│
├── tests/                      # Jest test suites
│   ├── bots/
│   ├── funciones_auxiliares/
│   └── universe/
│
├── logs/
│   └── buildings.log           # Build queue activity log
│
└── documentation/
    ├── Documentation.tex       # LaTeX source
    └── Documentacion.pdf       # Compiled docs
```

---

## Installation

**Prerequisites:** [Node.js](https://nodejs.org/en/download) and [MongoDB](https://www.mongodb.com/docs/manual/installation/) must be installed and MongoDB must be running on port 27017.

```shell
# Clone the repo
git clone https://github.com/darioturco/OwnGame.git
cd OwnGame

# Install dependencies
npm install

# Create .env file
```

Create a `.env` file in the project root with the following variables:

```env
MONGO_URL=mongodb://localhost:27017/
UNIVERSE_NAME=Universo1
JUGADORES=jugadores
PLANETAS=universo
PLAYER=dturco
PORT=3000
```

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `UNIVERSE_NAME` | Name of the game universe (MongoDB database name) |
| `JUGADORES` | MongoDB collection name for players |
| `PLANETAS` | MongoDB collection name for the universe/planets |
| `PLAYER` | Default player name to load on startup |
| `PORT` | HTTP port (optional, defaults to `3000`) |

---

## Running the App

```shell
# Production mode
npm start

# Development mode (auto-restart on file changes, debug logging enabled)
npm run start-dev
```

Open your browser at **http://localhost:3000**.

---

## First-Time Setup

The database starts empty. You need to create a universe and at least one player before the game is playable.

**Option 1 — Via the Admin API** (recommended):

```shell
# Create a universe
curl -X POST http://localhost:3000/admin/create-universe \
  -H "Content-Type: application/json" \
  -d '{"name":"Universo1","speed":1,"speedFleet":100,"maxGalaxies":9}'

# Create a human player
# (set PLAYER in .env to this name, then restart the server)

# Create bot players
curl -X POST http://localhost:3000/admin/create-random-bots \
  -H "Content-Type: application/json" \
  -d '{"count":10}'
```

**Option 2 — Via dev functions** (debug mode only):

Start the server with `--debug` flag and call `POST /admin/execute-dev-code`. The dev code in `routes/dev/dev_functions.js` runs `dev.setupPlayer()` which wipes and recreates the universe with seed data.

After setup, navigate to **http://localhost:3000/OGame_Overview.html** to start playing.

---

## Running Tests

```shell
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

Tests live in `tests/` and cover bot simulation, helper functions, and universe logic.

---

## Game Screens

| URL | Screen |
|---|---|
| `/` | Universe lobby — lists all players and their status |
| `/OGame_Overview.html` | Planet overview |
| `/OGame_Resources.html` | Mine buildings (Metal, Crystal, Deuterium) |
| `/OGame_Facilities.html` | Facility buildings (Shipyard, Lab, etc.) |
| `/OGame_Research.html` | Research upgrades |
| `/OGame_Shipyard.html` | Build ships and defenses |
| `/OGame_Fleet.html` | Send a fleet on a mission |
| `/OGame_Movement.html` | Track active fleet movements |
| `/OGame_Galaxy.html` | Browse the galaxy map |
| `/OGame_Defence.html` | Planetary defense structures |
| `/OGame_Technology.html` | Technology tree overview |
| `/OGame_Calculator.html` | Resource and fleet calculator |
| `/MoonBuildings.html` | Moon-specific buildings (requires active moon) |
| `/Highscore.html` | Player ranking by points |

Add `?planet=N` to any URL to switch to planet index N. Add `?moon=true` to view the moon of that planet.

---

## API Reference

All API routes are prefixed with `/api`.

### Read endpoints

| Endpoint | Description |
|---|---|
| `GET /api/buildings` | Build costs and queue for current planet (or moon) |
| `GET /api/research` | Research costs and status |
| `GET /api/shipyard` | Shipyard queue and build costs |
| `GET /api/defense` | Defense build costs |
| `GET /api/galaxy?gal=&sys=` | System contents for galaxy view |
| `GET /api/readMessages` | Player messages |
| `GET /api/highscore` | Full player ranking |
| `GET /api/searchPlayer?name=` | Find a player by name |
| `GET /api/missions` | Tutorial mission list and status |
| `GET /api/usePhalanx?gal=&sys=&pos=` | Spy on fleet movements with Phalanx |
| `GET /api/info/universoInfo` | Universe settings object |
| `GET /api/info/allPlayers` | Raw player collection dump |

### Write endpoints (`/api/set/...`)

| Endpoint | Description |
|---|---|
| `GET /api/set/sendBuildRequest?obj=` | Queue a building upgrade |
| `GET /api/set/sendResearchRequest?obj=` | Queue a research upgrade |
| `GET /api/set/sendShipyardRequest?obj=&cant=` | Queue ship/defense construction |
| `GET /api/set/cancelBuildRequest` | Cancel current build |
| `GET /api/set/cancelResearchRequest` | Cancel current research |
| `GET /api/set/cancelShipyardRequest?obj=` | Cancel a shipyard item |
| `POST /api/set/addFleetMovement` | Launch a fleet mission |
| `POST /api/set/moveCuanticFleet` | Activate jump gate |
| `GET /api/set/returnFleet?num=` | Recall a fleet early |
| `GET /api/set/updateResources` | Update resource extraction settings |
| `GET /api/set/updateResourcesMoon` | Update moon resource settings |
| `GET /api/set/deleteMessages?all=&id=` | Delete messages |
| `GET /api/set/abandonPlanet?confirm=Yes` | Abandon current planet |
| `GET /api/set/updateRewards?mission=` | Claim a tutorial reward |
| `GET /api/set/marketMoon` | Trade resources via moon marketplace |

### Admin endpoints (`/admin/...`)

These endpoints manage the universe and bots. Destructive operations require explicit confirmation parameters.

| Endpoint | Description |
|---|---|
| `POST /admin/create-universe` | Initialize a new universe with settings |
| `GET /admin/delete-universe?Sure=Delete` | **Wipe entire universe and all players** |
| `POST /admin/create-bots` | Create named bots of a given type |
| `POST /admin/create-random-bots` | Create N bots with random names and types |
| `POST /admin/delete-player` | Remove a player from the universe |
| `GET /admin/get-bot?name=` | Get bot config for a player |
| `POST /admin/set-bot-config` | Update a bot's mission config |
| `POST /admin/execute-dev-code` | Run `dev_functions.js` code (debug mode only) |

---

## Bot System

Bots are AI-controlled players that run automatically alongside human players. There are three bot types:

| Type | Strategy |
|---|---|
| `miner` | Focuses on resource extraction — upgrades mines and storage first |
| `warrior` | Focuses on fleet and attacks — builds combat ships and raids others |
| `balanced` | Mix of both strategies |

Bots run on the same game tick loop as players (`UPDATE_TIME = 500ms`). Their decision logic lives in `routes/bots/bot_logic.js`. Bot missions are configured as ordered lists of tasks (e.g., `{type: "building", item: "metalMine", level: 15}`).

---

## Screenshots

![Resources](public/Imagenes/Scrennshots/Screenshot_Resources.png?raw=true "Resources")

![Galaxy](public/Imagenes/Scrennshots/Screenshot_Galaxy.png?raw=true "Galaxy")

![Moon](public/Imagenes/Scrennshots/Screenshot_Moon.png?raw=true "Moon")

---

## Documentation

Full API and architecture documentation: [`documentation/Documentacion.pdf`](documentation/Documentacion.pdf)

Also available at runtime: `GET /api/info/documentation`

OGame wiki: [wiki.ogame.org](http://wiki.ogame.org/index.php?title=Main_Page/en&setlang=en)
