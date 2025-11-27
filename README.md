# Participium

Civic reporting platform for the city of Turin, enabling citizens to report urban issues and allowing municipal officers to review and manage them.

The application also supports report submissions via a Telegram bot: https://t.me/participium_g16_bot

## Project Structure
- `api/`: OpenAPI specification (swagger)
- `client/`: Frontend - React + TypeScript + Vite
- `server/`: Backend - Node.js + TypeScript + Express + SQLite

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Setup Instructions

### Installation via Docker

Ensure that Docker is running in background, then open the project folder and run:

```powershell
docker-compose up --build
```

### 3. Running the Application

To start the application, run:
```powershell
docker-compose up -d
```

Client, server, redis and the Telegram Bot will start automatically:

- Server will run on `http://localhost:5000`
- Client will run on `http://localhost:5173`

To stop the application, run:

```powershell
docker-compose down
```

## User Roles

- **Citizen**: Can submit reports, view all approved reports on the map
- **Municipal Public Relations Officer**: Can review pending reports, assign them to Technical Officers or reject them with reasons
- **Technical Officer**: Can view assigned reports and change their status
- **Municipal Administrator**: Can create officers and assign them to offices

## Features

### For Citizens
- **Report Visualization**
  - Interactive map showing all approved civic reports
  - Reports grouped in clusters, showing more details when zooming
- **Report Submission**
  - Select location directly on the map
  - Submit new reports with photos (up to 3 images)
  - Categorize reports (infrastructure, environment, safety, sanitation, transport, other)
  - Submissions available also via Telegram bot: https://t.me/participium_g16_bot

### For Public Relations Officers
- **Report Review**
  - Dashboard to review pending reports
  - View report details including photos, location, and description
  - Reject reports with mandatory rejection reasons, or assign them to technical officer
  - View reports on map from review interface

### For Technical Officers
- **Report Update**
  - Dashboard to view assigned reports
  - Update report status
  - View report details including photos, location, and description
  - View reports on map from review interface

### For Admin
- **Officer Creation**
  - Dashboard to configure officer account

## Implemented Office Types
The offices included in the application are the following:

- Infrastructure
- Environment
- Safety
- Sanitation
- Transport
- Organization
- Other

## Implemented User Stories
- PT01: Citizen registration
- PT02: Setup municipality users
- PT03: Roles Assignment
- PT04: Location selection on Map
- PT05: Report details
- PT06: Approve/Deny reports
- PT07: Report visualization on Map
- PT08/PT10: Report list for municipality users
- PT09: Account Configuration
- PT11: Update Report Status
- PT12: Create Report via Telegram

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
- Redis for session token handling

## License
See LICENSE file for details
