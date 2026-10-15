# Discord sign-in setup — Flight Atlas

Discord sign-in replaces the old email/password/code panel in Flight Atlas 6.0.74.

### 1. Discord Developer Portal
- Open https://discord.com/developers/applications and create/select the Flight Atlas application.
- Under OAuth2, add the redirect URL:
  `https://adtvscheowcmnogysars.supabase.co/auth/v1/callback`
- Copy the **Client ID** and **Client Secret**. Do not commit either secret to GitHub.

### 2. Supabase
- Open https://supabase.com/dashboard/project/adtvscheowcmnogysars/auth/providers
- Enable **Discord** and paste the Client ID and Client Secret from Discord.
- In Authentication → URL Configuration → Redirect URLs, add:
  `flightatlas://auth/callback`
- Keep your existing Site URL unchanged unless you have a specific reason to change it.
- In Supabase Auth Settings, confirm that OAuth signup is allowed.

### 3. Flight Atlas
- Open your pilot profile and click **Войти через Discord**.
- Complete authorization in the dedicated Discord window, then return to the app.
- Flight Atlas validates the access token with Supabase Auth and creates the local session. The unique pilot ID comes from the `atlas_profiles` table when the cloud schema is installed.

### Security
Discord OAuth Client Secret must exist only in Supabase's provider settings, never in Electron code.
The desktop client uses only a public Supabase publishable key.
For the **first admin**, run the admin bootstrap SQL from `CLOUD_SETUP.md` using the email attached to the Discord-authenticated account.
