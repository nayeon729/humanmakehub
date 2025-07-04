from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user

router = APIRouter( tags=["Admin"])

# --- 필요한 모델 ---
class RoleUpdate(BaseModel):
    role: str

class PaymentAgreementUpdateStatus(BaseModel):
    status: str  # e.g. 제안승인, 팀원수락, 정산요청 등


# --- 관리자(Admin, PM) 전용 라우터 ---

@router.get("/users")
def get_all_users(user: dict = Depends(get_current_user)):
    if str(user["role"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # del_yn 포함해서 보내기!
            cursor.execute("SELECT user_id, nickname, email, role, del_yn FROM user")
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/stats")
def get_admin_stats(user: dict = Depends(get_current_user)):
    if str(user["role"]) != "admin":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM user")
            user_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM project")
            project_count = cursor.fetchone()["count"]

        return {
            "user": user_count,
            "project": project_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/ongoing_projects")
def get_ongoing_projects(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT project_id, title, status
                FROM project
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

@router.put("/users/{user_id}")
def update_user_role(user_id: str, update: RoleUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE user SET role = %s WHERE user_id = %s", (update.role, user_id))
        conn.commit()
        return {"message": "사용자 역할이 수정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE user SET del_yn = 'Y' WHERE user_id = %s", (user_id,))
        conn.commit()
        return {"message": "사용자가 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@router.put("/users/{user_id}/recover")
def recover_user(user_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE user SET del_yn = 'N' WHERE user_id = %s", (user_id,))
        conn.commit()
        return {"message": "사용자가 복구되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/assign_pm/{project_id}")
def assign_pm_to_project(project_id: int, pm_id: str = Body(..., embed=True)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE project SET pm_id = %s WHERE project_id = %s", (pm_id, project_id))
        conn.commit()
        return {"message": "PM 배정이 완료되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



