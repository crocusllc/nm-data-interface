# Deployment Guide

This guide covers deploying the PTT application on a Linux server with Docker.

## Prerequisites

- **Git** — `sudo yum install git` (Amazon Linux) or `sudo apt install git` (Ubuntu)
- **Docker Engine** — [Install Docker](https://docs.docker.com/engine/install/)
- **Docker Compose** v2 — included with modern Docker Engine installs

Verify:

```bash
git --version
docker --version
docker compose version
```

## Platform Notes

**AWS EC2 (recommended):**

- Instance type: `t3.medium` (2 vCPU, 4 GB RAM) or larger
- Storage: 20 GB+ EBS
- Security group: open ports **80** (HTTP), **443** (HTTPS), and **22** (SSH).
  The API port (3030) is bound to `127.0.0.1` and should **not** be exposed externally.

Windows and Azure deployments are not covered here. The application relies on
Docker Compose and should run on any platform that supports it, but only Linux
has been tested in production.

## Step-by-Step Deployment

### 1. Clone the repository

```bash
git clone <repo-url>
cd nm-data-interface
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Hostname for the application | `localhost` or `ptt.example.edu` |
| `TLS_MODE` | Caddy TLS setting | `internal` (self-signed) or `you@example.com` (Let's Encrypt) |
| `PG_USER` | PostgreSQL user | `postgres` |
| `PG_PASSWORD` | PostgreSQL password | *(generate with `openssl rand -base64 32`)* |
| `PG_DB` | Database name | `ptt_db` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `SECRET_KEY` | Flask secret key | *(generate with `openssl rand -base64 32`)* |
| `AUTH_SECRET` | NextAuth.js secret | *(generate with `openssl rand -base64 32`)* |

The following variables are auto-derived from `DOMAIN` and do not need editing:

- `NEXTAUTH_URL=https://${DOMAIN}`
- `AUTH_TRUST_HOST=https://${DOMAIN}`
- `NEXT_PUBLIC_API_URL=https://${DOMAIN}/db`
- `API_URL=https://${DOMAIN}/db`

### 3. Configure TLS (Caddyfile)

The default `caddy/Caddyfile` works out of the box. TLS behavior is controlled
entirely by the `TLS_MODE` variable in `.env`:

- **Development (self-signed):** `TLS_MODE=internal`
- **Production (Let's Encrypt):** `TLS_MODE=you@example.com` — requires port 80
  to be publicly reachable for the ACME challenge and `DOMAIN` set to a valid
  public hostname.

#### Offline / PFX certificate

For air-gapped environments where Let's Encrypt is unavailable:

1. Create the `caddy/data/` directory and place your `.pfx` certificate in it:
   ```bash
   mkdir -p caddy/data
   cp /path/to/cert.pfx caddy/data/
   ```
2. Update `caddy/Caddyfile` to reference it:

```
{$DOMAIN} {
    tls /data/cert.pfx
    # ... rest unchanged
}
```

### 4. Encryption Key (`secret.key`)

On first startup, the application auto-generates a `secret.key` file (Fernet
encryption key) used to encrypt all student PII at rest. This file is:

- Created by `entrypoint.sh` on first run
- **Not recoverable** — if lost, all encrypted data becomes unreadable
- Already excluded from git via `.gitignore`

**Back up `secret.key` alongside your database backups.** See
[updating.md](updating.md) for backup procedures.

### 5. Deploy

```bash
./deploy.sh
```

This script:

1. Validates that `.env` and Docker are present
2. Runs `docker compose up -d --build`
3. Waits for health checks to pass
4. Prints the access URL

### 6. Verify installation

1. Open `https://localhost` (or your `DOMAIN`) in a browser.
   Accept the self-signed certificate warning if using `TLS_MODE=internal`.
2. Log in with the default admin account:
   - Username: `admin`
   - You will be prompted to set a new password on first login.

### 7. Enable auto-start on boot (production)

```bash
sudo ./scripts/install-autostart.sh
```

This installs a systemd service (`ptt-autostart.service`) that starts the
Docker Compose stack automatically after a server reboot.

Useful commands:

```bash
systemctl status ptt-autostart    # Check status
systemctl disable ptt-autostart   # Disable auto-start
```

## Fresh Install / Clean Slate

To completely reset the application and database:

> **Warning:** This destroys all data including uploaded records and user
> accounts. Back up first — see [updating.md](updating.md).

```bash
docker compose down
sudo rm -rf postgres/
./deploy.sh
```

The `postgres/` directory holds the PostgreSQL data volume. Removing it forces
a full database re-initialization on the next deploy.
