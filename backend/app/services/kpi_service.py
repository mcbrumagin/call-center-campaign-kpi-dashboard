from datetime import date
from typing import Literal

from app.database import get_db
from app.models import BadgeType

# Badge thresholds (hours per day)
BADGE_THRESHOLDS = {
    "platinum": 240,
    "gold": 180,
    "silver": 120,
    "bronze": 60,
}


def calculate_badge(hours: float) -> BadgeType:
    """Calculate badge based on hours worked."""
    if hours >= BADGE_THRESHOLDS["platinum"]:
        return "platinum"
    elif hours >= BADGE_THRESHOLDS["gold"]:
        return "gold"
    elif hours >= BADGE_THRESHOLDS["silver"]:
        return "silver"
    elif hours >= BADGE_THRESHOLDS["bronze"]:
        return "bronze"
    return None


def get_badge_threshold(badge: BadgeType) -> int:
    """Get the threshold for a badge."""
    if badge is None:
        return 0
    return BADGE_THRESHOLDS.get(badge, 0)


def get_next_badge_info(hours: float) -> dict:
    """Get information about the next badge tier."""
    if hours >= BADGE_THRESHOLDS["platinum"]:
        return {"next_badge": None, "hours_to_next": 0}
    elif hours >= BADGE_THRESHOLDS["gold"]:
        return {
            "next_badge": "platinum",
            "hours_to_next": round(BADGE_THRESHOLDS["platinum"] - hours, 1),
        }
    elif hours >= BADGE_THRESHOLDS["silver"]:
        return {
            "next_badge": "gold",
            "hours_to_next": round(BADGE_THRESHOLDS["gold"] - hours, 1),
        }
    elif hours >= BADGE_THRESHOLDS["bronze"]:
        return {
            "next_badge": "silver",
            "hours_to_next": round(BADGE_THRESHOLDS["silver"] - hours, 1),
        }
    else:
        return {
            "next_badge": "bronze",
            "hours_to_next": round(BADGE_THRESHOLDS["bronze"] - hours, 1),
        }


async def get_campaign_kpis(
    campaign_id: int,
    start_date: date,
    end_date: date,
    group_by: Literal["day", "week", "month"] = "day",
) -> dict | None:
    """Get KPI data for a campaign with grouping."""
    async with get_db() as db:
        # Verify campaign exists
        cursor = await db.execute(
            "SELECT id, name, is_active FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        campaign = await cursor.fetchone()
        if not campaign:
            return None
        
        # Build grouping expression based on group_by parameter
        if group_by == "day":
            date_expr = "date"
        elif group_by == "week":
            # Start of week (Monday)
            date_expr = "date(date, 'weekday 0', '-6 days')"
        else:  # month
            date_expr = "date(date, 'start of month')"
        
        # Query includes count of days in each period for average calculation
        query = f"""
            SELECT 
                {date_expr} as period_date,
                SUM(hours) as total_hours,
                COUNT(DISTINCT date) as days_in_period
            FROM campaign_kpi
            WHERE campaign_id = ?
              AND date BETWEEN ? AND ?
            GROUP BY {date_expr}
            ORDER BY period_date
        """
        
        cursor = await db.execute(
            query,
            (campaign_id, start_date.isoformat(), end_date.isoformat()),
        )
        rows = await cursor.fetchall()
        
        data = []
        total_hours = 0
        total_days = 0
        
        for row in rows:
            hours = row["total_hours"]
            days_in_period = row["days_in_period"]
            # Calculate badge based on average daily hours within the period
            avg_daily_hours = hours / max(days_in_period, 1)
            badge = calculate_badge(avg_daily_hours)
            
            data.append({
                "date": row["period_date"],
                "hours": round(hours, 1),
                "badge": badge,
            })
            
            total_hours += hours
            total_days += days_in_period
        
        return {
            "campaign": {
                "id": campaign["id"],
                "name": campaign["name"],
                "is_active": bool(campaign["is_active"]),
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "group_by": group_by,
            },
            "data": data,
            "summary": {
                "total_hours": round(total_hours, 1),
                "average_daily_hours": round(total_hours / max(total_days, 1), 1),
                "days_with_data": total_days,
            },
        }


async def get_daily_badge(campaign_id: int, target_date: date) -> dict | None:
    """Get badge information for a specific day."""
    async with get_db() as db:
        # Verify campaign exists
        cursor = await db.execute(
            "SELECT id, name FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        campaign = await cursor.fetchone()
        if not campaign:
            return None
        
        # Get hours for the specific date
        cursor = await db.execute(
            """
            SELECT SUM(hours) as total_hours
            FROM campaign_kpi
            WHERE campaign_id = ? AND date = ?
            """,
            (campaign_id, target_date.isoformat()),
        )
        row = await cursor.fetchone()
        hours = row["total_hours"] or 0
        
        badge = calculate_badge(hours)
        next_info = get_next_badge_info(hours)
        
        return {
            "date": target_date.isoformat(),
            "hours": round(hours, 1),
            "badge": badge,
            "threshold": get_badge_threshold(badge),
            "next_badge": next_info["next_badge"],
            "hours_to_next": next_info["hours_to_next"],
        }


async def get_badge_summary(
    campaign_id: int,
    start_date: date,
    end_date: date,
) -> dict | None:
    """
    Get badge summary for a campaign over a date range.
    
    Always calculates badges from daily data regardless of how the chart is grouped.
    Returns the count of each badge type earned per day.
    """
    async with get_db() as db:
        # Verify campaign exists
        cursor = await db.execute(
            "SELECT id, name, is_active FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        campaign = await cursor.fetchone()
        if not campaign:
            return None
        
        # Always query daily data for accurate badge calculation
        query = """
            SELECT 
                date,
                SUM(hours) as total_hours
            FROM campaign_kpi
            WHERE campaign_id = ?
              AND date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date
        """
        
        cursor = await db.execute(
            query,
            (campaign_id, start_date.isoformat(), end_date.isoformat()),
        )
        rows = await cursor.fetchall()
        
        badge_counts = {"platinum": 0, "gold": 0, "silver": 0, "bronze": 0, "none": 0}
        total_hours = 0
        
        for row in rows:
            hours = row["total_hours"]
            badge = calculate_badge(hours)
            total_hours += hours
            badge_counts[badge or "none"] += 1
        
        total_days = len(rows)
        average_daily_hours = round(total_hours / max(total_days, 1), 1)
        average_badge = calculate_badge(average_daily_hours)
        
        return {
            "campaign": {
                "id": campaign["id"],
                "name": campaign["name"],
                "is_active": bool(campaign["is_active"]),
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "badge_breakdown": badge_counts,
            "total_days": total_days,
            "total_hours": round(total_hours, 1),
            "average_daily_hours": average_daily_hours,
            "average_badge": average_badge,
        }
