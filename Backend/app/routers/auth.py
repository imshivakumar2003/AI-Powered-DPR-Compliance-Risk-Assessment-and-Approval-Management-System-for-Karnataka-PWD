# TOPLINE

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.services.auth_service import (
    authenticate_user, create_access_token, decode_token,
    register_user, get_user,
    get_all_users, create_user_by_admin, update_user, delete_user,
    get_settings, save_settings,
    Token, LoginRequest, RegisterRequest, UserResponse, TokenData,
    UserListItem, CreateUserRequest, UpdateUserRequest, AppSettings,
)
from typing import List
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """Dependency to extract and validate the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = decode_token(token)
    if token_data is None:
        raise credentials_exception
    user = get_user(token_data.username)
    if user is None:
        raise credentials_exception
    if user.disabled:
        raise HTTPException(status_code=400, detail="Account is disabled")
    return UserResponse(
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        department=user.department,
    )


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """Authenticate user with username and password."""
    user = authenticate_user(request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/token", response_model=Token)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2-compatible token endpoint for Swagger UI."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    """Register a new user account."""
    user = register_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists",
        )
    return UserResponse(
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        department=user.department,
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


# ── User Management (Admin) ───────────────────────────────────────────────────

@router.get("/users", response_model=List[UserListItem])
async def list_users():
    """Return all users in the system (admin use)."""
    return get_all_users()


@router.post("/users", response_model=UserListItem, status_code=201)
async def create_user(req: CreateUserRequest):
    """Admin creates a new user with a temporary password."""
    if not req.username or not req.email or not req.full_name:
        raise HTTPException(status_code=400, detail="username, full_name and email are required")
    if not req.password or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")
    user = create_user_by_admin(req)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists",
        )
    return user


@router.put("/users/{username}", response_model=UserListItem)
async def edit_user(username: str, req: UpdateUserRequest):
    """Update a user's details (role, department, disabled status, password)."""
    user = update_user(username, req)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/users/{username}")
async def remove_user(username: str):
    """Delete a user by username. Prevents deleting the built-in admin."""
    if username == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete the master admin account")
    success = delete_user(username)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": f"User '{username}' deleted"}


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=AppSettings)
async def load_settings():
    """Load current application settings from the database."""
    return get_settings()


@router.put("/settings", response_model=AppSettings)
async def update_settings(settings: AppSettings):
    """Persist application settings to the database."""
    allowed_languages = {"en", "hi", "kn"}
    if settings.language not in allowed_languages:
        raise HTTPException(status_code=400, detail=f"Language must be one of: {', '.join(sorted(allowed_languages))}")
    if not (40 <= settings.risk_threshold <= 90):
        raise HTTPException(status_code=400, detail="risk_threshold must be between 40 and 90")
    return save_settings(settings)
