from typing import Annotated
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.auth import require_admin
from app.database import get_db
from app.models import (
    TokenData,
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentListResponse,
    CampaignBrief,
    CampaignAssignment,
    AssignmentResponse,
)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=AgentListResponse)
async def list_agents(
    _: Annotated[TokenData, Depends(require_admin)],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
):
    """List all agents with pagination and filtering."""
    async with get_db() as db:
        # Build query conditions
        conditions = []
        params = []
        
        if search:
            conditions.append(
                "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)"
            )
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        if is_active is not None:
            conditions.append("is_active = ?")
            params.append(1 if is_active else 0)
        
        where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) as count FROM agent{where_clause}"
        cursor = await db.execute(count_query, params)
        row = await cursor.fetchone()
        total = row["count"]
        
        # Get paginated results
        offset = (page - 1) * limit
        query = f"""
            SELECT id, first_name, last_name, email, is_active, created_at 
            FROM agent
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor = await db.execute(query, params + [limit, offset])
        rows = await cursor.fetchall()
        
        # Get campaigns for each agent
        agents = []
        for row in rows:
            agent_id = row["id"]
            campaigns_query = """
                SELECT c.id, c.name, c.is_active
                FROM campaign c
                JOIN campaign_agent ca ON c.id = ca.campaign_id
                WHERE ca.agent_id = ?
            """
            cursor = await db.execute(campaigns_query, (agent_id,))
            campaign_rows = await cursor.fetchall()
            campaigns = [
                CampaignBrief(id=c["id"], name=c["name"], is_active=bool(c["is_active"]))
                for c in campaign_rows
            ]
            
            agents.append(AgentResponse(
                id=row["id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                email=row["email"],
                is_active=bool(row["is_active"]),
                created_at=row["created_at"],
                campaigns=campaigns,
            ))
        
        return AgentListResponse(
            data=agents,
            total=total,
            page=page,
            limit=limit,
            pages=ceil(total / limit) if total > 0 else 1,
        )


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent: AgentCreate,
):
    """Create a new agent."""
    async with get_db() as db:
        try:
            cursor = await db.execute(
                """
                INSERT INTO agent (first_name, last_name, email, is_active)
                VALUES (?, ?, ?, ?)
                """,
                (agent.first_name, agent.last_name, agent.email, agent.is_active),
            )
            await db.commit()
            agent_id = cursor.lastrowid
            
            # Fetch the created agent
            cursor = await db.execute(
                "SELECT * FROM agent WHERE id = ?",
                (agent_id,),
            )
            row = await cursor.fetchone()
            
            return AgentResponse(
                id=row["id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                email=row["email"],
                is_active=bool(row["is_active"]),
                created_at=row["created_at"],
                campaigns=[],
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An agent with this email already exists",
                )
            raise


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent_id: int,
):
    """Get a specific agent by ID."""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT * FROM agent WHERE id = ?",
            (agent_id,),
        )
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        # Get campaigns
        campaigns_query = """
            SELECT c.id, c.name, c.is_active
            FROM campaign c
            JOIN campaign_agent ca ON c.id = ca.campaign_id
            WHERE ca.agent_id = ?
        """
        cursor = await db.execute(campaigns_query, (agent_id,))
        campaign_rows = await cursor.fetchall()
        campaigns = [
            CampaignBrief(id=c["id"], name=c["name"], is_active=bool(c["is_active"]))
            for c in campaign_rows
        ]
        
        return AgentResponse(
            id=row["id"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            email=row["email"],
            is_active=bool(row["is_active"]),
            created_at=row["created_at"],
            campaigns=campaigns,
        )


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent_id: int,
    agent: AgentUpdate,
):
    """Update an existing agent."""
    async with get_db() as db:
        # Check if agent exists
        cursor = await db.execute(
            "SELECT * FROM agent WHERE id = ?",
            (agent_id,),
        )
        existing = await cursor.fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        # Build update query
        updates = []
        params = []
        
        if agent.first_name is not None:
            updates.append("first_name = ?")
            params.append(agent.first_name)
        if agent.last_name is not None:
            updates.append("last_name = ?")
            params.append(agent.last_name)
        if agent.email is not None:
            updates.append("email = ?")
            params.append(agent.email)
        if agent.is_active is not None:
            updates.append("is_active = ?")
            params.append(agent.is_active)
        
        if updates:
            try:
                params.append(agent_id)
                await db.execute(
                    f"UPDATE agent SET {', '.join(updates)} WHERE id = ?",
                    params,
                )
                await db.commit()
            except Exception as e:
                if "UNIQUE constraint failed" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="An agent with this email already exists",
                    )
                raise
        
        # Return updated agent
        return await get_agent(_, agent_id)


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent_id: int,
):
    """Delete an agent."""
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM agent WHERE id = ?",
            (agent_id,),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        await db.execute("DELETE FROM agent WHERE id = ?", (agent_id,))
        await db.commit()


@router.post("/{agent_id}/campaigns", response_model=AssignmentResponse)
async def assign_campaigns_to_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent_id: int,
    assignment: CampaignAssignment,
):
    """Assign campaigns to an agent."""
    async with get_db() as db:
        # Check if agent exists
        cursor = await db.execute(
            "SELECT id FROM agent WHERE id = ?",
            (agent_id,),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        
        count = 0
        for campaign_id in assignment.campaign_ids:
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
            message=f"Assigned {count} campaigns to agent",
            count=count,
        )


@router.delete("/{agent_id}/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_campaign_from_agent(
    _: Annotated[TokenData, Depends(require_admin)],
    agent_id: int,
    campaign_id: int,
):
    """Remove a campaign assignment from an agent."""
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
