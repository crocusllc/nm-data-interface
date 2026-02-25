# User Guide

## Login

1. Open `https://localhost` (or your configured domain) in a browser.
2. Enter your username and password.
3. On first login with a temporary password, you will be prompted to set a new
   password (minimum 8 characters).

## Roles

| Role | Capabilities |
|------|-------------|
| **Superadmin** | Full access; bootstrap account for creating the first admin |
| **Admin** | Upload CSV data, manage users, edit all records, export data (including restricted fields) |
| **Editor** | Edit records in editable categories, search, export |
| **Viewer** | Read-only access: search records and export (excluding restricted fields) |

## CSV Upload

> Requires the **Admin** role.

Navigate to the **Upload** page. Three upload types are supported:

1. **Student IHE Data** — enrollment data from the institution's Student
   Information System, provided by the IHE IT group.
2. **Clinical Placement Data** — clinical placement records provided by the
   Educator Preparation Program (EPP).
3. **Program and Student Info** — additional program-level and student-level
   data.

Each upload type has a corresponding CSV template available for download from
the Upload page (under `public/docs/`). Templates define the expected columns
and are generated from `config.yaml`.

### Upload process

1. Select the upload type.
2. Choose or drag-and-drop a `.csv` file.
3. The system validates columns and data types before importing.
4. On success, a summary shows the number of records created or updated.
5. On failure, validation errors are displayed. Fix the CSV and re-upload.

All uploads are logged with the uploading user, timestamp, and row count.

## Searching Records

From the home page:

- Use the search filters (Student ID, First Name, Last Name, Program Name,
  Academic Level, etc.) to narrow results.
- Filters persist in the URL, so you can bookmark or share a filtered view.
- Click a row to open the full student record.

## Editing Records

> Requires **Admin** or **Editor** role.

1. Open a student record from search results.
2. Editable fields (determined by the category's `editable` setting in
   `config.yaml`) are displayed as form inputs.
3. Make changes and click **Save**.
4. For categories marked `addable` (e.g., Clinical Placements), you can add
   new rows directly from the record page.

## Data Export

1. Navigate to the **Download** page.
2. Apply optional filters (placement type, dates, district, etc.).
3. Click **Export** to download a CSV file.
4. Columns included depend on your role — fields marked `Admin Only` are only
   included for Admin users.
