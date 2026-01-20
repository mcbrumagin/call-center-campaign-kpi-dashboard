"""
Unit tests for badge calculation logic in kpi_service.py.

These tests cover the pure functions that don't require database access.
"""
import pytest
from app.services.kpi_service import (
    calculate_badge,
    get_badge_threshold,
    get_next_badge_info,
    BADGE_THRESHOLDS,
)


class TestCalculateBadge:
    """Tests for calculate_badge() function."""

    def test_returns_none_for_zero_hours(self):
        """0 hours should return no badge."""
        assert calculate_badge(0) is None

    def test_returns_none_for_low_hours(self):
        """Hours below bronze threshold should return no badge."""
        assert calculate_badge(30) is None
        assert calculate_badge(59) is None
        assert calculate_badge(59.9) is None

    def test_returns_bronze_at_threshold(self):
        """Exactly 60 hours should return bronze."""
        assert calculate_badge(60) == "bronze"

    def test_returns_bronze_in_range(self):
        """Hours between 60-119 should return bronze."""
        assert calculate_badge(60) == "bronze"
        assert calculate_badge(90) == "bronze"
        assert calculate_badge(119) == "bronze"
        assert calculate_badge(119.9) == "bronze"

    def test_returns_silver_at_threshold(self):
        """Exactly 120 hours should return silver."""
        assert calculate_badge(120) == "silver"

    def test_returns_silver_in_range(self):
        """Hours between 120-179 should return silver."""
        assert calculate_badge(120) == "silver"
        assert calculate_badge(150) == "silver"
        assert calculate_badge(179) == "silver"
        assert calculate_badge(179.9) == "silver"

    def test_returns_gold_at_threshold(self):
        """Exactly 180 hours should return gold."""
        assert calculate_badge(180) == "gold"

    def test_returns_gold_in_range(self):
        """Hours between 180-239 should return gold."""
        assert calculate_badge(180) == "gold"
        assert calculate_badge(210) == "gold"
        assert calculate_badge(239) == "gold"
        assert calculate_badge(239.9) == "gold"

    def test_returns_platinum_at_threshold(self):
        """Exactly 240 hours should return platinum."""
        assert calculate_badge(240) == "platinum"

    def test_returns_platinum_above_threshold(self):
        """Hours above 240 should return platinum."""
        assert calculate_badge(240) == "platinum"
        assert calculate_badge(300) == "platinum"
        assert calculate_badge(1000) == "platinum"

    def test_handles_negative_hours(self):
        """Negative hours should return no badge."""
        assert calculate_badge(-10) is None
        assert calculate_badge(-100) is None

    def test_handles_float_values(self):
        """Should correctly handle float values near thresholds."""
        assert calculate_badge(59.99) is None
        assert calculate_badge(60.01) == "bronze"
        assert calculate_badge(119.99) == "bronze"
        assert calculate_badge(120.01) == "silver"


class TestGetBadgeThreshold:
    """Tests for get_badge_threshold() function."""

    def test_returns_zero_for_none(self):
        """None badge should return 0 threshold."""
        assert get_badge_threshold(None) == 0

    def test_returns_bronze_threshold(self):
        """Bronze badge should return 60."""
        assert get_badge_threshold("bronze") == 60

    def test_returns_silver_threshold(self):
        """Silver badge should return 120."""
        assert get_badge_threshold("silver") == 120

    def test_returns_gold_threshold(self):
        """Gold badge should return 180."""
        assert get_badge_threshold("gold") == 180

    def test_returns_platinum_threshold(self):
        """Platinum badge should return 240."""
        assert get_badge_threshold("platinum") == 240

    def test_thresholds_match_constants(self):
        """Thresholds should match the BADGE_THRESHOLDS constant."""
        assert get_badge_threshold("bronze") == BADGE_THRESHOLDS["bronze"]
        assert get_badge_threshold("silver") == BADGE_THRESHOLDS["silver"]
        assert get_badge_threshold("gold") == BADGE_THRESHOLDS["gold"]
        assert get_badge_threshold("platinum") == BADGE_THRESHOLDS["platinum"]


class TestGetNextBadgeInfo:
    """Tests for get_next_badge_info() function."""

    def test_below_bronze_returns_bronze_as_next(self):
        """Hours below bronze should show bronze as next badge."""
        result = get_next_badge_info(30)
        assert result["next_badge"] == "bronze"
        assert result["hours_to_next"] == 30  # 60 - 30

    def test_at_bronze_returns_silver_as_next(self):
        """Bronze level should show silver as next badge."""
        result = get_next_badge_info(60)
        assert result["next_badge"] == "silver"
        assert result["hours_to_next"] == 60  # 120 - 60

    def test_at_silver_returns_gold_as_next(self):
        """Silver level should show gold as next badge."""
        result = get_next_badge_info(120)
        assert result["next_badge"] == "gold"
        assert result["hours_to_next"] == 60  # 180 - 120

    def test_at_gold_returns_platinum_as_next(self):
        """Gold level should show platinum as next badge."""
        result = get_next_badge_info(180)
        assert result["next_badge"] == "platinum"
        assert result["hours_to_next"] == 60  # 240 - 180

    def test_at_platinum_returns_none_as_next(self):
        """Platinum level should have no next badge."""
        result = get_next_badge_info(240)
        assert result["next_badge"] is None
        assert result["hours_to_next"] == 0

    def test_above_platinum_returns_none_as_next(self):
        """Above platinum should have no next badge."""
        result = get_next_badge_info(300)
        assert result["next_badge"] is None
        assert result["hours_to_next"] == 0

    def test_hours_to_next_is_rounded(self):
        """Hours to next should be rounded to 1 decimal."""
        result = get_next_badge_info(35.333)
        # 60 - 35.333 = 24.667, rounded to 24.7
        assert result["hours_to_next"] == 24.7

    def test_mid_tier_calculations(self):
        """Test calculations for values in the middle of tiers."""
        # Mid-bronze (90 hours) -> need 30 more for silver
        result = get_next_badge_info(90)
        assert result["next_badge"] == "silver"
        assert result["hours_to_next"] == 30

        # Mid-silver (150 hours) -> need 30 more for gold
        result = get_next_badge_info(150)
        assert result["next_badge"] == "gold"
        assert result["hours_to_next"] == 30

        # Mid-gold (210 hours) -> need 30 more for platinum
        result = get_next_badge_info(210)
        assert result["next_badge"] == "platinum"
        assert result["hours_to_next"] == 30


class TestBadgeThresholdsConstant:
    """Tests for the BADGE_THRESHOLDS constant."""

    def test_has_all_badge_types(self):
        """Should have thresholds for all badge types."""
        assert "bronze" in BADGE_THRESHOLDS
        assert "silver" in BADGE_THRESHOLDS
        assert "gold" in BADGE_THRESHOLDS
        assert "platinum" in BADGE_THRESHOLDS

    def test_thresholds_are_in_ascending_order(self):
        """Thresholds should be in ascending order."""
        assert BADGE_THRESHOLDS["bronze"] < BADGE_THRESHOLDS["silver"]
        assert BADGE_THRESHOLDS["silver"] < BADGE_THRESHOLDS["gold"]
        assert BADGE_THRESHOLDS["gold"] < BADGE_THRESHOLDS["platinum"]

    def test_thresholds_are_expected_values(self):
        """Thresholds should match expected values."""
        assert BADGE_THRESHOLDS["bronze"] == 60
        assert BADGE_THRESHOLDS["silver"] == 120
        assert BADGE_THRESHOLDS["gold"] == 180
        assert BADGE_THRESHOLDS["platinum"] == 240
