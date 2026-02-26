# Admin Guide

## Default Accounts and Bootstrap

On a fresh install, one built-in account exists:

| Username | Role | First login |
|----------|------|-------------|
| `admin` | administrator | You will be prompted to set a new password |

**First steps after deployment:**

1. Log in as `admin`.
2. Set a new password when prompted.
3. Create additional accounts as needed (editor, viewer).

## User Management via API

Users are created and deleted through the API.

> In the examples below, replace `YOUR_DOMAIN` with your actual domain
> (e.g., `localhost` or `ptt.example.edu`). Lines are split with `\` for
> readability — these are single commands.

### Obtain an authentication token

```bash
curl -X POST https://YOUR_DOMAIN/db/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }'
```

The response includes a `token` field. Use it as a Bearer token in subsequent
requests.

### Create a user

```bash
curl -X POST https://YOUR_DOMAIN/db/create_user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "temporarypassword",
    "user_email": "newuser@example.edu",
    "user_role": "editor"
  }'
```

Valid roles: `administrator`, `editor`, `viewer`.

The new user will be prompted to change their password on first login.

### Delete a user

```bash
curl -X POST https://YOUR_DOMAIN/db/delete_user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usertodelete"
  }'
```

### Reset a user's password

> Requires **Administrator** role.

```bash
curl -X POST https://YOUR_DOMAIN/reset_user_password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "targetuser",
    "new_password": "newtemporary"
  }'
```

Password requirements: minimum 8 characters. The user will be prompted to
change it on their next login.

## Role Permissions

| Capability | Administrator | Editor | Viewer |
|-----------|:---:|:---:|:---:|
| View records | Y | Y | Y |
| Search/filter | Y | Y | Y |
| Export CSV | Y | Y | Y |
| Export restricted fields | Y | - | - |
| Edit records | Y | Y | - |
| Upload CSV | Y | - | - |
| Manage users (API) | Y | - | - |
