"""
API integration tests for authentication endpoints.

These tests verify the authentication flow works correctly,
including login, token validation, and protected endpoints.
"""
import pytest
import jwt
from app.auth.jwt import SECRET_KEY, ALGORITHM


class TestLogin:
    """Tests for POST /api/auth/login"""

    @pytest.mark.asyncio
    async def test_returns_401_for_invalid_username(self, client):
        """Should return 401 for non-existent username."""
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent",
                "password": "admin123",
            },
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_returns_401_for_invalid_password(self, client):
        """Should return 401 for wrong password."""
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "admin",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_returns_token_for_valid_credentials(self, client):
        """Should return JWT token for correct credentials."""
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "admin",
                "password": "admin123",
            },
        )
        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0

    @pytest.mark.asyncio
    async def test_token_contains_expected_claims(self, client):
        """Token should contain username and role claims."""
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "admin",
                "password": "admin123",
            },
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        # Decode and verify token claims
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        assert payload["sub"] == "admin"
        assert payload["role"] == "admin"
        assert "exp" in payload  # Expiration claim
        assert "iat" in payload  # Issued at claim

    @pytest.mark.asyncio
    async def test_token_has_valid_expiration(self, client):
        """Token should have a valid expiration time."""
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "admin",
                "password": "admin123",
            },
        )
        assert response.status_code == 200
        data = response.json()

        # expires_in should be reasonable (in seconds)
        assert data["expires_in"] > 0
        assert data["expires_in"] <= 3600 * 24  # No more than 24 hours


class TestGetCurrentUser:
    """Tests for GET /api/auth/me"""

    @pytest.mark.asyncio
    async def test_returns_401_without_token(self, client):
        """Should return 401 when no token is provided."""
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_returns_401_with_invalid_token(self, client):
        """Should return 401 with an invalid token."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_returns_401_with_malformed_header(self, client):
        """Should return 401 with malformed Authorization header."""
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "NotBearer token"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_returns_user_info_with_valid_token(self, client, auth_headers):
        """Should return user info with a valid token."""
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["username"] == "admin"
        assert data["role"] == "admin"

    @pytest.mark.asyncio
    async def test_works_with_freshly_obtained_token(self, client):
        """Should work with a token obtained from the login endpoint."""
        # First, login to get a token
        login_response = await client.post(
            "/api/auth/login",
            data={
                "username": "admin",
                "password": "admin123",
            },
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Then use that token to access /me
        me_response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_response.status_code == 200
        assert me_response.json()["username"] == "admin"


class TestLogout:
    """Tests for POST /api/auth/logout"""

    @pytest.mark.asyncio
    async def test_logout_returns_success(self, client):
        """Logout should return a success message."""
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert "logged out" in data["message"].lower()


class TestProtectedEndpoints:
    """Tests verifying that admin endpoints require authentication."""

    @pytest.mark.asyncio
    async def test_agents_list_requires_auth(self, client):
        """GET /api/agents should require authentication."""
        response = await client.get("/api/agents")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_agents_list_works_with_auth(self, client, auth_headers):
        """GET /api/agents should work with valid token."""
        response = await client.get("/api/agents", headers=auth_headers)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_create_agent_requires_auth(self, client):
        """POST /api/agents should require authentication."""
        response = await client.post(
            "/api/agents",
            json={
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_campaign_requires_auth(self, client):
        """POST /api/campaigns should require authentication."""
        response = await client.post(
            "/api/campaigns",
            json={"name": "New Campaign"},
        )
        assert response.status_code == 401
