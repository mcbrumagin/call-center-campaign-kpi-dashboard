from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.models import Token, TokenData, UserInfo

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Authenticate admin user and return JWT token.
    
    Use OAuth2 password flow with username and password.
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: Annotated[TokenData, Depends(get_current_user)]
):
    """Get current authenticated user information."""
    return UserInfo(username=current_user.username, role=current_user.role)


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    
    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the token. This endpoint is provided for API completeness.
    """
    return {"message": "Successfully logged out"}
