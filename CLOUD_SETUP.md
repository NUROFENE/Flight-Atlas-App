# Flight Atlas 6.0.70 — cloud setup

The Windows release workflow builds on pushes to `main` and publishes the installer and `latest.yml` to GitHub Releases. Its success still must be verified in GitHub Actions before announcing an update.

## Supabase activation (required once)

1. Go to your existing Supabase project `adtvscheowcmnogysars` → SQL Editor.
2. Paste and run [flight_atlas_cloud.sql](supabase/flight_atlas_cloud.sql). This creates unique pilot IDs, secured profiles, admin-only mods/flights, public published catalog, image bucket, flight history, and server-side admin-role management.
3. Create/confirm your own account in Flight Atlas. In SQL Editor, run this command with **your real account email**:

```sql
update public.atlas_profiles
set role = 'admin'
where id = (select id from auth.users where email = 'REPLACE_WITH_YOUR_EMAIL');
```

4. Reopen Flight Atlas. Your profile shows your unique `FA-000001`-style ID and an Admin button. The admin area can add/replace bundled mods and flights, upload images, assign admin roles by pilot ID, and publish to users.
5. Other clients load published entries from Supabase at startup. The desktop installer is **not** required for subsequent changes to catalog content. Unpublished drafts are visible only to admins.

## Important limits

- Only the SQL Editor bootstrap should grant the *first* administrator. Afterwards, role updates are validated by the `atlas_set_role` database function.
- Do **not** put Supabase secret/service-role tokens in Electron, GitHub, or the README.
- VATSIM Radar is an externally hosted website in an iframe. Navigraph authentication in a separate system browser is not automatically shared with the embedded frame. Supporting that seamlessly would require an authorized OAuth/SSO integration from the provider.
- The leaderboard reads cloud-synced completed flights. For a trusted competitive leaderboard, add server-side telemetry verification / anti-cheat. The current history originates from the client, so it is not tamper-proof.
- The current leaderboard loads limited rows (10,000 flights and 5,000 profiles). For significant growth, replace this with paginated server views or RPC-based aggregates.
