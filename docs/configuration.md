# Configuration Reference

## `.env` Variables

Copy `.env.example` to `.env` before first deployment. See
[deployment.md](deployment.md) for the full variable table.

Key variables:

| Variable | Purpose |
|----------|---------|
| `DOMAIN` | Hostname used by Caddy and the frontend |
| `TLS_MODE` | `internal` (self-signed) or an email for Let's Encrypt |
| `PG_PASSWORD` | PostgreSQL password — generate with `openssl rand -base64 32` |
| `SECRET_KEY` | Flask application secret |
| `AUTH_SECRET` | NextAuth.js session secret |

Several frontend variables (`NEXTAUTH_URL`, `AUTH_TRUST_HOST`,
`NEXT_PUBLIC_API_URL`, `API_URL`) are auto-derived from `DOMAIN` in
`.env.example` and typically do not need manual changes.

## `config.yaml`

The centralized configuration file that drives the application. It is a
multi-document YAML file with three sections (separated by `---`):

### 1. Theme

```yaml
theme:
  logo: "/ptt_logo.png"
  colors:
    primary:
      main: "#0F6DDC"
      light: "#ADCDF3"
      contrastText: "#ffffff"
    secondary:
      main: "#FF5A64"
      light: "#FFC7CA"
      contrastText: "#ffffff"
```

### 2. Categories

Defines the data categories displayed in the UI. Each category has:

- `label` — display name
- `editable` — whether records in this category can be edited via the UI
- `addable` — (optional) whether new rows can be added from the UI

```yaml
categories:
  global:
    label: "Global"
    editable: false
  student_info:
    label: "Student IHE Enrollment Information"
    editable: false
  clinical_placements:
    label: "Culminating Clinical Placement"
    editable: true
    addable: true
  program_info:
    label: "Additional Program Information"
    editable: true
```

### 3. Fields

Each field maps to a database column and a UI form element:

| Property | Description |
|----------|-------------|
| `Category` | Which category this field belongs to |
| `Order within category` | Display order |
| `Data element label` | UI label |
| `CSV column name` | Column name in both the CSV and the database |
| `Type` | `text`, `select`, or `date` |
| `Dropdown or validation values` | Semicolon-separated options for `select` fields |
| `multi-select` | Allow multiple selections |
| `Required field` | Whether the field is required on the form |
| `Include in bulk upload?` | Whether the CSV importer reads this column |
| `Display on Student Record page?` | Show on the record detail view |
| `Use-as-filter-in-View/Edit-search-page` | Add to the search filter panel |
| `Use-as-filter-on-Download-page` | Add to the export filter panel |
| `Include-in-download-file` | Include in CSV exports (`true`, `false`, or `Admin Only`) |

Fields can also reference dynamic lookup APIs:

```yaml
Validation values from API:
  path: "district_record"
  method: "GET"
Depends on: placement_district   # cascading filter
```

## `read_config.py`

This script reads `config.yaml` and generates application artifacts. It runs
automatically in `entrypoint.sh` at container startup. The four modes are:

| Mode | What it generates |
|------|-------------------|
| `key` | Fernet encryption key (`secret.key`) — only if one does not exist |
| `csv` | CSV template files in `/tmp/csv/` |
| `db`  | SQL DDL scripts in `/tmp/sql/` |
| `app` | `app.py` from `app_template.jinja2` — the Flask application |

### Hot-reload (advanced)

If you change `config.yaml` while containers are running and want to apply
changes without a full restart:

```bash
# Regenerate the Flask app
docker compose exec api python3 /tmp/read_config.py \
  --mode app --config /app/config.yaml \
  --template /tmp/app_template.jinja2 --output /app/app.py

# Regenerate SQL schemas (if field definitions changed)
docker compose exec api python3 /tmp/read_config.py \
  --mode db --config /app/config.yaml \
  --template /tmp/app_template.jinja2 --output /app/app.py

# Regenerate CSV templates
docker compose exec api python3 /tmp/read_config.py \
  --mode csv --config /app/config.yaml \
  --template /tmp/app_template.jinja2 --output /app/app.py
```

After regenerating `app.py`, restart Gunicorn inside the container:

```bash
docker compose exec api supervisorctl restart flaskapp
```
