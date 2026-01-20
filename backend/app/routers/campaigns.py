from typing import Annotated
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.auth import require_admin
from app.database import get_db
from app.models import (
    TokenData,
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignDetailResponse,
    CampaignListResponse,
    AgentBrief,
    AgentAssignment,
    AssignmentResponse,
)

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("", response_model=CampaignListResponse)
async def list_campaigns(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
):
    """List all campaigns with pagination and filtering. Public endpoint."""
    async with get_db() as db:
        # Build query conditions
        conditions = []
        params = []
        
        if search:
            conditions.append("(name LIKE ? OR description LIKE ?)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        if is_active is not None:
            conditions.append("is_active = ?")
            params.append(1 if is_active else 0)
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as count FROM campaign{where_clause}"
        cursor = await db.execute(count_query, params)
        row = await cursor.fetchone()
        total = row["count"]
        
        # Get paginated results with agent count
        offset = (page - 1) * limit
        query = f"""
            SELECT 
                c.id, c.name, c.description, c.is_active, c.created_at,
                COUNT(ca.agent_id) as agent_count
            FROM campaign c
            LEFT JOIN campaign_agent ca ON c.id = ca.campaign_id
            {where_clause}
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor = await db.execute(query, params + [limit, offset])
        rows = await cursor.fetchall()
        
        campaigns = [
            CampaignResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                is_active=bool(row["is_active"]),
                created_at=row["created_at"],
                agent_count=row["agent_count"],
            )
            for row in rows
        ]
        
        return CampaignListResponse(
            data=campaigns,
            total=total,
            page=page,
            limit=limit,
            pages=ceil(total / limit) if total > 0 else 1,
        )


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    _: Annotated[TokenData, Depends(require_admin)],
    campaign: CampaignCreate,
):
    """Create a new campaign. Admin only."""
    async with get_db() as db:
        try:
            cursor = await db.execute(
                """
                INSERT INTO campaign (name, description, is_active)
                VALUES (?, ?, ?)
                """,
                (campaign.name, campaign.description, campaign.is_active),
            )
            await db.commit()
            campaign_id = cursor.lastrowid
            
            # Fetch the created campaign
            cursor = await db.execute(
                "SELECT * FROM campaign WHERE id = ?",
                (campaign_id,),
            )
            row = await cursor.fetchone()
            
            return CampaignResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                is_active=bool(row["is_active"]),
                created_at=row["created_at"],
                agent_count=0,
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A campaign with this name already exists",
                )
            raise


@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
async def get_campaign(campaign_id: int):
    """Get a specific campaign by ID with assigned agents. Public endpoint."""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        
        # Get assigned agents
        agents_query = """
            SELECT a.id, a.first_name, a.last_name, a.email
            FROM agent a
            JOIN campaign_agent ca ON a.id = ca.agent_id
            WHERE ca.campaign_id = ?
        """
        cursor = await db.execute(agents_query, (campaign_id,))
        agent_rows = await cursor.fetchall()
        agents = [
            AgentBrief(
                id=a["id"],
                first_name=a["first_name"],
                last_name=a["last_name"],
                email=a["email"],
            )
            for a in agent_rows
        ]
        
        return CampaignDetailResponse(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            is_active=bool(row["is_active"]),
            created_at=row["created_at"],
            agents=agents,
        )


@router.patch("/{campaign_id}", response_model=CampaignDetailResponse)
async def update_campaign(
    _: Annotated[TokenData, Depends(require_admin)],
    campaign_id: int,
    campaign: CampaignUpdate,
):
    """Update an existing campaign. Admin only."""
    async with get_db() as db:
        # Check if campaign exists
        cursor = await db.execute(
            "SELECT * FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        existing = await cursor.fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        
        # Build update query
        updates = []
        params = []
        
        if campaign.name is not None:
            updates.append("name = ?")
            params.append(campaign.name)
        if campaign.description is not None:
            updates.append("description = ?")
            params.append(campaign.description)
        if campaign.is_active is not None:
            updates.append("is_active = ?")
            params.append(campaign.is_active)
        
        if updates:
            try:
                params.append(campaign_id)
                await db.execute(
                    f"UPDATE campaign SET {', '.join(updates)} WHERE id = ?",
                    params,
                )
                await db.commit()
            except Exception as e:
                if "UNIQUE constraint failed" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="A campaign with this name already exists",
                    )
                raise
        
        # Return updated campaign
        return await get_campaign(campaign_id)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    _: Annotated[TokenData, Depends(require_admin)],
    campaign_id: int,
):
    """Delete a campaign. Admin only."""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        
        await db.execute("DELETE FROM campaign WHERE id = ?", (campaign_id,))
        await db.commit()


@router.post("/{campaign_id}/agents", response_model=AssignmentResponse)
async def assign_agents_to_campaign(
    _: Annotated[TokenData, Depends(require_admin)],
    campaign_id: int,
    assignment: AgentAssignment,
):
    """Assign agents to a campaign. Admin only."""
    async with get_db() as db:
        # Check if campaign exists
        cursor = await db.execute(
            "SELECT id FROM campaign WHERE id = ?",
            (campaign_id,),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found",
            )
        
        count = 0
        for agent_id in assignment.agent_ids:
            try:
                await db.execute(
                    """
                    INSERT INTO campaign_agent (agent_id, campaign_id)
                    VALUES (?, ?)
                    """,
                    (agent_id, campaign_id),
                )
                count += 1
            except Exception:
                # Skip duplicates
                pass
        
        await db.commit()
        return AssignmentResponse(
            message=f"Assigned {count} agents to campaign",
            count=count,
        )


@router.delete("/{campaign_id}/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_agent_from_campaign(
    _: Annotated[TokenData, Depends(require_admin)],
    campaign_id: int,
    agent_id: int,
):
    """Remove an agent assignment from a campaign. Admin only."""
    async with get_db() as db:
        cursor = await db.execute(
            """
            DELETE FROM campaign_agent 
            WHERE agent_id = ? AND campaign_id = ?
            """,
            (agent_id, campaign_id),
        )
        await db.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found",
            )
