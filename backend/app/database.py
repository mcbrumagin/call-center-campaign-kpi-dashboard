import os
import aiosqlite
from contextlib import asynccontextmanager
from pathlib import Path

DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "/data/sqlite3.db"))


@asynccontextmanager
async def get_db():
    """Async context manager for database connections."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    # Enable foreign key support for cascading deletes
    await db.execute("PRAGMA foreign_keys = ON")
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    """Initialize database with schema if tables don't exist."""
    # Ensure directory exists
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    async with get_db() as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS agent (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS campaign (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS campaign_agent (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                campaign_id INTEGER NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES agent(id) ON DELETE CASCADE,
                FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE CASCADE,
                UNIQUE(agent_id, campaign_id)
            );
            
            CREATE TABLE IF NOT EXISTS campaign_kpi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                date DATE NOT NULL,
                hours REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE CASCADE,
                UNIQUE(campaign_id, date)
            );
            
            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_campaign_kpi_campaign_date 
                ON campaign_kpi(campaign_id, date);
            CREATE INDEX IF NOT EXISTS idx_campaign_agent_campaign 
                ON campaign_agent(campaign_id);
            CREATE INDEX IF NOT EXISTS idx_campaign_agent_agent 
                ON campaign_agent(agent_id);
        """)
        await db.commit()
        print("Database initialized successfully")
