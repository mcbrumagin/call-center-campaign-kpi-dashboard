"""
Seed data script for development and testing.
Run with: python -m app.seed_data
"""
import asyncio
import random
from datetime import date, timedelta

from app.database import init_db, get_db


async def seed_database():
    """Seed the database with sample data."""
    await init_db()
    
    async with get_db() as db:
        # Check if data already exists
        cursor = await db.execute("SELECT COUNT(*) as count FROM agent")
        row = await cursor.fetchone()
        if row["count"] > 0:
            print("Database already has data, skipping seed")
            return
        
        # Create sample agents
        agents = [
            ("John", "Smith", "john.smith@example.com"),
            ("Jane", "Doe", "jane.doe@example.com"),
            ("Michael", "Johnson", "michael.johnson@example.com"),
            ("Emily", "Williams", "emily.williams@example.com"),
            ("David", "Brown", "david.brown@example.com"),
            ("Sarah", "Davis", "sarah.davis@example.com"),
            ("Chris", "Miller", "chris.miller@example.com"),
            ("Amanda", "Wilson", "amanda.wilson@example.com"),
            ("James", "Moore", "james.moore@example.com"),
            ("Jennifer", "Taylor", "jennifer.taylor@example.com"),
        ]
        
        for first_name, last_name, email in agents:
            await db.execute(
                """
                INSERT INTO agent (first_name, last_name, email, is_active)
                VALUES (?, ?, ?, 1)
                """,
                (first_name, last_name, email),
            )
        
        # Create sample campaigns
        campaigns = [
            ("Customer Support Q1", "Q1 2026 customer support campaign"),
            ("Sales Outreach", "Outbound sales campaign for new products"),
            ("Technical Support", "24/7 technical support hotline"),
            ("Billing Inquiries", "Handle billing and payment questions"),
            ("Product Feedback", "Collect customer feedback on products"),
        ]
        
        for name, description in campaigns:
            await db.execute(
                """
                INSERT INTO campaign (name, description, is_active)
                VALUES (?, ?, 1)
                """,
                (name, description),
            )
        
        # Assign agents to campaigns (random assignments)
        cursor = await db.execute("SELECT id FROM agent")
        agent_ids = [row["id"] for row in await cursor.fetchall()]
        
        cursor = await db.execute("SELECT id FROM campaign")
        campaign_ids = [row["id"] for row in await cursor.fetchall()]
        
        for agent_id in agent_ids:
            # Assign each agent to 1-3 random campaigns
            num_campaigns = random.randint(1, 3)
            assigned_campaigns = random.sample(campaign_ids, num_campaigns)
            for campaign_id in assigned_campaigns:
                try:
                    await db.execute(
                        """
                        INSERT INTO campaign_agent (agent_id, campaign_id)
                        VALUES (?, ?)
                        """,
                        (agent_id, campaign_id),
                    )
                except Exception:
                    pass  # Skip duplicates
        
        # Generate KPI data for the last 60 days
        today = date.today()
        for campaign_id in campaign_ids:
            for days_ago in range(60):
                kpi_date = today - timedelta(days=days_ago)
                # Skip weekends for more realistic data
                if kpi_date.weekday() >= 5:
                    continue
                
                # Generate random hours (0-300 range to cover all badge tiers)
                # Weighted towards middle values
                base_hours = random.gauss(150, 50)
                hours = max(0, min(300, base_hours))
                
                await db.execute(
                    """
                    INSERT INTO campaign_kpi (campaign_id, date, hours)
                    VALUES (?, ?, ?)
                    """,
                    (campaign_id, kpi_date.isoformat(), round(hours, 1)),
                )
        
        await db.commit()
        print("Database seeded successfully!")
        print(f"  - {len(agents)} agents created")
        print(f"  - {len(campaigns)} campaigns created")
        print("  - KPI data generated for the last 60 days")


if __name__ == "__main__":
    asyncio.run(seed_database())
