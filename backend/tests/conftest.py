"""
Pytest configuration and shared fixtures for backend tests.
"""
import os
import pytest
import pytest_asyncio
from datetime import date, timedelta
from httpx import AsyncClient, ASGITransport
from pathlib import Path
import tempfile

# Set test database path before importing app modules
TEST_DB_PATH = Path(tempfile.gettempdir()) / "test_callcenter_kpi.db"
os.environ["DATABASE_PATH"] = str(TEST_DB_PATH)

from app.main import app
from app.database import get_db, init_db
from app.auth.jwt import create_access_token


@pytest.fixture(scope="session")
def anyio_backend():
    """Use asyncio as the async backend."""
    return "asyncio"


@pytest_asyncio.fixture(scope="function")
async def test_db():
    """
    Create a fresh test database for each test.
    Yields the database path, then cleans up after the test.
    """
    # Remove existing test db if present
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    
    # Initialize fresh database
    await init_db()
    
    # Seed test data
    await seed_test_data()
    
    yield TEST_DB_PATH
    
    # Cleanup
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


async def seed_test_data():
    """Seed the test database with predictable test data."""
    async with get_db() as db:
        # Create test campaigns
        await db.execute(
            "INSERT INTO campaign (id, name, description, is_active) VALUES (?, ?, ?, ?)",
            (1, "Test Campaign", "A test campaign for unit tests", True),
        )
        await db.execute(
            "INSERT INTO campaign (id, name, description, is_active) VALUES (?, ?, ?, ?)",
            (2, "Inactive Campaign", "An inactive test campaign", False),
        )
        
        # Create test agents
        await db.execute(
            "INSERT INTO agent (id, first_name, last_name, email, is_active) VALUES (?, ?, ?, ?, ?)",
            (1, "John", "Doe", "john.doe@test.com", True),
        )
        await db.execute(
            "INSERT INTO agent (id, first_name, last_name, email, is_active) VALUES (?, ?, ?, ?, ?)",
            (2, "Jane", "Smith", "jane.smith@test.com", True),
        )
        
        # Assign agents to campaign
        await db.execute(
            "INSERT INTO campaign_agent (agent_id, campaign_id) VALUES (?, ?)",
            (1, 1),
        )
        await db.execute(
            "INSERT INTO campaign_agent (agent_id, campaign_id) VALUES (?, ?)",
            (2, 1),
        )
        
        # Create KPI data for the test campaign
        # Use dates relative to today for predictable test results
        today = date.today()
        
        # Create a week of KPI data with known badge levels
        test_kpi_data = [
            # Platinum day (240+ hours)
            (1, (today - timedelta(days=6)).isoformat(), 250.0),
            # Gold day (180-239 hours)
            (1, (today - timedelta(days=5)).isoformat(), 200.0),
            # Silver day (120-179 hours)
            (1, (today - timedelta(days=4)).isoformat(), 150.0),
            # Bronze day (60-119 hours)
            (1, (today - timedelta(days=3)).isoformat(), 80.0),
            # No badge day (< 60 hours)
            (1, (today - timedelta(days=2)).isoformat(), 30.0),
            # Another gold day
            (1, (today - timedelta(days=1)).isoformat(), 190.0),
            # Today - silver
            (1, today.isoformat(), 140.0),
        ]
        
        for campaign_id, kpi_date, hours in test_kpi_data:
            await db.execute(
                "INSERT INTO campaign_kpi (campaign_id, date, hours) VALUES (?, ?, ?)",
                (campaign_id, kpi_date, hours),
            )
        
        await db.commit()


@pytest_asyncio.fixture
async def client(test_db):
    """
    Create an async HTTP client for testing API endpoints.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_token():
    """
    Create a valid JWT token for authenticated requests.
    """
    token = create_access_token(
        data={"sub": "admin", "role": "admin"},
        expires_delta=timedelta(minutes=30),
    )
    return token


@pytest.fixture
def auth_headers(auth_token):
    """
    Return headers with Bearer token for authenticated requests.
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def test_dates():
    """
    Return commonly used test dates.
    """
    today = date.today()
    return {
        "today": today,
        "yesterday": today - timedelta(days=1),
        "week_ago": today - timedelta(days=7),
        "month_ago": today - timedelta(days=30),
        "start_of_test_data": today - timedelta(days=6),
    }
