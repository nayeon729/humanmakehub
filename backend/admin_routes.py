# FastAPI 설정 및 JWT 인증 적용
from fastapi import FastAPI, HTTPException, Depends, Body, APIRouter
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HumanMakeHub API", description="FastAPI + pymysql + JWT 인증 기반 플랫폼 API")
router = APIRouter()

# --- 필요한 모델 ---
class RoleUpdate(BaseModel):
    role: str

class PaymentAgreementUpdateStatus(BaseModel):
    status: str  # e.g. 제안승인, 팀원수락, 정산요청 등


# --- 관리자(Admin, PM) 전용 라우터 ---

@app.get("/admin/users")
def get_all_users(user: dict = Depends(get_current_user)):
    if str(user["id"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT id, username, email, role FROM users")
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/admin/stats")
def get_admin_stats(user: dict = Depends(get_current_user)):
    if str(user["id"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users")
            users_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM projects")
            projects_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM earnings WHERE status = '대기'")
            earnings_pending = cursor.fetchone()["count"]

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
                ORDER BY id DESC
            """)
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/agreements/{agreement_id}/status")
def update_agreement_status(agreement_id: int, update: PaymentAgreementUpdateStatus, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="관리자만 상태를 변경할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("SELECT status FROM payment_agreements WHERE id = %s", (agreement_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="해당 제안을 찾을 수 없습니다.")
            old_status = result[0]

            cursor.execute("UPDATE payment_agreements SET status = %s WHERE id = %s", (update.status, agreement_id))
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

@app.put("/admin/users/{user_id}")
def update_user_role(user_id: int, update: RoleUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET role = %s WHERE id = %s", (update.role, user_id))
        conn.commit()
        return {"message": "사용자 역할이 수정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        return {"message": "사용자가 삭제되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/admin/assign_pm/{project_id}")
def assign_pm_to_project(project_id: int, pm_username: str = Body(..., embed=True)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE projects SET pm = %s WHERE id = %s", (pm_username, project_id))
        conn.commit()
        return {"message": "PM 배정이 완료되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ✅ 라우터 포함
app.include_router(router)
