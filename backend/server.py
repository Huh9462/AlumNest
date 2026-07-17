from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import json
import uuid
import bcrypt
import jwt as pyjwt
import logging
from datetime import datetime, timezone, timedelta, time as dtime
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------------- Setup ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

app = FastAPI(title="Alumnest API")
api = APIRouter(prefix="/api")
bearer_scheme = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("alumnest")

# ---------------- Helpers ----------------
def now_utc():
    return datetime.now(timezone.utc)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(days=7),
        "iat": now_utc(),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def user_public(u: dict) -> dict:
    u = {**u}
    u.pop("password_hash", None)
    u.pop("argus_password_hash", None)
    u.pop("_id", None)
    return u

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(401, "User not found")
    return user

# ---------------- Models ----------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)
    role: str  # "alumni" or "junior"
    school: str
    grade: Optional[str] = None  # for juniors: 9,10,11,12
    college: Optional[str] = None  # for alumni: current college
    stream: Optional[str] = None  # science, commerce, arts, engineering, etc.
    bio: Optional[str] = ""
    working_hours_start: Optional[str] = "14:00"  # HH:MM
    working_hours_end: Optional[str] = "16:00"
    id_card_base64: str  # required proof of student status
    avatar_url: Optional[str] = None
    # Optional Argus (Lighthouse Learning EuroSchool portal) linking
    argus_id: Optional[str] = None  # Enrollment # / Phone / User ID
    argus_password: Optional[str] = None  # user-set password to log back in via Argus
    argus_role: Optional[str] = None  # "student" | "staff" | "parent"

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class ArgusLoginInput(BaseModel):
    argus_id: str = Field(min_length=1)
    argus_password: str = Field(min_length=1)
    argus_role: Optional[str] = "student"

class UpdateProfileInput(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    college: Optional[str] = None
    stream: Optional[str] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None

class AluPalInput(BaseModel):
    target_college: str
    stream: str
    grade: Optional[str] = None
    note: Optional[str] = ""

class LogHelpInput(BaseModel):
    mentor_id: str
    junior_note: Optional[str] = ""

class SendMessageInput(BaseModel):
    recipient_id: str
    text: str = Field(min_length=1, max_length=2000)

# ---------------- Auth Routes ----------------
@api.post("/auth/register")
async def register(body: RegisterInput):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    if body.role not in ("alumni", "junior"):
        raise HTTPException(400, "role must be alumni or junior")

    # If linking Argus, ensure argus_id is unique
    argus_id_norm = None
    argus_password_hash = None
    if body.argus_id:
        argus_id_norm = body.argus_id.strip()
        if not body.argus_password or len(body.argus_password) < 4:
            raise HTTPException(400, "Argus password must be at least 4 characters")
        if await db.users.find_one({"argus_id": argus_id_norm}):
            raise HTTPException(400, "This Argus ID is already linked to another account")
        argus_password_hash = hash_password(body.argus_password)

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "role": body.role,
        "school": body.school,
        "grade": body.grade,
        "college": body.college,
        "stream": body.stream,
        "bio": body.bio or "",
        "working_hours_start": body.working_hours_start or "14:00",
        "working_hours_end": body.working_hours_end or "16:00",
        "id_card_base64": body.id_card_base64,
        "avatar_url": body.avatar_url,
        "argus_id": argus_id_norm,
        "argus_password_hash": argus_password_hash,
        "argus_role": body.argus_role,
        "argus_linked": bool(argus_id_norm),
        "id_verified": True,  # Auto-verified in MVP (Phase 2: manual review)
        "points": 0,
        "juniors_helped": 0,
        "streak_days": 0,
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, email)
    return {"token": token, "user": user_public(doc)}

@api.post("/auth/login")
async def login(body: LoginInput):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"], email)
    return {"token": token, "user": user_public(user)}

@api.post("/auth/argus-login")
async def argus_login(body: ArgusLoginInput):
    """Log in with a linked Argus (Lighthouse Learning EuroSchool) ID + password.

    Note: Alumnest cannot verify credentials against the live Argus portal without an
    official Lighthouse Learning API. Users set an Argus password at signup which is
    what we verify here. Once Lighthouse Learning exposes a server-to-server verify
    endpoint we will swap this to a real handshake.
    """
    argus_id = body.argus_id.strip()
    user = await db.users.find_one({"argus_id": argus_id})
    if not user or not user.get("argus_password_hash"):
        raise HTTPException(401, "No Alumnest account linked to that Argus ID. Sign up first.")
    if not verify_password(body.argus_password, user["argus_password_hash"]):
        raise HTTPException(401, "Invalid Argus ID or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": user_public(user)}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user_public(user)

@api.put("/auth/me")
async def update_me(body: UpdateProfileInput, user=Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]})
    return user_public(fresh)

# ---------------- Alumni Directory ----------------
@api.get("/alumni")
async def list_alumni(college: Optional[str] = None, stream: Optional[str] = None, q: Optional[str] = None):
    query = {"role": "alumni", "id_verified": True}
    if college:
        query["college"] = {"$regex": re.escape(college), "$options": "i"}
    if stream:
        query["stream"] = {"$regex": re.escape(stream), "$options": "i"}
    if q:
        query["$or"] = [
            {"name": {"$regex": re.escape(q), "$options": "i"}},
            {"college": {"$regex": re.escape(q), "$options": "i"}},
            {"school": {"$regex": re.escape(q), "$options": "i"}},
        ]
    cursor = db.users.find(query).sort("points", -1).limit(60)
    return [user_public(u) for u in await cursor.to_list(60)]

@api.get("/alumni/{user_id}")
async def get_alumni(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    return user_public(user)

# ---------------- Leaderboard & Scorecard ----------------
def _conv_id(a: str, b: str) -> str:
    return "_".join(sorted([a, b]))

@api.get("/leaderboard")
async def leaderboard(scope: str = "all", school: Optional[str] = None):
    """scope: 'all' | 'week'. When scope='week', points are counted from help_logs
    in the last 7 days (10 pts per help)."""
    query = {"role": "alumni"}
    if school:
        query["school"] = {"$regex": re.escape(school), "$options": "i"}

    if scope == "week":
        since = (now_utc() - timedelta(days=7)).isoformat()
        # aggregate help_logs in window per mentor
        pipeline = [
            {"$match": {"created_at": {"$gte": since}}},
            {"$group": {"_id": "$mentor_id", "week_helped": {"$sum": 1}}},
        ]
        agg = await db.help_logs.aggregate(pipeline).to_list(1000)
        weekly = {a["_id"]: a["week_helped"] for a in agg}
        users = await db.users.find(query).to_list(500)
        rows = []
        for u in users:
            wh = weekly.get(u["id"], 0)
            rows.append((u, wh))
        rows.sort(key=lambda r: (r[1], r[0].get("points", 0)), reverse=True)
        result = []
        for i, (u, wh) in enumerate(rows[:50], start=1):
            pu = user_public(u)
            pu["rank"] = i
            pu["week_points"] = wh * 10
            pu["week_helped"] = wh
            result.append(pu)
        return result

    cursor = db.users.find(query).sort([("points", -1), ("juniors_helped", -1)]).limit(50)
    users = await cursor.to_list(50)
    result = []
    for i, u in enumerate(users, start=1):
        pu = user_public(u)
        pu["rank"] = i
        result.append(pu)
    return result

@api.get("/leaderboard/schools")
async def leaderboard_schools():
    schools = await db.users.distinct("school", {"role": "alumni"})
    return sorted([s for s in schools if s])

@api.get("/certificate/me")
async def my_certificate(user=Depends(get_current_user)):
    # rank calculation
    higher = await db.users.count_documents({
        "role": "alumni",
        "points": {"$gt": user.get("points", 0)}
    })
    rank = higher + 1 if user.get("role") == "alumni" else None
    total = await db.users.count_documents({"role": "alumni"})
    percentile = None
    if rank and total:
        percentile = max(1, round(100 * (1 - (rank - 1) / max(total, 1))))
    return {
        "user": user_public(user),
        "rank": rank,
        "total_alumni": total,
        "percentile": percentile,
        "issued_at": now_utc().isoformat(),
        "certificate_id": f"ALN-{user['id'][:8].upper()}",
    }

@api.post("/mentor/log-help")
async def log_help(body: LogHelpInput, user=Depends(get_current_user)):
    """Junior logs that a mentor helped them. Awards points to the mentor.
    Phase 2 will require mentor-side proof submission."""
    if user["role"] != "junior":
        raise HTTPException(403, "Only juniors can log help received")
    mentor = await db.users.find_one({"id": body.mentor_id, "role": "alumni"})
    if not mentor:
        raise HTTPException(404, "Mentor not found")
    # prevent duplicate quick logs from same junior->mentor in 24h
    since = (now_utc() - timedelta(hours=24)).isoformat()
    existing = await db.help_logs.find_one({
        "junior_id": user["id"], "mentor_id": body.mentor_id, "created_at": {"$gt": since}
    })
    if existing:
        raise HTTPException(400, "You already logged this mentor recently")
    await db.help_logs.insert_one({
        "id": str(uuid.uuid4()),
        "junior_id": user["id"],
        "mentor_id": body.mentor_id,
        "note": body.junior_note or "",
        "created_at": now_utc().isoformat(),
    })
    await db.users.update_one(
        {"id": body.mentor_id},
        {"$inc": {"points": 10, "juniors_helped": 1}}
    )
    return {"ok": True, "points_awarded": 10}

# ---------------- Chat ----------------
def _alumni_available_now(alumni_user: dict) -> bool:
    return is_available_now(alumni_user)

def _minutes_until_window(alumni_user: dict) -> Optional[int]:
    s = _parse_time(alumni_user.get("working_hours_start") or "")
    if not s:
        return None
    now = datetime.now(timezone.utc)
    now_min = now.hour * 60 + now.minute
    s_min = s.hour * 60 + s.minute
    diff = s_min - now_min
    if diff < 0:
        diff += 24 * 60
    return diff

@api.post("/chat/send")
async def chat_send(body: SendMessageInput, user=Depends(get_current_user)):
    recipient = await db.users.find_one({"id": body.recipient_id})
    if not recipient:
        raise HTTPException(404, "Recipient not found")
    if recipient["id"] == user["id"]:
        raise HTTPException(400, "Cannot message yourself")

    # Enforce working-hours boundary: junior -> alumni only during window,
    # unless the alumni has added this junior as a trusted connection.
    if user["role"] == "junior" and recipient["role"] == "alumni":
        trusted_ids = recipient.get("trusted_ids") or []
        if user["id"] not in trusted_ids and not _alumni_available_now(recipient):
            mins = _minutes_until_window(recipient) or 0
            h, m = mins // 60, mins % 60
            open_in = f"{h}h {m}m" if h else f"{m}m"
            raise HTTPException(
                423,
                f"{recipient['name']}'s working hours are closed. Opens in {open_in} "
                f"({recipient.get('working_hours_start')}–{recipient.get('working_hours_end')})."
            )

    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": _conv_id(user["id"], recipient["id"]),
        "sender_id": user["id"],
        "recipient_id": recipient["id"],
        "text": body.text.strip(),
        "created_at": now_utc().isoformat(),
        "read": False,
    }
    await db.messages.insert_one(msg)
    msg.pop("_id", None)
    return msg

@api.get("/chat/conversations")
async def chat_conversations(user=Depends(get_current_user)):
    """List conversations for current user with the counterpart's profile + last message + unread."""
    pipeline = [
        {"$match": {"$or": [{"sender_id": user["id"]}, {"recipient_id": user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$conversation_id",
            "last": {"$first": "$$ROOT"},
            "messages": {"$push": "$$ROOT"},
        }},
        {"$sort": {"last.created_at": -1}},
        {"$limit": 100},
    ]
    convs = await db.messages.aggregate(pipeline).to_list(100)
    out = []
    for c in convs:
        last = c["last"]
        other_id = last["recipient_id"] if last["sender_id"] == user["id"] else last["sender_id"]
        other = await db.users.find_one({"id": other_id})
        if not other:
            continue
        unread = sum(1 for m in c["messages"] if m["recipient_id"] == user["id"] and not m.get("read"))
        out.append({
            "conversation_id": c["_id"],
            "other": user_public(other),
            "last_message": {
                "text": last["text"],
                "sender_id": last["sender_id"],
                "created_at": last["created_at"],
            },
            "unread": unread,
        })
    return out

@api.get("/chat/messages/{other_id}")
async def chat_messages(other_id: str, user=Depends(get_current_user)):
    other = await db.users.find_one({"id": other_id})
    if not other:
        raise HTTPException(404, "User not found")
    conv = _conv_id(user["id"], other_id)
    msgs = await db.messages.find({"conversation_id": conv}).sort("created_at", 1).to_list(500)
    # mark incoming as read
    await db.messages.update_many(
        {"conversation_id": conv, "recipient_id": user["id"], "read": False},
        {"$set": {"read": True}},
    )
    trusted_ids = other.get("trusted_ids") or []
    return {
        "other": user_public(other),
        "messages": [{k: v for k, v in m.items() if k != "_id"} for m in msgs],
        "can_send_now": (
            True if user["role"] == "alumni"
            else (user["id"] in trusted_ids or _alumni_available_now(other))
            if other["role"] == "alumni" else True
        ),
        "is_trusted": user["id"] in trusted_ids,
        "next_open_in_min": _minutes_until_window(other) if other["role"] == "alumni" else None,
    }

@api.post("/chat/trusted/{junior_id}")
async def trusted_add(junior_id: str, user=Depends(get_current_user)):
    if user["role"] != "alumni":
        raise HTTPException(403, "Only alumni can add trusted connections")
    junior = await db.users.find_one({"id": junior_id})
    if not junior:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"id": user["id"]}, {"$addToSet": {"trusted_ids": junior_id}})
    return {"ok": True, "trusted": True}

@api.delete("/chat/trusted/{junior_id}")
async def trusted_remove(junior_id: str, user=Depends(get_current_user)):
    if user["role"] != "alumni":
        raise HTTPException(403, "Only alumni can manage trusted connections")
    await db.users.update_one({"id": user["id"]}, {"$pull": {"trusted_ids": junior_id}})
    return {"ok": True, "trusted": False}


# ---------------- AluPal AI ----------------
def _parse_time(t: str) -> Optional[dtime]:
    try:
        hh, mm = t.split(":")
        return dtime(int(hh), int(mm))
    except Exception:
        return None

def is_available_now(user: dict) -> bool:
    s = _parse_time(user.get("working_hours_start") or "")
    e = _parse_time(user.get("working_hours_end") or "")
    if not s or not e:
        return False
    now = datetime.now(timezone.utc).time()
    # IST offset simple: users set hours as local; MVP treats as UTC window
    if s <= e:
        return s <= now <= e
    return now >= s or now <= e

@api.post("/alupal/match")
async def alupal_match(body: AluPalInput, user=Depends(get_current_user)):
    # 1. Pre-fetch candidate alumni from DB
    query = {"role": "alumni", "id_verified": True}
    candidates_cursor = db.users.find(query).limit(30)
    candidates = [user_public(u) for u in await candidates_cursor.to_list(30)]

    if not candidates:
        return {
            "reasoning": "No alumni are registered yet for this college/stream. Be the first to invite a senior to join Alumnest!",
            "matches": [],
        }

    # Rank locally: exact college > stream match > points
    def score(c):
        s = 0
        if c.get("college") and body.target_college.lower() in c["college"].lower():
            s += 100
        if c.get("stream") and body.stream.lower() in (c["stream"] or "").lower():
            s += 40
        s += min(int(c.get("points", 0)), 200) / 10
        return s

    candidates.sort(key=score, reverse=True)
    top = candidates[:5]

    # 2. Ask Claude for a friendly reasoning + why each match fits
    system = (
        "You are AluPal, a warm and supportive AI mentor-matcher for Indian students. "
        "You help juniors (grades 9-12) find alumni mentors who can guide them about college admissions and career paths. "
        "Reply in encouraging, calm tone (12th graders are stressed). "
        "Return STRICT JSON only, no markdown, matching this shape: "
        "{\"reasoning\": string, \"why\": [{\"id\": string, \"reason\": string}] }. "
        "Keep reasoning under 60 words. Keep each 'reason' under 20 words."
    )
    payload = {
        "junior_target_college": body.target_college,
        "junior_stream": body.stream,
        "junior_grade": body.grade or "unspecified",
        "junior_note": body.note or "",
        "candidates": [
            {"id": c["id"], "name": c.get("name"), "college": c.get("college"),
             "stream": c.get("stream"), "school": c.get("school"),
             "bio": (c.get("bio") or "")[:200], "points": c.get("points", 0)}
            for c in top
        ],
    }
    reasoning_text = "Here are the best mentors we found based on college and stream match, plus their community reputation."
    why_map = {}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"alupal-{user['id']}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-6")
        msg = UserMessage(text=json.dumps(payload))
        raw = await chat.send_message(msg)
        raw = raw.strip()
        # try to extract JSON if wrapped
        m = re.search(r"\{.*\}", raw, re.S)
        if m:
            data = json.loads(m.group(0))
            if isinstance(data.get("reasoning"), str):
                reasoning_text = data["reasoning"]
            for item in data.get("why", []):
                if isinstance(item, dict) and item.get("id"):
                    why_map[item["id"]] = item.get("reason", "")
    except Exception as ex:
        log.warning(f"AluPal LLM fallback: {ex}")

    matches = []
    for c in top:
        matches.append({
            **c,
            "available_now": is_available_now(c),
            "why": why_map.get(c["id"], "Strong fit based on college/stream and mentor reputation."),
        })

    return {"reasoning": reasoning_text, "matches": matches}

# ---------------- Health ----------------
@api.get("/")
async def root():
    return {"service": "alumnest", "status": "ok"}

# ---------------- Startup ----------------
async def seed_demo():
    """Seed demo alumni if none exist so the app has content for the aha-moment."""
    count = await db.users.count_documents({"role": "alumni"})
    if count > 0:
        return
    demos = [
        {"name": "Aarav Mehta", "email": "aarav@demo.alumnest.io", "college": "IIT Bombay",
         "stream": "Computer Science", "school": "Lighthouse Prep, Mumbai",
         "bio": "CS undergrad. Cracked JEE Advanced 2023. Happy to help with prep strategy and hostel life.",
         "points": 240, "juniors_helped": 24, "hours": ("14:00", "16:00")},
        {"name": "Priya Nair", "email": "priya@demo.alumnest.io", "college": "AIIMS Delhi",
         "stream": "Medical", "school": "Lighthouse South, Chennai",
         "bio": "MBBS 2nd year. NEET topper. Ask me about biology strategy and mental well-being during prep.",
         "points": 310, "juniors_helped": 33, "hours": ("18:00", "20:00")},
        {"name": "Kabir Shah", "email": "kabir@demo.alumnest.io", "college": "SRCC Delhi",
         "stream": "Commerce", "school": "Lighthouse North, Delhi",
         "bio": "B.Com Hons. CUET rank 42. I love helping juniors with applications and interviews.",
         "points": 180, "juniors_helped": 19, "hours": ("15:00", "17:00")},
        {"name": "Ishaan Roy", "email": "ishaan@demo.alumnest.io", "college": "NLSIU Bangalore",
         "stream": "Law", "school": "Lighthouse Prep, Mumbai",
         "bio": "3rd-year law student. CLAT AIR 87. Guidance on essays and mocks.",
         "points": 210, "juniors_helped": 21, "hours": ("19:00", "21:00")},
        {"name": "Meera Iyer", "email": "meera@demo.alumnest.io", "college": "NID Ahmedabad",
         "stream": "Design", "school": "Lighthouse West, Pune",
         "bio": "Design student at NID. Portfolio reviews and UCEED tips welcome.",
         "points": 150, "juniors_helped": 16, "hours": ("11:00", "13:00")},
        {"name": "Rohan Verma", "email": "rohan@demo.alumnest.io", "college": "IIM Ahmedabad",
         "stream": "Management", "school": "Lighthouse South, Chennai",
         "bio": "MBA. CAT 99.8 percentile. I help juniors plan long-term careers in business.",
         "points": 275, "juniors_helped": 28, "hours": ("20:00", "22:00")},
        {"name": "Sanya Kapoor", "email": "sanya@demo.alumnest.io", "college": "IIT Delhi",
         "stream": "Engineering Physics", "school": "Lighthouse North, Delhi",
         "bio": "Working in ML research. Happy to guide about JEE Physics and research careers.",
         "points": 195, "juniors_helped": 20, "hours": ("14:00", "16:00")},
        {"name": "Dev Patel", "email": "dev@demo.alumnest.io", "college": "BITS Pilani",
         "stream": "Electronics", "school": "Lighthouse West, Pune",
         "bio": "BITSAT strategy, campus life at Pilani, and internship advice.",
         "points": 130, "juniors_helped": 14, "hours": ("17:00", "19:00")},
    ]
    pw_hash = hash_password("Demo@2026")
    for d in demos:
        s, e = d.pop("hours")
        doc = {
            "id": str(uuid.uuid4()),
            "email": d["email"],
            "password_hash": pw_hash,
            "name": d["name"],
            "role": "alumni",
            "school": d["school"],
            "grade": None,
            "college": d["college"],
            "stream": d["stream"],
            "bio": d["bio"],
            "working_hours_start": s,
            "working_hours_end": e,
            "id_card_base64": "",
            "avatar_url": None,
            "id_verified": True,
            "points": d["points"],
            "juniors_helped": d["juniors_helped"],
            "streak_days": 5,
            "created_at": now_utc().isoformat(),
        }
        await db.users.insert_one(doc)
    log.info(f"Seeded {len(demos)} demo alumni")

async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@alumnest.io").lower()
    pw = os.environ.get("ADMIN_PASSWORD", "Alumnest@2026")
    existing = await db.users.find_one({"email": email})
    if existing:
        if not verify_password(pw, existing.get("password_hash", "")):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})
        return
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(pw),
        "name": "Alumnest Admin",
        "role": "admin",
        "school": "Alumnest HQ",
        "college": None,
        "stream": None,
        "bio": "System admin",
        "working_hours_start": "10:00",
        "working_hours_end": "18:00",
        "id_card_base64": "",
        "id_verified": True,
        "points": 0,
        "juniors_helped": 0,
        "streak_days": 0,
        "created_at": now_utc().isoformat(),
    })

@app.on_event("startup")
async def _startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    # Argus ID: only enforce uniqueness when it's actually set (partial index)
    try:
        await db.users.drop_index("argus_id_1")
    except Exception:
        pass
    await db.users.create_index(
        "argus_id",
        unique=True,
        partialFilterExpression={"argus_id": {"$type": "string"}},
    )
    await db.messages.create_index([("conversation_id", 1), ("created_at", 1)])
    await db.messages.create_index("recipient_id")
    await db.help_logs.create_index("created_at")
    await db.help_logs.create_index("mentor_id")
    await seed_admin()
    await seed_demo()

@app.on_event("shutdown")
async def _shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
