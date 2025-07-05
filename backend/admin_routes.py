from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user

router = APIRouter( tags=["Admin"])

# --- 필요한 모델 ---
class GradeUpdate(BaseModel):
    grade:str

class RoleUpdate(BaseModel):
    role: str


class PaymentAgreementUpdateStatus(BaseModel):
    status: str  # e.g. 제안승인, 팀원수락, 정산요청 등

class PMAssignRequest(BaseModel):
    project_id: int

# --- 관리자(Admin, PM) 전용 라우터 ---

@router.get("/users")
def get_all_users(user: dict = Depends(get_current_user)):
    if str(user["role"]) != "R03":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT user_id, nickname, email, grade, role, del_yn FROM user")
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/stats")
def get_admin_stats(user: dict = Depends(get_current_user)):
    if str(user["role"]) != "R03":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM user WHERE del_yn = 'N'")
            user_count = cursor.fetchone()["count"]

            cursor.execute("SELECT COUNT(*) as count FROM project WHERE del_yn = 'N'")
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
    if user.get("role") != "R03":
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
    if user.get("role") != "R03":
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

@router.put("/users/{user_id}/grade")
def update_user_grade(user_id: str, update: GradeUpdate):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE user SET GRADE = %s WHERE user_id = %s", (update.grade, user_id))
        conn.commit()
        return {"message": "사용자 등급이 수정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/users/{user_id}/role")
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


@router.delete("/users/{user_id}/delete")
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


@router.get("/projects")
def get_all_projects(user: dict = Depends(get_current_user)):
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                    p.project_id, p.title, p.status, p.pm_id, p.category, p.description,
                    p.estimated_duration, p.budget, p.create_dt,
                    u.user_id AS client_id, u.nickname AS client_nickname, u.email AS client_email, u.company AS client_company, u.phone AS client_phone
                FROM project p
                LEFT JOIN user u 
                    ON p.client_id = u.user_id
                ORDER BY p.project_id DESC
            """
            cursor.execute(sql)
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/my-projects")
def get_pm_projects(user: dict = Depends(get_current_user)):
    if user["role"] != "R03":  # PM만 접근 가능
        raise HTTPException(status_code=403, detail="PM만 접근할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                    p.project_id, p.title, p.status, p.description,
                    p.category, p.estimated_duration, p.budget, p.create_dt,
                    u.user_id AS client_id, u.nickname AS client_nickname,
                    u.email AS client_email, u.company AS client_company, u.phone AS client_phone
                FROM project p
                LEFT JOIN user u ON p.client_id = u.user_id
                WHERE p.pm_id = %s
                ORDER BY p.project_id DESC
            """
            cursor.execute(sql, (user["user_id"],))
            result = cursor.fetchall()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/projects/assign-pm")
def assign_pm(data: PMAssignRequest, user: dict = Depends(get_current_user)):
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="PM만 지정할 수 있습니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # pm_id를 현재 로그인한 사용자로 지정
            cursor.execute("UPDATE project SET pm_id = %s, status = '검토 중' WHERE project_id = %s",
                           (user["user_id"], data.project_id))
        conn.commit()
        return {"message": "PM으로 지정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()