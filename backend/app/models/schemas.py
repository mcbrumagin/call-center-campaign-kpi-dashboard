from datetime import datetime, date
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


# ============== Auth Schemas ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserInfo(BaseModel):
    username: str
    role: str


# ============== Agent Schemas ==============

class AgentBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    is_active: bool = True


class AgentCreate(AgentBase):
    pass


class AgentUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    is_active: bool | None = None


class CampaignBrief(BaseModel):
    id: int
    name: str
    is_active: bool = True


class AgentResponse(AgentBase):
    id: int
    created_at: datetime
    campaigns: list[CampaignBrief] = []

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    data: list[AgentResponse]
    total: int
    page: int
    limit: int
    pages: int


# ============== Campaign Schemas ==============

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    is_active: bool = True


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    is_active: bool | None = None


class AgentBrief(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str


class CampaignResponse(CampaignBase):
    id: int
    created_at: datetime
    agent_count: int = 0

    class Config:
        from_attributes = True


class CampaignDetailResponse(CampaignBase):
    id: int
    created_at: datetime
    agents: list[AgentBrief] = []

    class Config:
        from_attributes = True


class CampaignListResponse(BaseModel):
    data: list[CampaignResponse]
    total: int
    page: int
    limit: int
    pages: int


# ============== Assignment Schemas ==============

class AgentAssignment(BaseModel):
    agent_ids: list[int]


class CampaignAssignment(BaseModel):
    campaign_ids: list[int]


class AssignmentResponse(BaseModel):
    message: str
    count: int


# ============== KPI Schemas ==============

BadgeType = Literal["platinum", "gold", "silver", "bronze"] | None


class KPIDataPoint(BaseModel):
    date: str
    hours: float
    badge: BadgeType


class PeriodInfo(BaseModel):
    start_date: str
    end_date: str
    group_by: str


class BadgeBreakdown(BaseModel):
    platinum: int = 0
    gold: int = 0
    silver: int = 0
    bronze: int = 0
    none: int = 0


class KPISummary(BaseModel):
    total_hours: float
    average_daily_hours: float
    days_with_data: int


class KPIResponse(BaseModel):
    campaign: CampaignBrief
    period: PeriodInfo
    data: list[KPIDataPoint]
    summary: KPISummary


class DailyBadgeResponse(BaseModel):
    date: str
    hours: float
    badge: BadgeType
    threshold: int
    next_badge: BadgeType
    hours_to_next: float


class BadgeSummaryPeriod(BaseModel):
    start_date: str
    end_date: str


class BadgeSummaryResponse(BaseModel):
    campaign: CampaignBrief
    period: BadgeSummaryPeriod
    badge_breakdown: BadgeBreakdown
    total_days: int
    total_hours: float
    average_daily_hours: float
    average_badge: BadgeType
