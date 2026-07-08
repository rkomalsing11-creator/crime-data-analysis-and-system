# Setup — Crime Reporting & Analysis System

## First run after cloning or unzipping

1. **Make the script executable (macOS/Linux, every fresh clone/zip):**
   ```bash
   chmod +x start.sh
   ```
   Without this: "Permission denied". GitHub's "Download ZIP" and most zip
   tools drop the executable bit — this isn't a one-time fix, it happens
   again on every fresh copy.

2. **If you see `bad interpreter: /bin/bash^M`:**
   The file picked up Windows line endings (CRLF). Fix with:
   ```bash
   sed -i '' -e 's/\r$//' start.sh   # macOS
   sed -i 's/\r$//' start.sh         # Linux
   ```

3. **Run it:**
   - macOS/Linux: `./start.sh` (or `./start.sh --no-browser`)
   - Windows without Git Bash/WSL: `node start.js`

The script handles everything else: `npm install` in both `client/` and
`server/` if missing, creates `server/.env` and `uploads/` if missing, waits
for both servers to actually respond before opening the browser, and shuts
both down cleanly on Ctrl+C — so the next run never collides with a
leftover process still holding port 5001 or 3000.

## Not committed to git — recreated automatically on first run

- `client/node_modules/`, `server/node_modules/`
- `server/.env` — recreated with a default `PORT=5001` if
  `server/.env.example` isn't present. If the backend needs more than
  `PORT` (DB path, JWT secret, etc.), keep a `server/.env.example` in git
  with those keys blank so this step produces a working file, not just a
  port number.
- `uploads/`

## Sending this project to someone else (zip / submission)

Delete `node_modules` in `client/` and `server/` before zipping — it's large
and gets reinstalled anyway. Keep `server/.env.example` (not `.env`) in the
zip so their script can generate a working `.env` on their machine.
