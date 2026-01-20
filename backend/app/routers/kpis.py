from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, HTTPException, status, Query

from app.services import get_campaign_kpis, get_daily_badge, BADGE_THRESHOLDS
from app.models import KPIResponse, DailyBadgeResponse

router = APIRouter(prefix="/api/kpis", tags=["kpis"])


@router.get("/campaigns/{campaign_id}", response_model=KPIResponse)
async def get_kpis(
    campaign_id: int,
    start_date: date = Query(
        default_factory=lambda: date.today() - timedelta(days=30),
        description="Start date for KPI data",
    ),
    end_date: date = Query(
        default_factory=date.today,
        description="End date for KPI data",
    ),
    group_by: Literal["day", "week", "month"] = Query(
        default="day",
        description="How to group the KPI data",
    ),
):
    """
    Get KPI data for a campaign.
    
    Public endpoint for customer dashboard.
    Returns hours worked per campaign per day, grouped by day, week, or month.
    """
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before or equal to end_date",
        )
    
    result = await get_campaign_kpis(campaign_id, start_date, end_date, group_by)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    
    return result


@router.get("/campaigns/{campaign_id}/badge", response_model=DailyBadgeResponse)
async def get_badge(
    campaign_id: int,
    target_date: date = Query(
        default_factory=date.today,
        description="Date to get badge for",
    ),
):
    """
    Get badge information for a specific day.
    
    Public endpoint for customer dashboard gamification.
    Returns the badge earned and progress to next badge.
    """
    result = await get_daily_badge(campaign_id, target_date)
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )
    
    return result


@router.get("/badge-thresholds")
async def get_badge_thresholds():
    """
    Get badge threshold information.
    
    Returns the hours required for each badge tier.
    """
    return {
        "thresholds": BADGE_THRESHOLDS,
        "description": "Hours required per day to earn each badge",
    }
