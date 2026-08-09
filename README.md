# CivicConnect Bhagalpur V7 — Online Backend Version

V7 moves complaint data from browser localStorage to a server-side JSON database.

## Run on your PC

1. Install Node.js (LTS).
2. Extract this folder.
3. Open a terminal inside the folder.
4. Run:
   npm install
5. Run:
   npm start
6. Open:
   http://localhost:3000

Admin PIN for local testing:
Admin PIN is configured through environment variables.

## Test multi-device behavior

To use this from another device on the SAME Wi-Fi, run the server on the PC and open:
http://YOUR-PC-IP:3000

Example:
http://192.168.1.5:3000

The second device must be able to reach the PC through the network/firewall.

## Important



For a public website, deploy the server to a hosting service, use a real database (PostgreSQL/Supabase/etc.), HTTPS, secure password hashing, proper authentication, rate limiting, validation and backups.

Existing V1-V6 localStorage complaints are NOT automatically imported into V7.
