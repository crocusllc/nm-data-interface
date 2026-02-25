# PTT Educator Preparation Data Interface

A web application for managing student data in educator preparation programs.
Built for Institutions of Higher Education (IHEs) participating in the
Preparation Training Tracker (PTT) initiative, it provides CSV upload,
role-based access, and record management through a centralized, configuration-driven
architecture.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | Next.js (React)                         |
| Backend   | Python / Flask (Gunicorn)               |
| Database  | PostgreSQL 15                           |
| Proxy/TLS | Caddy                                   |
| Process   | supervisord (PostgreSQL + Flask in one container) |
| Deploy    | Docker Compose                          |

## Quick Start

```bash
git clone <repo-url>
cd ptt
cp .env.example .env        # Edit .env — set DOMAIN, generate secrets
./deploy.sh                  # Builds and starts all containers
# Access at https://localhost (or your DOMAIN)
```

See [docs/deployment.md](docs/deployment.md) for the full deployment guide.

## Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/deployment.md) | Prerequisites, .env configuration, Caddyfile/TLS, deploy steps |
| [Updating & Backups](docs/updating.md) | Update script, backup, restore, post-update verification |
| [Configuration Reference](docs/configuration.md) | `.env` variables, `config.yaml` structure, `read_config.py` modes |
| [User Guide](docs/user-guide.md) | Login, CSV upload, search, edit, export |
| [Admin Guide](docs/admin-guide.md) | User management (UI and curl), roles, bootstrap |
| [Architecture](docs/architecture.md) | Project structure, service topology, build pipeline |
| [Changelog](CHANGELOG.md) | Release history and known issues |

## License

This project is licensed under the Apache 2.0 License. See the
[LICENSE](https://www.apache.org/licenses/LICENSE-2.0) for details.

## Contributing

Contributions are welcome. Fork the repository and open a pull request.
Ensure your code follows existing conventions and includes appropriate tests.
