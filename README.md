# Jusivo Case Manager Version 1.0

This app uses a backend abstraction that currently runs on Firebase for auth, database, and storage.
Frontend is React + Vite and is deployed to Firebase Hosting via GitHub Actions.

## Documentation

📋 **[Feature Specification](FEATURE_SPECIFICATION.md)** - Comprehensive documentation of all app features including client management, matter management, billing, document generation, calendar, deadlines, intake forms, and client portal.

## Getting Started

To run the devserver:

```bash
npm install
npm run dev
```

## Firebase MCP server (Model Context Protocol)

To enable MCP access to Firebase from compatible clients:

1. Install dependencies (dev):
   ```bash
   npm install -D @gannonh/firebase-mcp dotenv-cli
   ```

2. Create an environment file `.env.firebase` (do not commit secrets):
   ```ini
   SERVICE_ACCOUNT_KEY_PATH=/absolute/path/to/serviceAccountKey.json
   FIREBASE_STORAGE_BUCKET=jusivo.appspot.com
   ```

3. Add the run script to `package.json`:
   ```json
   {
     "scripts": {
       "mcp:firebase": "dotenv -e .env.firebase npx -y @gannonh/firebase-mcp"
     }
   }
   ```

4. Run the MCP server:
   ```bash
   npm run mcp:firebase
   ```

5. Example MCP client configuration (e.g., Claude Desktop):
   ```json
   {
     "mcpServers": {
       "firebase": {
         "command": "npx",
         "args": ["-y", "@gannonh/firebase-mcp"],
         "env": {
           "SERVICE_ACCOUNT_KEY_PATH": "/absolute/path/to/serviceAccountKey.json",
           "FIREBASE_STORAGE_BUCKET": "jusivo.appspot.com"
         }
       }
     }
   }
   ```
