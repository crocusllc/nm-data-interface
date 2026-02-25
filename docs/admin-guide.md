# Admin Guide

## Default Accounts and Bootstrap

On a fresh install, one built-in account exists:

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `changeme` | superadmin |

**First steps after deployment:**

1. Log in as `superadmin`.
2. Change the default password immediately.
3. Create an admin account for day-to-day use.
4. Optionally create editor and viewer accounts.

## User Management via UI

Admins can manage users from the **Admin** page (`/admin`):

- View existing users
- Create new users
- Delete users
- Reset passwords

## User Management via curl

For scripting or headless environments, users can be managed through the API.

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

Valid roles: `admin`, `editor`, `viewer`.

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

> Requires **Admin** role.

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

| Capability | Superadmin | Admin | Editor | Viewer |
|-----------|:---:|:---:|:---:|:---:|
| View records | Y | Y | Y | Y |
| Search/filter | Y | Y | Y | Y |
| Export CSV | Y | Y | Y | Y |
| Export restricted fields | Y | Y | - | - |
| Edit records | Y | Y | Y | - |
| Upload CSV | Y | Y | - | - |
| Manage users | Y | Y | - | - |
| Bootstrap (first admin) | Y | - | - | - |
