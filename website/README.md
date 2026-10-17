# Flight Atlas Website

Production Cloudflare Pages project: **flight-atlas-online**.
Public temporary address: **https://flight-atlas-online.pages.dev/**
Desired custom domain: **flight-atlas-online.com** (must first be registered; not currently active).

The static landing page is deployed from `website/` in this public repository. The private desktop development source remains in `NUROFENE/Flight-Atlas`.

Cloudflare Pages build settings:
- Branch: `main`
- Build command: `exit 0`
- Build output directory: `website`
- Repository root directory: `/`
- Watch paths: `website/**`

Cloudflare's Git integration to the *private* desktop source repository did not have access, so this public deployment repository is used instead.

The page uses GitHub Releases API to fetch the newest official Windows installer from `NUROFENE/Flight-Atlas-Releases`. `/download` redirects to the latest release page.

After registering the domain in Cloudflare Registrar, bind it via Workers & Pages → flight-atlas-online → Custom domains. No domain has been purchased by this setup.
