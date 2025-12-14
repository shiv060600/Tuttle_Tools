# Tuttle Customer Mapping

Internal tool for managing customer mappings between SL Numbers, HQ Numbers, and Sage Account Numbers.

## Architecture

```
┌─────────────────┐       HTTP        ┌─────────────────┐       ODBC        ┌─────────────────┐
│    Frontend     │  ─────────────►   │    Backend      │  ─────────────►   │   SQL Server    │
│   (Vite/React)  │   localhost:3000  │   (Express)     │                   │   Database      │
│                 │   calls :3001     │   localhost:3001│                   │                 │
└─────────────────┘                   └─────────────────┘                   └─────────────────┘
```

- **Frontend**: React + Vite (port 3000)
- **Backend**: Express.js with ODBC (port 3001)
- **Database**: SQL Server via ODBC Driver 18

---

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **ODBC Driver 18 for SQL Server** installed on the machine
3. **SQL Server** access to `IPS` and `TUTLIV` databases

### Verify ODBC Driver Installation

Open PowerShell and run:
```powershell
Get-OdbcDriver | Where-Object {$_.Name -like "*SQL Server*"}
```

You should see `ODBC Driver 18 for SQL Server` in the list.

---

## Setup

### 1. Install Dependencies

From the project root (`H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping`):

```powershell
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (or your preferred location):

```env
SSMS_CONN_STRING=Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER_NAME;Database=IPS;Trusted_Connection=yes;TrustServerCertificate=yes;
PORT=3001
```

**Connection String Options:**

| Parameter | Description |
|-----------|-------------|
| `Driver` | ODBC Driver 18 for SQL Server |
| `Server` | Your SQL Server hostname/IP |
| `Database` | Default database (IPS) |
| `Trusted_Connection=yes` | Use Windows Authentication |
| `TrustServerCertificate=yes` | Skip certificate validation (for self-signed certs) |

**If using SQL Server Authentication instead:**
```env
SSMS_CONN_STRING=Driver={ODBC Driver 18 for SQL Server};Server=YOUR_SERVER;Database=IPS;Uid=username;Pwd=password;TrustServerCertificate=yes;
```

### 3. Custom .env Location (Optional)

If your `.env` file is in a different location, edit `server/index.js` line 4:

```javascript
require('dotenv').config({ path: 'H:/your/custom/path/.env' });
```

---

## Running the Application

### Manual Start

You need **two separate terminals** (or PowerShell windows):

#### Terminal 1 - Start Backend Server

```powershell
cd H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping
npm run server
```

Expected output:
```
Server running on http://localhost:3001
```

#### Terminal 2 - Start Frontend

```powershell
cd H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping
npm run dev
```

Expected output:
```
VITE v6.x.x ready in xxx ms
➜ Local: http://localhost:3000/
```

### Access the Application

Open a browser and navigate to: **http://localhost:3000**

---

## Task Scheduler Setup

To run the servers automatically on system startup:

### Backend Server Task

1. Open **Task Scheduler** (`taskschd.msc`)
2. Create a new **Basic Task**
3. Configure:
   - **Name**: `Tuttle Customer Mapping - Backend`
   - **Trigger**: At startup (or your preferred schedule)
   - **Action**: Start a program
   - **Program/script**: `node`
   - **Arguments**: `server/index.js`
   - **Start in**: `H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping`

Or use PowerShell as the program:
- **Program/script**: `powershell.exe`
- **Arguments**: `-NoExit -Command "cd H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping; npm run server"`

### Frontend Task

- **Program/script**: `powershell.exe`
- **Arguments**: `-NoExit -Command "cd H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping; npm run dev"`

### Batch File Alternative

Create `start-servers.bat` in the project root:

```batch
@echo off
echo Starting Tuttle Customer Mapping servers...

:: Start backend in a new window
start "Backend Server" cmd /k "cd /d H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping && npm run server"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak

:: Start frontend in a new window
start "Frontend Server" cmd /k "cd /d H:\INTERNAL_TOOLS\Tuttle_Customer_Mapping && npm run dev"

echo Servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
```

---

## API Endpoints

The backend exposes these REST endpoints:

### Customer Mappings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mappings` | Get all customer mappings |
| `POST` | `/api/mappings` | Create a new mapping |
| `PUT` | `/api/mappings/:rowNum` | Update a mapping by row number |
| `DELETE` | `/api/mappings/:rowNum` | Delete a mapping by row number |

### Activity Logging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logging` | Get all log entries |
| `POST` | `/api/logging` | Log an action (insert/edit) |
| `DELETE` | `/api/logging/id/:logId` | Delete a specific log entry |
| `DELETE` | `/api/logging/:days` | Delete logs older than N days |

### Time Restriction

**Changes (POST, PUT, DELETE) are blocked between 6:00 AM - 8:00 AM** to prevent conflicts during business processing hours.

---

## Database Tables

The application queries:

- `IPS.dbo.crossref` - Main customer mapping table
- `IPS.dbo.TuttleMappingLogger` - Activity log (insert/edit actions)
- `TUTLIV.dbo.ARCUS` - Sage customer master (for customer names)

### Crossref Table Columns

| Column | Description |
|--------|-------------|
| `RowNumber` | Auto-generated primary key |
| `Billto` | SL Bill-To number |
| `Shipto` | SL Ship-To number (nullable) |
| `HQ` | HQ Number |
| `Ssacct` | Sage Account Number |

### TuttleMappingLogger Table Columns

| Column | Description |
|--------|-------------|
| `LOG_ID` | UUID primary key (auto-generated) |
| `ACTION` | Action type: `insert` or `edit` or `delete`|
| `ROWNUM` | Reference to crossref RowNumber (nullable) |
| `BILLTO_FROM` | Original Bill-To value (for edits) |
| `BILLTO_TO` | New Bill-To value |
| `SHIPTO_FROM` | Original Ship-To value (for edits) |
| `SHIPTO_TO` | New Ship-To value |
| `HQ_FROM` | Original HQ value (for edits) |
| `HQ_TO` | New HQ value |
| `SSACCT_FROM` | Original Sage Account (for edits) |
| `SSACCT_TO` | New Sage Account value |
| `ACTION_TIMESTAMP` | When the action occurred (UTC) |

---

## Troubleshooting

### "MODULE_NOT_FOUND" Error

Run `npm install` to ensure all dependencies are installed:
```powershell
npm install
```

### ODBC Connection Errors

1. Verify ODBC Driver 18 is installed
2. Check your connection string in `.env`
3. Ensure the server name is correct
4. Test with Windows ODBC Data Source Administrator (`odbcad32.exe`)

### Frontend Can't Connect to Backend

1. Make sure backend is running on port 3001
2. Check for CORS errors in browser console
3. Verify `VITE_API_URL` if using a custom API URL

### Port Already in Use

If port 3000 or 3001 is in use:
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process by PID
taskkill /PID <PID> /F
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server (Vite) |
| `npm run server` | Start backend API server (Express) |
| `npm run build` | Build frontend for production |
| `npm install` | Install all dependencies |

---

## File Structure

```
Tuttle_Customer_Mapping/
├── server/
│   └── index.js          # Express backend with ODBC
├── src/
│   ├── components/       # React components
│   ├── hooks/            # React Query hooks (API calls)
│   ├── types/            # TypeScript types
│   └── App.tsx           # Main React app
├── .env                  # Environment variables (create this)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```
