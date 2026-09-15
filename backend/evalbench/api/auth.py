from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from evalbench.api.dependencies import get_postgres_store
from evalbench.storage.postgres_store import PostgresResultStore


class AuthenticatedUser:
    """Represents a verified Better Auth user for the current request."""

    user_id: str
    email: str
    name: str
    role: str

    def __init__(self, user_id: str, email: str, name: str, role: str) -> None:
        self.user_id = user_id
        self.email = email
        self.name = name
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


async def get_optional_user(
    request: Request,
    store: Annotated[PostgresResultStore, Depends(get_postgres_store)],
) -> AuthenticatedUser | None:
    """Extract and verify session token from cookies or Authorization header.

    Returns AuthenticatedUser if valid session found, None otherwise.
    """
    token = request.cookies.get("better-auth.session_token")
    if not token:
        token = request.cookies.get("__Secure-better-auth.session_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()

    if not token:
        return None

    raw_token = token
    token_prefix = token.split(".")[0]

    assert store._pool is not None, "Postgres store pool not initialized"

    async with store._pool.acquire() as conn:
        try:
            # Better Auth default camelCase schema ("userId", "expiresAt")
            row = await conn.fetchrow(
                """
                SELECT s."userId" AS user_id, u.email, u.name, COALESCE(u.role, 'user') AS role
                FROM "session" s
                JOIN "user" u ON s."userId" = u.id
                WHERE (s.token = $1 OR s.token = $2)
                  AND s."expiresAt" > now()
                """,
                raw_token,
                token_prefix,
            )
        except Exception:  # noqa: BLE001
            # Fallback for snake_case schema if custom field mapping was configured
            row = await conn.fetchrow(
                """
                SELECT s.user_id, u.email, u.name, COALESCE(u.role, 'user') AS role
                FROM "session" s
                JOIN "user" u ON s.user_id = u.id
                WHERE (s.token = $1 OR s.token = $2)
                  AND s.expires_at > now()
                """,
                raw_token,
                token_prefix,
            )

    if not row:
        return None

    return AuthenticatedUser(
        user_id=str(row["user_id"]),
        email=str(row["email"]),
        name=str(row.get("name") or ""),
        role=str(row["role"]),
    )


async def get_current_user(
    user: Annotated[AuthenticatedUser | None, Depends(get_optional_user)],
) -> AuthenticatedUser:
    """Enforce authentication, raising 401 Unauthorized if no valid session."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_admin_user(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> AuthenticatedUser:
    """Enforce admin role, raising 403 Forbidden if not an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
