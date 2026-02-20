# PTT Educator Preparation Data Interface

This document outlines the requirements and structure for the PTT Educator Preparation Data Interface,
a web application designed to manage student data in educator preparation programs. By utilizing a centralized
configuration file, the application ensures consistency across various components and simplifies maintenance.

## Table of Contents

- Overview
- Features
- Project Structure
- Getting Started
- Configuration
- Usage
- Contributing
- Enabling HTTPS
- License

## Overview

We are developing a React-based application with a Node.js backend and PostgreSQL database. The primary features include:
- User authentication and role-based access control
- CSV data upload functionality
- Student record search and edit capabilities
- Data export to CSV

The application is built using the following technologies:

- Backend: Node.js with Express framework
- Frontend: React.js
- Database: PostgreSQL
- Containerization: Docker

The core idea is to define application behavior, routes, and data models through
a config.yaml file, allowing for flexible and scalable modifications without
altering the core codebase.

## Features

### Functional
- User Authentication
  - login system using usernames and passwords.
  - three user roles: administrator, editor, and viewer, plus superadmin (for bootstrap).
  - Restrict access to the application and underlying data based on user roles. 
- Data Upload
  - User interface for CSV file uploads. This is restricted to the ‘Administrator’ role
  - CSV validation (per CSV file, not across files) to ensure data integrity before import.
  - Display clear feedback on the success or failure of the import process.
- Maintain a log of upload activities.
- CSV Upload Types - 3 in total:
  - Student IHE data: A CSV file provided by the IHE IT group, containing student enrollment data from the institution's SIS.
  - Clinical placement data: Data about clinical placements for students, provided by the EPP group.
  - Program and Student Data: Additional data to populate the system
- Configuration-Based: Centralized configuration for easy updates and maintenance.
- Single Container Deployment: All components run within a single Docker container for simplified deployment.

### Non-Functional
- Security: HTTPS, password hashing, database encryption and protection against common web vulnerabilities.
- Performance: Initial page load times under 2 seconds in normal network conditions
- Browser Compatibility: Functionality across the latest versions of Chrome, Firefox, Safari, and Edge.
- Mobile/Responsive
- Accessibility: Support visual and keyboard accessibility.

## Project Structure

The project is organized as follows:

```
project-root/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── config.yaml
├── config_reader.py
├── Dockerfile
├── docker-compose.yml
└── README.md
```

 - backend/: Contains the Python/Flask server code.
 - frontend/: Contains the React.js application code.
 - config.yaml: Centralized configuration file defining routes, data models, and other settings.
 - Dockerfile: Instructions to build the Docker image.
 - docker-compose.yml: Defines services, including the PostgreSQL database.

## Getting Started

```bash
git clone https://www.indava.dev/indava-people/ptt.git
cd ptt
cp .env.example .env
# Edit .env, then:
./deploy.sh
```

## Configuration

The config.yaml file defines the application's behavior and structure. Modifying this file allows you to update routes, data models, and other settings without changing the core codebase.

### Deployment (4 steps)

1. **Copy and configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your domain, generate secure PG_PASSWORD, SECRET_KEY, AUTH_SECRET
   # Generate secrets: openssl rand -base64 32
   ```

2. **Edit config.yaml** – Fields for the student information form, etc.

3. **Deploy**
   ```bash
   ./deploy.sh
   ```

4. **Access** – https://localhost (or your DOMAIN)

Networks are created automatically by Docker Compose. The container entrypoint runs read_config.py (key, csv, db, app) at startup—no manual exec commands needed.

### Manual read_config.py (advanced)

Only if you change config.yaml while the container is running and need to regenerate without a full restart:

```bash
docker compose exec api python3 /tmp/read_config.py --mode key --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
docker compose exec api python3 /tmp/read_config.py --mode app --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
# For SQL or CSV changes: --mode db or --mode csv
```

## Usage

   - Login: Access the login page at http://localhost:3000/login.
   - Home Page: After logging in, you'll be redirected to the home page.
   - Data Upload: Navigate to http://localhost:3000/upload to upload data files.
   - Search Records: Use the search functionality on the home page to find uploaded records.
   - Edit Data: Click on a record from the search results to edit its details.
   - Data Export: Use the export option to download data records.
   - Admin Page: Admins can manage users at http://localhost:3000/admin.

## Enabling HTTPS

Caddy handles TLS via .env: `TLS_MODE=internal` (self-signed, dev) or `TLS_MODE=you@example.com` (Let's Encrypt, production). Set `DOMAIN` to your custom domain for production.

## Creating and Deleting users

To obtain a token, make the following cURL call:

```
curl -X POST <YOUR_API_URL>/db/login -H "Content-Type: application/json"
    -d '{
            "username": "<USER_NAME>",
            "password": "<USER_PASSWORD>"
        }'
```

To create a user, use the following cURL call:

```
curl -X POST <YOUR_API_URL>/db/create_user -H 'Authorization: Bearer <YOUR_USER_TOKEN>'
     -H "Content-Type: application/json"      -d '{
                                   "username": "<NEW_USER_NAME>",
                                   "password": "<NEW_USER_PASSWORD>",
                                   "user_email":"<NEW_USER_EMAIL>",
                                   "user_role": "<editor|admin|viewer>"
                                 }'

```

To delete a user, user the following call:

```
curl -X POST <YOUR_API_URL>/db/delete_user -H 'Authorization: Bearer <YOUR_USER_TOKEN>'
     -H "Content-Type: application/json"      -d '{
                                   "username": <USER_NAME>,
                                 }'

```

To reset a user's password (Administrator only), use the following cURL call:

```
curl -X POST <YOUR_API_URL>/reset_user_password -H 'Authorization: Bearer <YOUR_USER_TOKEN>'
     -H "Content-Type: application/json"      -d '{
                                   "username": "<USER_NAME>",
                                   "new_password": "<NEW_PASSWORD>"
                                 }'
```

Note: The password must be at least 8 characters long. The user will be prompted to change their password on their next login.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request
with your changes. Ensure that your code adheres to the project's coding 
standards and includes appropriate tests.

## License

This project is licensed under the Apache 2 License. See the [LICENSE](https://www.apache.org/licenses/LICENSE-2.0) file for details.
