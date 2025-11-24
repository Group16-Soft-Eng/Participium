# Participium

Civic reporting platform for the city of Turin, enabling citizens to report urban issues and allowing municipal officers to review and manage them.

## Project Structure
- `api/`: OpenAPI specification (swagger)
- `client/`: Frontend - React + TypeScript + Vite
- `server/`: Backend - Node.js + TypeScript + Express + SQLite

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

#### Server
```bash
cd server
npm install
```

#### Client
```bash
cd client
npm install
```

### 2. Database Setup

The database will be automatically created when you first start the server. To populate it with sample data:

#### Seed the Database with Sample Reports
```bash
# From the project root directory
./seedDatabase.sh
```

This script will:
- Clear any existing reports
- Create 85 sample reports across all categories (infrastructure, environment, safety, sanitation, transport, other)
- Assign reports to existing users with random anonymity flags
- Set mixed states (PENDING and APPROVED) for testing

**Note:** Make sure you have at least one user in the database before running the seed script. You can create users through the registration interface or by running the server utilities.

### 3. Running the Application

#### Start the Backend Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

#### Start the Frontend Client
```bash
cd client
sudo systemctl start redis-server && sudo systemctl enable redis-server && sudo systemctl status redis-server
```
Client will run on `http://localhost:5173`

### Starting the Redis Server
```bash
cd server
npm run redis
```

### Starting the Telegram Bot
```bash
cd telegram
python3 bot_config.py
```
## Database Management

### Creating Test Users
```bash
cd server
npx ts-node src/utils/createTestUser.ts
```

### Creating Officers
```bash
cd server
npx ts-node src/utils/createOfficer.ts
```

### Clearing All Reports
```bash
cd server
npx ts-node src/utils/clearReports.ts
```

## User Roles

- **Citizen**: Can submit reports, view all approved reports on the map
- **Officer**: Can review pending reports, approve or reject them with reasons
- **Municipal Administrator**: Full system access

## Features

### For Citizens
- Interactive map showing all approved civic reports
- Submit new reports with photos (up to 3 images)
- Select location directly on the map
- Categorize reports (infrastructure, environment, safety, sanitation, transport, other)
- Anonymous or attributed reporting

### For Officers
- Dashboard to review pending reports
- View report details including photos, location, and description
- Approve or reject reports with mandatory rejection reasons
- View reports on map from review interface

## Sprint 1 - User Stories
- PT01: Citizen registration
- PT02: Setup municipality users
- PT03: Roles Assignment
- PT04: Location selection on Map
- PT05: Report details
- PT06: Approve/Deny reports
- PT07: Report visualization on Map
- PT08: Report list for municipality users

## Technologies

### Frontend
- React 18 with TypeScript
- Material-UI for components
- Leaflet for interactive maps
- Supercluster for map marker clustering
- Vite for build tooling

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- Multer for file uploads
- JWT for authentication

## Docker (Development)

Quick instructions to run the backend and Redis via Docker Compose (creates persistent folders `server/uploads` and `server/data`):

```powershell
# from project root
docker-compose up --build

# stop
docker-compose down
```

Notes:
- The compose file defines a `redis` service and a `server` service built from `./server`
- The server uses SQLite by default; the DB file is mounted to `./server/participium.db`.
- Uploaded files are stored under `./server/uploads` on the host
- Environment variables (JWT secret, DB type/name, Redis host) can be overridden in your shell or by adapting `docker-compose.yml`
- Aggiunto il tsconfig.build.json chiamato solo da CI/Docker, in questo modo con npm run dev il percorso "./src" rimane così, ma co docker sarà "."

## License
See LICENSE file for details
