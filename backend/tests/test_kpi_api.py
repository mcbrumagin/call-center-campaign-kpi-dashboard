"""
API integration tests for KPI endpoints.

These tests verify the KPI-related API endpoints return correct
data structures and handle error cases properly.
"""
import pytest
from datetime import date, timedelta


class TestGetCampaignKPIs:
    """Tests for GET /api/kpis/campaigns/{campaign_id}"""

    @pytest.mark.asyncio
    async def test_returns_404_for_nonexistent_campaign(self, client):
        """Should return 404 for a campaign that doesn't exist."""
        response = await client.get("/api/kpis/campaigns/9999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_returns_400_when_start_after_end(self, client):
        """Should return 400 when start_date is after end_date."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": "2025-01-15",
                "end_date": "2025-01-01",
            },
        )
        assert response.status_code == 400
        assert "start_date" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_returns_correct_structure_daily(self, client, test_dates):
        """Should return correct data structure with daily grouping."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
                "group_by": "day",
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Check top-level structure
        assert "campaign" in data
        assert "period" in data
        assert "data" in data
        assert "summary" in data

        # Check campaign info
        assert data["campaign"]["id"] == 1
        assert data["campaign"]["name"] == "Test Campaign"

        # Check period info
        assert data["period"]["group_by"] == "day"

        # Check summary
        assert "total_hours" in data["summary"]
        assert "average_daily_hours" in data["summary"]
        assert "days_with_data" in data["summary"]

        # Check data points have required fields
        assert len(data["data"]) > 0
        for point in data["data"]:
            assert "date" in point
            assert "hours" in point
            assert "badge" in point
            assert "days_in_period" in point
            assert "is_complete" in point

    @pytest.mark.asyncio
    async def test_returns_correct_structure_weekly(self, client, test_dates):
        """Should return correct data structure with weekly grouping."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
                "group_by": "week",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["period"]["group_by"] == "week"
        # Weekly grouping should have fewer or equal data points than daily
        assert len(data["data"]) >= 1

    @pytest.mark.asyncio
    async def test_returns_correct_structure_monthly(self, client, test_dates):
        """Should return correct data structure with monthly grouping."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
                "group_by": "month",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert data["period"]["group_by"] == "month"

    @pytest.mark.asyncio
    async def test_daily_grouping_marks_complete(self, client, test_dates):
        """Daily data points should be marked as complete."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
                "group_by": "day",
            },
        )
        assert response.status_code == 200
        data = response.json()

        # All daily data points should be complete (1 day = 1 day)
        for point in data["data"]:
            assert point["is_complete"] is True
            assert point["days_in_period"] == 1

    @pytest.mark.asyncio
    async def test_calculates_badge_from_average_daily_hours(self, client, test_dates):
        """Badge should be calculated from average daily hours in period."""
        response = await client.get(
            "/api/kpis/campaigns/1",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
                "group_by": "day",
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Find the platinum day (250 hours)
        platinum_days = [p for p in data["data"] if p["badge"] == "platinum"]
        assert len(platinum_days) >= 1

        # Find the no-badge day (30 hours)
        no_badge_days = [p for p in data["data"] if p["badge"] is None]
        assert len(no_badge_days) >= 1


class TestGetDailyBadge:
    """Tests for GET /api/kpis/campaigns/{campaign_id}/badge"""

    @pytest.mark.asyncio
    async def test_returns_404_for_nonexistent_campaign(self, client):
        """Should return 404 for a campaign that doesn't exist."""
        response = await client.get("/api/kpis/campaigns/9999/badge")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_returns_correct_badge_structure(self, client, test_dates):
        """Should return correct badge data structure."""
        response = await client.get(
            "/api/kpis/campaigns/1/badge",
            params={"target_date": test_dates["today"].isoformat()},
        )
        assert response.status_code == 200
        data = response.json()

        assert "date" in data
        assert "hours" in data
        assert "badge" in data
        assert "threshold" in data
        assert "next_badge" in data
        assert "hours_to_next" in data

    @pytest.mark.asyncio
    async def test_returns_correct_badge_for_day_with_data(self, client, test_dates):
        """Should return the correct badge for a day with KPI data."""
        # Today has 140 hours (silver)
        response = await client.get(
            "/api/kpis/campaigns/1/badge",
            params={"target_date": test_dates["today"].isoformat()},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["hours"] == 140.0
        assert data["badge"] == "silver"
        assert data["threshold"] == 120  # Silver threshold
        assert data["next_badge"] == "gold"

    @pytest.mark.asyncio
    async def test_returns_null_badge_for_day_with_no_data(self, client):
        """Should return null badge for a day with no hours."""
        # Use a date far in the past with no data
        old_date = date(2020, 1, 1)
        response = await client.get(
            "/api/kpis/campaigns/1/badge",
            params={"target_date": old_date.isoformat()},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["hours"] == 0
        assert data["badge"] is None
        assert data["threshold"] == 0
        assert data["next_badge"] == "bronze"


class TestGetBadgeSummary:
    """Tests for GET /api/kpis/campaigns/{campaign_id}/badge-summary"""

    @pytest.mark.asyncio
    async def test_returns_404_for_nonexistent_campaign(self, client):
        """Should return 404 for a campaign that doesn't exist."""
        response = await client.get("/api/kpis/campaigns/9999/badge-summary")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_returns_400_when_start_after_end(self, client):
        """Should return 400 when start_date is after end_date."""
        response = await client.get(
            "/api/kpis/campaigns/1/badge-summary",
            params={
                "start_date": "2025-01-15",
                "end_date": "2025-01-01",
            },
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_returns_correct_structure(self, client, test_dates):
        """Should return correct badge summary structure."""
        response = await client.get(
            "/api/kpis/campaigns/1/badge-summary",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "campaign" in data
        assert "period" in data
        assert "badge_breakdown" in data
        assert "total_days" in data
        assert "total_hours" in data
        assert "average_daily_hours" in data
        assert "average_badge" in data

        # Check badge breakdown has all types
        breakdown = data["badge_breakdown"]
        assert "platinum" in breakdown
        assert "gold" in breakdown
        assert "silver" in breakdown
        assert "bronze" in breakdown
        assert "none" in breakdown

    @pytest.mark.asyncio
    async def test_correctly_counts_badges_per_day(self, client, test_dates):
        """Should correctly count each badge type earned per day."""
        response = await client.get(
            "/api/kpis/campaigns/1/badge-summary",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
            },
        )
        assert response.status_code == 200
        data = response.json()

        breakdown = data["badge_breakdown"]

        # Based on test data:
        # - 1 platinum day (250 hours)
        # - 2 gold days (200 and 190 hours)
        # - 2 silver days (150 and 140 hours)
        # - 1 bronze day (80 hours)
        # - 1 no-badge day (30 hours)
        assert breakdown["platinum"] == 1
        assert breakdown["gold"] == 2
        assert breakdown["silver"] == 2
        assert breakdown["bronze"] == 1
        assert breakdown["none"] == 1

        assert data["total_days"] == 7

    @pytest.mark.asyncio
    async def test_calculates_average_badge_from_daily_data(self, client, test_dates):
        """Average badge should be calculated from average daily hours."""
        response = await client.get(
            "/api/kpis/campaigns/1/badge-summary",
            params={
                "start_date": test_dates["start_of_test_data"].isoformat(),
                "end_date": test_dates["today"].isoformat(),
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Total hours: 250 + 200 + 150 + 80 + 30 + 190 + 140 = 1040
        # Average: 1040 / 7 = ~148.6 (silver range)
        assert data["total_hours"] == 1040.0
        assert data["average_daily_hours"] == 148.6
        assert data["average_badge"] == "silver"


class TestGetBadgeThresholds:
    """Tests for GET /api/kpis/badge-thresholds"""

    @pytest.mark.asyncio
    async def test_returns_all_thresholds(self, client):
        """Should return all badge threshold values."""
        response = await client.get("/api/kpis/badge-thresholds")
        assert response.status_code == 200
        data = response.json()

        assert "thresholds" in data
        thresholds = data["thresholds"]

        assert thresholds["bronze"] == 60
        assert thresholds["silver"] == 120
        assert thresholds["gold"] == 180
        assert thresholds["platinum"] == 240

    @pytest.mark.asyncio
    async def test_returns_description(self, client):
        """Should return a description of the thresholds."""
        response = await client.get("/api/kpis/badge-thresholds")
        assert response.status_code == 200
        data = response.json()

        assert "description" in data
        assert len(data["description"]) > 0
