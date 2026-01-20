# ShyftOff Call Center KPI Dashboard

A multi-container application for managing call center agents, campaigns, and tracking KPIs with a gamified badge system.

## Architecture

- **Frontend**: Next.js 16 with React 19, TypeScript, TailwindCSS
- **Backend**: Python 3.13 with FastAPI, async SQLite
- **Database**: SQLite (file-based, persistent via Docker volume)

## Features

### Admin Dashboard
- JWT-based authentication
- Agent management (CRUD operations)
- Campaign management (CRUD operations)
- Agent-Campaign assignment management
- Responsive design with mobile support

### Customer Dashboard
- Public campaign KPI viewing
- Interactive charts with Recharts
- Hours worked per day/week/month grouping
- Animated badge system (Platinum/Gold/Silver/Bronze)
- Progress tracking to next badge tier

## Badge System

| Badge | Hours Required |
|-------|---------------|
| Platinum | 240+ hours/day |
| Gold | 180+ hours/day |
| Silver | 120+ hours/day |
| Bronze | 60+ hours/day |

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory:
   ```bash
   cd callcenter-kpi
   ```

2. Create the data directory:
   ```bash
   mkdir -p data
   ```

3. Build and start the containers:
   ```bash
   docker compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. Default admin credentials:
   - Username: `admin`
   - Password: `admin123`

### Local Development

#### Backend

```bash
cd backend
pip install -r requirements.txt
DATABASE_PATH=../data/sqlite3.db uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
pnpm install
NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Agents (Admin only)
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get agent details
- `PATCH /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/agents/{id}/campaigns` - Assign campaigns
- `DELETE /api/agents/{id}/campaigns/{campaign_id}` - Remove campaign

### Campaigns
- `GET /api/campaigns` - List campaigns (public)
- `POST /api/campaigns` - Create campaign (admin)
- `GET /api/campaigns/{id}` - Get campaign details (public)
- `PATCH /api/campaigns/{id}` - Update campaign (admin)
- `DELETE /api/campaigns/{id}` - Delete campaign (admin)
- `POST /api/campaigns/{id}/agents` - Assign agents (admin)
- `DELETE /api/campaigns/{id}/agents/{agent_id}` - Remove agent (admin)

### KPIs (Public)
- `GET /api/kpis/campaigns/{id}` - Get campaign KPIs
- `GET /api/kpis/campaigns/{id}/badge` - Get daily badge info
- `GET /api/kpis/badge-thresholds` - Get badge threshold info

## Database Schema

```sql
-- Agents table
CREATE TABLE agent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE campaign (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agent-Campaign assignments
CREATE TABLE campaign_agent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    campaign_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agent(id),
    FOREIGN KEY (campaign_id) REFERENCES campaign(id),
    UNIQUE(agent_id, campaign_id)
);

-- Campaign KPIs
CREATE TABLE campaign_kpi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    date DATE NOT NULL,
    hours REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (campaign_id) REFERENCES campaign(id)
);
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to SQLite database file | `/data/sqlite3.db` |
| `JWT_SECRET_KEY` | Secret key for JWT signing | (required) |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin123` |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `SESSION_SECRET` | Session encryption key | (required) |

## Production Deployment

1. Update environment variables with secure values:
   - Generate strong `JWT_SECRET_KEY` and `SESSION_SECRET`
   - Change `ADMIN_PASSWORD` to a secure password

2. Update `NEXT_PUBLIC_API_URL` to your production backend URL

3. Consider using a reverse proxy (nginx) for SSL termination

4. For production SQLite, ensure proper file permissions and backup strategy

## License

MIT
