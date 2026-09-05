# TOPLINE

import sqlite3
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

# ---- Configuration ----
SECRET_KEY = "Karnataka PWD-dpr-ai-secret-key-2026-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# SQLite database path — stored in the Database folder at project root
DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "Database")
DB_PATH = os.path.join(DB_DIR, "auth.db")

# ---- Password Hashing (using bcrypt directly to avoid passlib compat issues) ----

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

# ---- Pydantic Models ----

class UserInDB(BaseModel):
    id: Optional[int] = None
    username: str
    full_name: str
    email: str
    role: str  # "director", "reviewer", "analyst", "viewer"
    department: str
    hashed_password: str
    disabled: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    id: Optional[int] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    id: Optional[int] = None
    email: Optional[str] = None
    department: Optional[str] = None
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    role: str = "viewer"
    department: str = "General"


class UserResponse(BaseModel):
    username: str
    full_name: str
    email: str
    role: str
    department: str


# ---- Database Helpers ----

def _get_db() -> sqlite3.Connection:
    """Get a connection to the SQLite database."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the users table and seed the default test user."""
    conn = _get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL DEFAULT 'viewer',
            department TEXT NOT NULL DEFAULT 'General',
            hashed_password TEXT NOT NULL,
            disabled INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_login TEXT
        )
    """)
    # Migrate: add last_login column if missing on existing DBs
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
    except sqlite3.OperationalError:
        pass

    # Settings table — one row, key/value pairs stored as JSON-like columns
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    # Seed default settings if not present
    defaults = [
        ('risk_threshold', '70'),
        ('email_alerts', '1'),
        ('auto_assign', '1'),
        ('language', 'en'),
        ('theme', 'system'),
    ]
    for k, v in defaults:
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    # Seed the master admin: admin / admin
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if cursor.fetchone() is None:
        hashed = _hash_password("admin")
        cursor.execute(
            """INSERT INTO users (username, full_name, email, role, department, hashed_password, disabled)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("admin", "Master Admin", "admin@dpr-ai.gov.in", "admin", "IT", hashed, 0),
        )

    # Seed the test user: test / 1234
    cursor.execute("SELECT id FROM users WHERE username = ?", ("test",))
    if cursor.fetchone() is None:
        hashed = _hash_password("1234")
        cursor.execute(
            """INSERT INTO users (username, full_name, email, role, department, hashed_password, disabled)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("test", "Test User", "test@gmail.com", "viewer", "General", hashed, 0),
        )

    # Seed the default project requester: user / user
    cursor.execute("SELECT id FROM users WHERE username = ?", ("user",))
    if cursor.fetchone() is None:
        hashed = _hash_password("user")
        cursor.execute(
            """INSERT INTO users (username, full_name, email, role, department, hashed_password, disabled)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("user", "Project Requester", "user@dpr-ai.gov.in", "user", "State PWD", hashed, 0),
        )

    conn.commit()
    conn.close()


# ---- Initialize on module load ----
init_db()


# ---- Password Utilities ----

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _verify_password(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return _hash_password(password)


# ---- User CRUD ----

def get_user(username: str) -> Optional[UserInDB]:
    """Look up a user by username from SQLite."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return None
    return UserInDB(
        id=row["id"],
        username=row["username"],
        full_name=row["full_name"],
        email=row["email"],
        role=row["role"],
        department=row["department"],
        hashed_password=row["hashed_password"],
        disabled=bool(row["disabled"]),
    )


def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Look up a user by email from SQLite."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return None
    return UserInDB(
        id=row["id"],
        username=row["username"],
        full_name=row["full_name"],
        email=row["email"],
        role=row["role"],
        department=row["department"],
        hashed_password=row["hashed_password"],
        disabled=bool(row["disabled"]),
    )


def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """
    Authenticate by Login ID (username or email) and password.
    """
    clean_user = (username or "").strip()
    if "@" in clean_user:
        user = get_user_by_email(clean_user)
    else:
        user = get_user(clean_user)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    
    # Record last_login timestamp in database
    try:
        conn = _get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (datetime.now(timezone.utc).isoformat(), user.id))
        conn.commit()
        conn.close()
    except Exception:
        pass

    return user


# ---- JWT Token Utilities ----

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub", "") or payload.get("username", "")
        role: str = payload.get("role", "")
        if not username:
            return None
        return TokenData(
            username=username,
            role=role,
            id=payload.get("id"),
            email=payload.get("email"),
            department=payload.get("department"),
            full_name=payload.get("full_name")
        )
    except JWTError:
        return None


# ---- Registration ----

def register_user(request: RegisterRequest) -> Optional[UserInDB]:
    """Register a new user into SQLite. Returns None if username or email already taken."""
    conn = _get_db()
    cursor = conn.cursor()

    # Check for existing username
    cursor.execute("SELECT id FROM users WHERE username = ?", (request.username,))
    if cursor.fetchone() is not None:
        conn.close()
        return None

    # Check for existing email
    cursor.execute("SELECT id FROM users WHERE email = ?", (request.email,))
    if cursor.fetchone() is not None:
        conn.close()
        return None

    hashed = get_password_hash(request.password)
    cursor.execute(
        """INSERT INTO users (username, full_name, email, role, department, hashed_password, disabled)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (request.username, request.full_name, request.email, request.role, request.department, hashed, 0),
    )
    conn.commit()
    conn.close()

    return UserInDB(
        username=request.username,
        full_name=request.full_name,
        email=request.email,
        role=request.role,
        department=request.department,
        hashed_password=hashed,
        disabled=False,
    )


# ---- User Management (Admin) ----

class UserListItem(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    department: str
    disabled: bool
    created_at: str
    last_login: Optional[str] = None


class CreateUserRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    role: str = "viewer"
    department: str = "General"


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    disabled: Optional[bool] = None
    password: Optional[str] = None


def get_all_users() -> list:
    """Return all users from the database, excluding hashed_password."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, full_name, email, role, department, disabled, created_at, last_login FROM users ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return [
        UserListItem(
            id=row["id"],
            username=row["username"],
            full_name=row["full_name"],
            email=row["email"],
            role=row["role"],
            department=row["department"],
            disabled=bool(row["disabled"]),
            created_at=row["created_at"],
            last_login=row["last_login"],
        )
        for row in rows
    ]


def create_user_by_admin(req: CreateUserRequest) -> Optional[UserListItem]:
    """Admin creates a user with a temporary password. Returns None if duplicate."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        return None
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        conn.close()
        return None
    hashed = _hash_password(req.password)
    cursor.execute(
        """INSERT INTO users (username, full_name, email, role, department, hashed_password, disabled)
           VALUES (?, ?, ?, ?, ?, ?, 0)""",
        (req.username, req.full_name, req.email, req.role, req.department, hashed),
    )
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT id, username, full_name, email, role, department, disabled, created_at, last_login FROM users WHERE id = ?", (new_id,))
    row = cursor.fetchone()
    conn.close()
    return UserListItem(
        id=row["id"], username=row["username"], full_name=row["full_name"],
        email=row["email"], role=row["role"], department=row["department"],
        disabled=bool(row["disabled"]), created_at=row["created_at"], last_login=row["last_login"],
    )


def update_user(username: str, req: UpdateUserRequest) -> Optional[UserListItem]:
    """Update allowed fields on an existing user. Returns None if not found."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if not cursor.fetchone():
        conn.close()
        return None
    updates, params = [], []
    if req.full_name is not None:
        updates.append("full_name = ?"); params.append(req.full_name)
    if req.email is not None:
        updates.append("email = ?"); params.append(req.email)
    if req.role is not None:
        updates.append("role = ?"); params.append(req.role)
    if req.department is not None:
        updates.append("department = ?"); params.append(req.department)
    if req.disabled is not None:
        updates.append("disabled = ?"); params.append(1 if req.disabled else 0)
    if req.password is not None:
        updates.append("hashed_password = ?"); params.append(_hash_password(req.password))
    if updates:
        params.append(username)
        cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE username = ?", params)
        conn.commit()
    cursor.execute("SELECT id, username, full_name, email, role, department, disabled, created_at, last_login FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    return UserListItem(
        id=row["id"], username=row["username"], full_name=row["full_name"],
        email=row["email"], role=row["role"], department=row["department"],
        disabled=bool(row["disabled"]), created_at=row["created_at"], last_login=row["last_login"],
    )


def delete_user(username: str) -> bool:
    """Delete a user by username. Returns False if not found."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE username = ?", (username,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted > 0


# ---- Settings ----

class AppSettings(BaseModel):
    risk_threshold: int = 70
    email_alerts: bool = True
    auto_assign: bool = True
    language: str = "en"
    groq_api_key: Optional[str] = ""
    theme: str = "system"  # "light", "dark", "system"


def get_settings() -> AppSettings:
    """Load application settings from the settings table."""
    conn = _get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = {row["key"]: row["value"] for row in cursor.fetchall()}
    conn.close()
    return AppSettings(
        risk_threshold=int(rows.get("risk_threshold", 70)),
        email_alerts=rows.get("email_alerts", "1") == "1",
        auto_assign=rows.get("auto_assign", "1") == "1",
        language=rows.get("language", "en"),
        groq_api_key=rows.get("groq_api_key", os.environ.get("GROQ_API_KEY", "")),
        theme=rows.get("theme", "system"),
    )


def save_settings(s: AppSettings) -> AppSettings:
    """Persist application settings to the settings table."""
    conn = _get_db()
    cursor = conn.cursor()
    data = [
        ("risk_threshold", str(s.risk_threshold)),
        ("email_alerts", "1" if s.email_alerts else "0"),
        ("auto_assign", "1" if s.auto_assign else "0"),
        ("language", s.language),
        ("groq_api_key", s.groq_api_key or ""),
        ("theme", s.theme or "system"),
    ]
    for k, v in data:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))
    conn.commit()
    conn.close()
    return s
