# Architecture

## Project Structure

```
ptt/
├── caddy/
│   └── Caddyfile               # Reverse proxy and TLS configuration
├── backend/
│   ├── index.js                # Legacy — not used at runtime
│   ├── package.json            # Legacy
│   └── sql/                    # DDL scripts (users, logs, data tables)
│       ├── users_ddl.sql
│       ├── logs_ddl.sql
│       ├── schools_districts.sql
│       ├── student_info.sql
│       ├── clinical_placements.sql
│       ├── program_info.sql
│       └── type_columns.sql
├── frontend/
│   ├── Dockerfile              # Multi-stage Next.js build
│   ├── app/                    # Next.js App Router (pages, components, API routes)
│   │   ├── (pages)/            # Route groups
│   │   ├── api/                # Next.js API routes (auth)
│   │   ├── components/         # React components
│   │   ├── utils/              # Helper functions
│   │   ├── auth.js             # NextAuth.js configuration
│   │   └── layout.js, page.js
│   ├── middleware.js            # Auth middleware
│   ├── next.config.mjs
│   └── public/
│       ├── docs/               # Generated CSV templates
│       └── *.png, *.svg        # Static assets
├── scripts/
│   ├── backup-db.sh            # Database backup
│   ├── restore-db.sh           # Database restore
│   ├── update-app.sh           # Automated update with rollback
│   ├── install-autostart.sh    # systemd service installer
│   └── ptt-autostart.service   # systemd unit file
├── config.yaml                 # Application configuration (theme, categories, fields)
├── read_config.py              # Config parser — generates app.py, SQL, CSV templates
├── app_template.jinja2         # Jinja2 template for generating app.py
├── app.py                      # Generated Flask application (do not edit directly)
├── supervisord.conf            # Manages PostgreSQL + Gunicorn in the API container
├── entrypoint.sh               # Container init: DB setup, config generation
├── Dockerfile                  # API container (Python, PostgreSQL, supervisord)
├── docker-compose.yml          # Service definitions
├── deploy.sh                   # One-command deployment
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
└── .env                        # Local environment (not committed)
```

## Service Topology

```
                    ┌──────────────────────────────────────────────┐
                    │                   Host                       │
                    │                                              │
  HTTP :80 ────────►│  ┌───────────┐                               │
  HTTPS :443 ──────►│  │   Caddy   │ (reverse proxy + TLS)         │
                    │  └─────┬─────┘                               │
                    │        │                                     │
                    │    ┌───┴─────────────────────────┐           │
                    │    │            │                 │           │
                    │    ▼            ▼                             │
                    │  /db/*       everything else                 │
                    │    │            │                             │
                    │    ▼            ▼                             │
                    │  ┌──────┐   ┌──────┐                         │
                    │  │ API  │   │ App  │  (Next.js :3000)        │
                    │  │:5000 │   └──────┘                         │
                    │  │      │                                    │
                    │  │ ┌────┴────────┐                           │
                    │  │ │ supervisord │                           │
                    │  │ ├─────────────┤                           │
                    │  │ │ PostgreSQL  │                           │
                    │  │ │ Gunicorn    │                           │
                    │  │ └─────────────┘                           │
                    │  └──────┘                                    │
                    └──────────────────────────────────────────────┘
```

### Services (Docker Compose)

| Service | Image / Build | Ports | Role |
|---------|--------------|-------|------|
| `caddy` | `caddy:alpine` | 80, 443 | Reverse proxy, TLS termination, CORS |
| `api` | Built from `./Dockerfile` | 5000 (internal), 5432 (PostgreSQL) | Flask API + PostgreSQL (via supervisord) |
| `app` | Built from `./frontend/Dockerfile` | 3000 (internal) | Next.js frontend |

### Networks

- **web** — connects Caddy to the outside world
- **internal** — connects Caddy, API, and App containers to each other

## Build Pipeline

### API container startup (`entrypoint.sh`)

1. Wait for `config.yaml` to be available
2. Generate `secret.key` if it doesn't exist (`read_config.py --mode key`)
3. Generate CSV templates (`--mode csv`)
4. Generate SQL DDL scripts (`--mode db`)
5. Generate `app.py` from `app_template.jinja2` (`--mode app`)
6. Initialize PostgreSQL if no existing data directory is found
7. Run DDL scripts to create tables
8. Hand off to `supervisord`, which starts PostgreSQL and Gunicorn

### Frontend container

Standard Next.js multi-stage Docker build:

1. Install dependencies (`npm ci`)
2. Build the application (`npm run build`) with `NEXT_PUBLIC_API_URL` baked in
3. Run the standalone Node.js server (`node server.js`)

## How `read_config.py` Generates `app.py`

1. Parses the multi-document `config.yaml` (theme, categories, fields)
2. Extracts field definitions, categories, and validation rules
3. Renders `app_template.jinja2` with the parsed data
4. Outputs `app.py` — a complete Flask application with routes for CRUD, CSV
   upload, search, export, and user management
5. In `db` mode, generates SQL `CREATE TABLE` statements matching the field
   definitions
6. In `csv` mode, generates CSV template files with the correct column headers
