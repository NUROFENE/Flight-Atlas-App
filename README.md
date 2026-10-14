# Flight Atlas v6 — independent Windows desktop build

This project carries over the Flight Atlas v5.3 UI, route database, mods, and charts to Electron.
It DOES NOT open a browser or start an HTTP server / localhost port. Electron renders
`atlas://flightatlas/` inside its own window; a privileged application protocol serves the bundled assets
and mediates SimBrief, AviationWeather and PortalPasha requests. Internet is needed for online data.

## Build an actual Windows installer (.exe)
1. Create a new GitHub repository (e.g. `flight-atlas`) and upload **all contents** of this folder.
2. Open **Actions → Windows release → Run workflow**. Download `Flight-Atlas-Windows-Installer`
   from the run's Artifacts. It contains a Windows installer EXE, not a launcher for PowerShell.
3. To release the *first update*, bump `version` in `package.json` (e.g. `6.0.1`), commit, then
   create and push tag `v6.0.1`. Workflow publishes EXE and `latest.yml` through GitHub Releases.
4. Future installed builds can check/download/install that published version using **Update**.

Do not rename/move the repository without planning updater migration. The owner/repo coordinates are injected by the workflow at build time. `npm install` can take several minutes.
**For production public distribution** sign the Windows binaries with a trusted code-signing certificate and keep signing configuration secure. Without this Windows SmartScreen may show warnings. Verify actual update/install round-trip on Windows before treating updates as tested.

## Offline limitations / compatibility
- The source is ready to build. This ZIP does *not* contain the Electron runtime, so it is not itself an installer.
- Dynamic weather, charts and SimBrief require external services.
- Volanta launch is best-effort from well-known paths; it does not silently create a flight in Volanta.
- Flight history, profile, and settings use a distinct persistent `atlas://flightatlas` origin. Old profile saved under `http://127.0.0.1:<port>` will not automatically migrate. **Back up old data before uninstalling old builds.**
- Only use/add chart data with appropriate rights. Flight Atlas does not include the remote charts in its distribution.
- The existing UI may fetch third-party JS/CSS (e.g. map and PDF components), so some features still require internet.

## Local development
On a computer with Node.js and internet access:
```
npm install
npm start
```
A Windows installer can be built with `npm run pack` on Windows.
