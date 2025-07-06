# FastAPI 설정 및 JWT 인증 적용 (기존 내용과 통합)
from fastapi import FastAPI, Query, HTTPException, Depends, status, Body, Path, APIRouter, Form, File, UploadFile
from pydantic import BaseModel
import pymysql
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import db_config
from jwt_auth import create_access_token, get_current_user, is_admin, is_pm
import bcrypt
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter
from typing import Optional, Dict, List
import traceback
import sys
import os
from dotenv import load_dotenv

app = FastAPI(title="HumanMakeHub API", description="FastAPI + pymysql + JWT 인증 기반 플랫폼 API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

from fastapi.middleware.cors import CORSMiddleware
load_dotenv()
# DB 설정
db_config = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "humanmakehub"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}
SECRET_KEY = os.getenv("SECRET_KEY", "dev")
ALGORITHM   = os.getenv("ALGORITHM", "HS256")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],  # 또는 ["http://127.0.0.1:3000"] 만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectFlexibleUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None
    pm: Optional[str] = None

# ✅ 클라이언트 프로젝트 등록용 모델
class ProjectCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    estimated_duration: int
    budget: int
    urgency: str

class RoleUpdate(BaseModel):
    role: str


@app.get("/")
async def root():
    return {"message": "Hello, HumanMakeHub 🚀"}
# --- 사용자 로그인 (JWT 발급) ---
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        # ✅ admin 하드코딩 로그인 처리
        if form_data.username == "admin" and form_data.password == "1208":
            access_token = create_access_token(data={"sub": "admin", "username": "admin"})  # ✅ 수정
            return {"access_token": access_token, "token_type": "bearer"}

        # ✅ 일반 회원 로그인 (DB 조회)
        conn = pymysql.connect(**db_config)
        cur = conn.cursor(pymysql.cursors.DictCursor)   # ✅ DictCursor
        cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
        user = cur.fetchone()

        if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user['password'].encode('utf-8')):
            raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

        access_token = create_access_token(data={"sub": str(user['id']), "username": user['username']})  # ✅ 수정
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print("🚨 에러 발생:", e)
        traceback.print_exc(file=sys.stdout)  # ✅ Traceback 추가
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

@app.get("/me")
def get_my_info(user: dict = Depends(get_current_user)):
    if str(user["id"]) == "admin":   # 주의: 문자열 "admin"과 비교
        return {
            "id": "admin",
            "email": "admin",
            "role": "admin",
            "nickname": "운영자",
            "username": "admin"
        }

    return {
    "id": user["id"],
    "email": user["email"],
    "role": user["role"],
    "username": user.get("username", "")
}

# ✅ 관리자용 전체 사용자 조회 API
@app.get("/admin/users")
def get_all_users(user: dict = Depends(get_current_user)):
    if str(user["id"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # ✅ 테이블에 username 컬럼이 이미 있으니 별칭 필요 없음
            cursor.execute("SELECT id, username, email, role FROM users")
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 관리자용 대시보드 통계 API ---
@app.get("/admin/stats")
def get_admin_stats(user: dict = Depends(get_current_user)):
    if str(user["id"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 유저 수
            cursor.execute("SELECT COUNT(*) as count FROM users")
            users_count = cursor.fetchone()["count"]

            # 프로젝트 수
            cursor.execute("SELECT COUNT(*) as count FROM projects")
            projects_count = cursor.fetchone()["count"]

            # 대기 중인 지급 요청 수
            cursor.execute("SELECT COUNT(*) as count FROM earnings WHERE status = '대기'")
            earnings_pending = cursor.fetchone()["count"]

            # 신고 수
            cursor.execute("SELECT COUNT(*) as count FROM reports")
            reports_count = cursor.fetchone()["count"]

        return {
            "users": users_count,
            "projects": projects_count,
            "earningsPending": earnings_pending,
            "reports": reports_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 메시지 전송 및 조회 ---
class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: int
    project_id: int
    content: str

@app.post("/messages")
def send_message(message: MessageCreate, user: dict = Depends(get_current_user)):
    print("📥 메시지 POST 요청 도착")
    print("🧾 메시지 내용:", message.dict())
    print("👤 인증된 사용자:", user)

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 프로젝트 정보 조회
            cursor.execute("SELECT client, pm FROM projects WHERE id = %s", (message.project_id,))
            project = cursor.fetchone()
            print("📌 프로젝트 정보:", project)

            if not project:
                raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

            # ✅ 관리자면 전송 허용, 아니면 client 또는 pm 여부 확인
            if user.get("role") != "admin" and user.get("username") not in (project["client"], project["pm"]):
                raise HTTPException(status_code=403, detail="이 프로젝트에 채팅 권한이 없습니다.")

            print("✅ 저장할 메시지 SQL 실행")
            cursor.execute("""
                INSERT INTO messages (sender_id, receiver_id, project_id, content, timestamp)
                VALUES (%s, %s, %s, %s, NOW())
            """, (message.sender_id, message.receiver_id, message.project_id, message.content))
        conn.commit()
        return {"message": "메시지 전송 완료"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
    finally:
        conn.close()


@app.get("/messages/{project_id}")
def get_project_messages(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT sender_id, content, timestamp
                FROM messages
                WHERE project_id = %s
                ORDER BY timestamp ASC
            """
            cursor.execute(sql, (project_id,))
            messages = cursor.fetchall()
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- 리뷰 등록 및 조회 ---
class ReviewCreate(BaseModel):
    project_id: int
    reviewer_id: int
    target_user_id: int
    rating: int
    comment: str

@app.post("/reviews")
def create_review(review: ReviewCreate):
    try:
        conn = pymysql.connect(**db_config)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO reviews (project_id, reviewer_id, target_user_id, rating, comment)
            VALUES (%s, %s, %s, %s, %s)
        """, (review.project_id, review.reviewer_id, review.target_user_id, review.rating, review.comment))
        conn.commit()
        return {"message": "리뷰 작성 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/reviews/{project_id}")
def get_reviews(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        cur = conn.cursor()
        cur.execute("SELECT * FROM reviews WHERE project_id = %s", (project_id,))
        return cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

router = APIRouter()

class PaymentAgreementCreate(BaseModel):
    project_id: int
    member_id: int
    start_date: str  # YYYY-MM-DD
    end_date: str
    payment_type: str  # "시급", "주급", "월급"
    amount: int

class PaymentAgreementUpdateStatus(BaseModel):
    status: str  # 상태 변경: 제안승인, 팀원수락, 정산요청, 정산접수, 정산진행중, 정산완료

# 제안 생성 (PM)
@router.post("/agreements")
def create_agreement(agreement: PaymentAgreementCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "pm":
        raise HTTPException(status_code=403, detail="PM만 제안할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO payment_agreements
                (project_id, pm_id, member_id, start_date, end_date, payment_type, amount, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, '제안대기', NOW())
            """
            cursor.execute(sql, (
                agreement.project_id,
                user["id"],
                agreement.member_id,
                agreement.start_date,
                agreement.end_date,
                agreement.payment_type,
                agreement.amount
            ))
        conn.commit()
        return {"message": "정산 제안이 등록되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# FastAPI - 관리자용 진행 중 프로젝트 조회 API
@router.get("/admin/ongoing_projects")
def get_ongoing_projects(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT id, title, status
                FROM projects
                WHERE status IN ('승인 대기', '진행 중', '디자인 중')
                ORDER BY id DESC;
            """)
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 관리자 상태 변경 (승인, 정산 상태 갱신 등)
@router.put("/agreements/{agreement_id}/status")
def update_agreement_status(agreement_id: int, update: PaymentAgreementUpdateStatus, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 상태를 변경할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # 이전 상태 확인
            cursor.execute("SELECT status FROM payment_agreements WHERE id = %s", (agreement_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="해당 제안을 찾을 수 없습니다.")
            old_status = result[0]

            # 상태 업데이트
            cursor.execute("UPDATE payment_agreements SET status = %s WHERE id = %s", (update.status, agreement_id))

            # 로그 기록
            cursor.execute("""
                INSERT INTO payment_logs (agreement_id, changed_by, old_status, new_status)
                VALUES (%s, %s, %s, %s)
            """, (agreement_id, user["username"], old_status, update.status))

        conn.commit()
        return {"message": "상태가 업데이트되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 팀원 수락 (멤버)
@router.put("/agreements/{agreement_id}/accept")
def accept_agreement(agreement_id: int, user: dict = Depends(get_current_user)):
    if user.get("role") != "member":
        raise HTTPException(status_code=403, detail="팀원만 수락할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE payment_agreements SET status = '팀원수락' WHERE id = %s AND member_id = %s", (agreement_id, user["id"]))
        conn.commit()
        return {"message": "제안을 수락하였습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 전체 제안 목록 조회 (관리자/PM)
@router.get("/agreements")
def list_agreements(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            if user.get("role") == "admin":
                cursor.execute("SELECT * FROM payment_agreements ORDER BY created_at DESC")
            elif user.get("role") == "pm":
                cursor.execute("SELECT * FROM payment_agreements WHERE pm_id = %s ORDER BY created_at DESC", (user["id"],))
            else:
                raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# --- 팀 구성 등록 ---
class ProjectTeamCreate(BaseModel):
    project_id: int
    user_id: int
    role_in_project: str

# 팀원 추가
@app.post("/teams")
def add_team_member(team: ProjectTeamCreate):
    try:
        conn = pymysql.connect(**db_config)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO project_teams (project_id, user_id, role_in_project)
            VALUES (%s, %s, %s)
        """, (team.project_id, team.user_id, team.role_in_project))
        conn.commit()
        return {"message": "팀원 추가 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# 팀원 조회 (단일)
@app.get("/teams/{project_id}")
def get_team_members(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT u.id AS user_id, u.username
                FROM users u
                JOIN project_teams t ON u.id = t.user_id
                WHERE t.project_id = %s
            """, (project_id,))
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 팀원 삭제
@app.delete("/teams/{team_id}")
def delete_team_member(team_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM project_teams WHERE id = %s", (team_id,))
        conn.commit()
        return {"message": "팀원 삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 알림 생성 ---
class NotificationCreate(BaseModel):
    user_id: int
    event_type: str
    message: str

@app.post("/notifications")
def create_notification(notification: NotificationCreate):
    try:
        conn = pymysql.connect(**db_config)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO notifications (user_id, event_type, message)
            VALUES (%s, %s, %s)
        """, (notification.user_id, notification.event_type, notification.message))
        conn.commit()
        return {"message": "알림 생성 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# --- 신고 기능 ---
class ReportCreate(BaseModel):
    reporter_id: int
    target_user_id: int
    reason: str

@app.post("/reports")
def report_user(report: ReportCreate):
    try:
        conn = pymysql.connect(**db_config)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO reports (reporter_id, target_user_id, reason)
            VALUES (%s, %s, %s)
        """, (report.reporter_id, report.target_user_id, report.reason))
        conn.commit()
        return {"message": "신고 접수 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# ✅ 역할 수정 API
@app.put("/admin/users/{user_id}")
def update_user_role(user_id: int, update: RoleUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = "UPDATE users SET role = %s WHERE id = %s"
            cursor.execute(sql, (update.role, user_id))  # ✅ update.role
        conn.commit()
        return {"message": "사용자 역할이 수정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ✅ 사용자 삭제 API
@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = "DELETE FROM users WHERE id = %s"
            cursor.execute(sql, (user_id,))
        conn.commit()
        conn.close()
        return {"message": "사용자가 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

    # --- 프로젝트 모델
class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    estimated_duration: int
    budget: int
    urgency: str

class ProjectUpdate(BaseModel):
    status: str
    progress: int

# --- 전체 프로젝트 가져오기
@app.get("/projects")
def get_all_projects():
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = "SELECT * FROM projects"
            cursor.execute(sql)
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 특정 프로젝트 가져오기
@app.get("/projects/{project_id}")
def get_project_detail(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = "SELECT * FROM projects WHERE id = %s"
            cursor.execute(sql, (project_id,))
            result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 프로젝트 수정 (상태, 진행률)
@app.put("/projects/{project_id}")
def update_project(project_id: int, project: ProjectFlexibleUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            fields = []
            values = []

            # 🔍 디버깅: 요청 데이터 출력
            print("📥 [PUT /projects] 받은 project_id:", project_id)
            print("📥 받은 데이터:", project.dict())

            if project.status is not None:
                print("✅ 상태(status) 업데이트:", project.status)
                fields.append("status = %s")
                values.append(project.status)
            if project.progress is not None:
                print("✅ 진행률(progress) 업데이트:", project.progress)
                fields.append("progress = %s")
                values.append(project.progress)
            if project.pm is not None:
                print("✅ PM 지정(pm):", project.pm)
                fields.append("pm = %s")
                values.append(project.pm)

            if not fields:
                print("⚠️ 업데이트할 필드 없음")
                raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다.")

            sql = f"UPDATE projects SET {', '.join(fields)} WHERE id = %s"
            values.append(project_id)

            # 🔍 디버깅: 최종 SQL 확인
            print("📄 실행할 SQL:", sql)
            print("📦 SQL 값:", values)

            cursor.execute(sql, tuple(values))
        conn.commit()
        return {"message": "프로젝트 업데이트 완료"}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 프로젝트 삭제
@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = "DELETE FROM projects WHERE id = %s"
            cursor.execute(sql, (project_id,))
        conn.commit()
        return {"message": "프로젝트 삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 회원가입 모델 ---
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None
    portfolio: Optional[str] = None
    nickname: Optional[str] = None
    skills: Optional[str] = None
    career: Optional[str] = None
    contact: Optional[str] = None

@app.post("/register")
def register_user(user: UserRegister):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # 중복 확인
            cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")

            cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

            # 비밀번호 암호화
            hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # 회원 정보 저장
            sql = """
                INSERT INTO users (
                    username, email, password, role,
                    phone, company, portfolio,
                    nickname, skills, career, contact
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                user.username,
                user.email,
                hashed_password,
                user.role,
                user.phone,
                user.company,
                user.portfolio,
                user.nickname,
                user.skills,
                user.career,
                user.contact
            ))

        conn.commit()
        return {"message": "회원가입이 완료되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ✅ 새 요청모델
class DuplicateCheckRequest(BaseModel):
    username: str
    email: str
    nickname: str

@app.post("/check-duplicate")
def check_duplicate(data: DuplicateCheckRequest):
    result = {
        "usernameExists": False,
        "emailExists": False,
        "nicknameExists": False
    }

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            if data.username:
                cursor.execute("SELECT id FROM users WHERE username = %s", (data.username,))
                result["usernameExists"] = cursor.fetchone() is not None

            if data.email:
                cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
                result["emailExists"] = cursor.fetchone() is not None

            if data.nickname:
                cursor.execute("SELECT id FROM users WHERE nickname = %s", (data.nickname,))
                result["nicknameExists"] = cursor.fetchone() is not None

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 작업(Task) 모델 ---
class TaskUpdate(BaseModel):
    status: str
    progress: int

# --- 작업(Task) 생성 ---
@app.post("/tasks")
def create_task(
    project_id: int = Form(...),
    title: str = Form(...),
    assignee_id: int = Form(...),
    priority: str = Form(...),
    start_date: str = Form(None),
    due_date: str = Form(None),
    file: UploadFile = File(None)
):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            file_url = None

            os.makedirs("uploaded_files", exist_ok=True)

            if file:
                file_location = f"uploaded_files/{file.filename}"
                with open(file_location, "wb") as f:
                    f.write(file.file.read())
                file_url = file_location

            sql = """
                INSERT INTO tasks (
                    project_id, title, assignee_id, priority,
                    start_date, due_date, file_url, status, progress
                    )
                VALUES (%s, %s, %s, %s, %s, %s, %s, '대기', 0)
            """
            cursor.execute(sql, (
                project_id, title, assignee_id, priority,
                start_date, due_date, file_url
            ))
        conn.commit()
        return {"message": "작업(Task) 생성 완료"}
    except Exception as e:
        import traceback
        traceback.print_exc()  # 서버 로그에 전체 스택 출력
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 특정 프로젝트의 작업 리스트 조회 ---
@app.get("/tasks/{project_id}")
def get_tasks(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM tasks WHERE project_id = %s", (project_id,))
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 작업(Task) 수정 ---
@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE tasks SET status = %s, progress = %s WHERE id = %s",
                (task.status, task.progress, task_id)
            )
        conn.commit()
        return {"message": "작업(Task) 수정 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# --- 작업(Task) 삭제 ---
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
        return {"message": "작업(Task) 삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ✅ 클라이언트 프로젝트 등록 API
@app.post("/client/projects")
def create_client_project(project: ProjectCreateRequest, user: dict = Depends(get_current_user)):
    if user.get("role") != "client":
        raise HTTPException(status_code=403, detail="클라이언트만 프로젝트를 등록할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO projects (
                    title, description, client, client_id, category,
                    estimated_duration, budget, urgency, status, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, '승인 대기', NOW())  -- ✅ 공백 제거
            """
            cursor.execute(sql, (
                project.title,
                project.description,
                user["username"],
                user["id"],
                project.category,
                project.estimated_duration,
                project.budget,
                project.urgency
            ))
        conn.commit()
        return {"message": "프로젝트 등록이 완료되었습니다."}
    except Exception as e:
        print("🚨 에러 발생:", e)
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/client/projects")
def get_client_projects(user: dict = Depends(get_current_user)):
    try:
        if user.get("role") != "client":
            raise HTTPException(status_code=403, detail="클라이언트만 자신의 프로젝트를 조회할 수 있습니다.")

        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT id, title, description, status, created_at, estimated_duration, budget, category, urgency, pm, progress
                FROM projects
                WHERE client = %s
                ORDER BY created_at DESC
            """
            cursor.execute(sql, (user["username"],))
            result = cursor.fetchall()
        return result
    except Exception as e:
        print("🚨 오류 발생:", e)
        import traceback, sys
        traceback.print_exc(file=sys.stdout)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ✅ PM 배정 API
@app.put("/admin/assign_pm/{project_id}")
def assign_pm_to_project(project_id: int, pm_username: str = Body(..., embed=True)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = "UPDATE projects SET pm = %s WHERE id = %s"
            cursor.execute(sql, (pm_username, project_id))
        conn.commit()
        return {"message": "PM 배정이 완료되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()





#팀원 배정
class JoinRequestCreate(BaseModel):
    project_id: int
    user_id: int
    role_in_project: str  # "팀원" 같은 역할

class JoinRequestUpdate(BaseModel):
    action: str  # "accept" or "reject"

@app.post("/join_requests")
def create_join_request(request: JoinRequestCreate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO join_requests (project_id, user_id, role_in_project, status, created_at)
                VALUES (%s, %s, %s, '대기 중', NOW())
            """
            cursor.execute(sql, (
                request.project_id,
                request.user_id,
                request.role_in_project
            ))
        conn.commit()
        return {"message": "참여 요청이 전송되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/join_requests/{request_id}/accept")
def accept_join_request(request_id: int):
    try:
        conn = pymysql.connect(**db_config)   # ✅ 수정
        with conn.cursor() as cursor:
            # 요청을 수락 상태로 변경
            cursor.execute("""
                UPDATE join_requests
                SET status = '수락됨'
                WHERE id = %s
            """, (request_id,))

            # 요청 정보 가져오기
            cursor.execute("""
                SELECT project_id, user_id, role_in_project
                FROM join_requests
                WHERE id = %s
            """, (request_id,))
            join_request = cursor.fetchone()

            if not join_request:
                raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

            # 팀원 테이블에 추가
            cursor.execute("""
                INSERT INTO project_teams (project_id, user_id, role_in_project)
                VALUES (%s, %s, %s)
            """, (
                join_request["project_id"],
                join_request["user_id"],
                join_request["role_in_project"]
            ))

        conn.commit()
        return {"message": "참여 요청이 수락되었습니다."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if 'conn' in locals():
            conn.close()

@app.put("/join_requests/{request_id}/reject")
def reject_join_request(request_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE join_requests
                SET status = '거절됨'
                WHERE id = %s
            """, (request_id,))
        conn.commit()
        return {"message": "참여 요청이 거절되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/join_requests/mine")
def get_my_join_requests(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)  # ✅ cursorclass 추가하지 마
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT * FROM join_requests
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user["id"],))
            requests = cursor.fetchall()
        return requests
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals():
            conn.close()  # ✅ 안전하게 닫기

@app.get("/tasks/mine")
def get_my_tasks(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT * FROM tasks WHERE assignee_id = %s
            """
            cursor.execute(sql, (user["id"],))
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

app.include_router(router)