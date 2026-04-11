# DevTrack — Setup Guide

Follow these steps to get your own instance of DevTrack running from scratch.

## 1. Supabase Backend Setup

1.  **Create a Project:** Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Run the Schema:**
    *   In your Supabase dashboard, go to the **SQL Editor**.
    *   Click **New Query**.
    *   Open the `sql/schema.sql` file from this repository.
    *   Copy and paste the entire content of `sql/schema.sql` into the Supabase SQL editor.
    *   Click **Run**.
    *   *Note: This file is idempotent (safe to run multiple times), so you can re-run it later to apply updates.*

## 2. Connect the Frontend

1.  **Get Credentials:**
    *   In Supabase, go to **Project Settings** > **API**.
    *   Copy the `Project URL` and the `anon` public key.
2.  **Configure `js/supabase.js`:**
    *   Open `js/supabase.js` in your editor.
    *   Replace the values of `SUPABASE_URL` and `SUPABASE_ANON` with your credentials:
    ```javascript
    const SUPABASE_URL  = 'https://your-project.supabase.co';
    const SUPABASE_ANON = 'your-anon-key';
    ```

## 3. Local Development

Since this is a vanilla JS project using ES Modules, you need to serve it via a local web server (opening `index.html` directly in the browser will fail due to CORS/Module restrictions).

**Option A: VS Code Live Server**
*   Install the "Live Server" extension.
*   Right-click `index.html` and select **Open with Live Server**.

**Option B: Python**
```bash
python -m http.server 8000
```

**Option C: Node.js (npx)**
```bash
npx serve .
```

## 4. Deployment (Vercel)

This project is designed to be hosted on Vercel as a static site.

1.  Push your code to a GitHub repository.
2.  Import the repository into Vercel.
3.  Vercel will automatically detect the project and deploy it. No build commands are required.

## 5. Future Updates

If you need to update the database schema later:
1.  Modify `sql/schema.sql` with your changes (using `IF NOT EXISTS` for safety).
2.  Re-run the script in the Supabase SQL Editor.
3.  Update your JS logic as needed.

## 6. Authentication

*   User signups are enabled by default.
*   The `on_auth_user_created` trigger in the SQL schema automatically creates a `profiles` entry for every new user.
*   Users can only see projects they created or joined via a 6-character **Join Code**.
