from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from datetime import datetime
import pymysql
from database import db_config
from jwt_auth import get_current_user
from typing import Optional
from typing import List

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


class ProjectFlexibleUpdate(BaseModel):
    status: Optional[str] = None
    progress: Optional[int] = None

class Notice(BaseModel):
    title: str
    target_type: str
    content: str



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
                    p.estimated_duration, p.budget, p.urgency, p.create_dt,
                    u.user_id AS client_id, u.nickname AS client_nickname, u.email AS client_email, u.company AS client_company, u.phone AS client_phone
                FROM project p
                LEFT JOIN user u 
                    ON p.client_id = u.user_id
                WHERE p.del_yn='n'
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
                    p.category, p.estimated_duration, p.budget, p.create_dt, p.urgency, p.progress,
                    u.user_id AS client_id, u.nickname AS client_nickname,
                    u.email AS client_email, u.company AS client_company, u.phone AS client_phone
                FROM project p
                LEFT JOIN user u ON p.client_id = u.user_id
                WHERE p.pm_id = %s AND p.del_yn='n'
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
        
@router.put("/projects/{project_id}")
def update_project(project_id: int, project: ProjectFlexibleUpdate, user:dict = Depends(get_current_user)):    
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 수정할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            if project.status is not None:
                cursor.execute("UPDATE project SET status = %s WHERE project_id = %s", (project.status, project_id))

            if project.progress is not None:
                cursor.execute("UPDATE project SET progress = %s WHERE project_id = %s", (project.progress, project_id))

        conn.commit()
        return {"message": "프로젝트 업데이트 완료"}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/members/filter")
def filter_member_users(
    ranks: List[str] = Body(default=[]),
    positions: List[str] = Body(default=[]),
    keyword: str = Body(default=""),
    user: dict = Depends(get_current_user)
):
    if str(user["role"]) != "R03":
        raise HTTPException(status_code=403, detail="관리자만 접근할 수 있습니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT
                    u.user_id,
                    u.nickname,
                    u.grade,
                    grade.code_name AS user_grade,
                    GROUP_CONCAT(DISTINCT cc.code_name) AS skills
                FROM user u
                LEFT JOIN user_skills us ON u.user_id = us.user_id AND us.del_yn = 'N'
                LEFT JOIN common_code cc ON us.code_id = cc.code_id AND cc.del_yn = 'N'
                LEFT JOIN common_code grade ON u.grade = grade.code_id AND grade.group_id = 'USER_GRADE'
                WHERE u.role = 'R02' AND u.del_yn = 'N'
            """
            params = []

            if ranks:
                placeholders = ','.join(['%s'] * len(ranks))
                sql += f" AND u.grade IN ({placeholders})"   # ✅ 여기만 user.grade 로!
                params.extend(ranks)

            if positions:
                placeholders = ','.join(['%s'] * len(positions))
                sql += f" AND cc.parent_code IN ({placeholders})"
                params.extend(positions)

            if keyword:
                sql += " AND u.nickname LIKE %s"
                params.append(f"%{keyword}%")

            sql += " GROUP BY u.user_id"
            
            cursor.execute(sql, params)
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/projects/{project_id}/delete")
def delete_project(project_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE project SET del_yn = 'Y' WHERE project_id = %s", (project_id,))
        conn.commit()
        return {"message": "프로젝트가 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/notices")
def create_notice(notice: Notice, user: dict = Depends(get_current_user)):
    if user["role"] != "R03":  # 관리자만 작성
        raise HTTPException(status_code=403, detail="관리자 권한 필요")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO notices (title, target_type, content, create_dt, create_id)
                VALUES (%s, %s, %s, %s, %s)
            """
            now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(sql, (notice.title, notice.target_type, notice.content, now, user["user_id"]))
        conn.commit()
        return {"message": "공지사항이 등록되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/notices")
def get_notices(page: int = 1, keyword: str = ""):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            page_size = 10
            offset = (page - 1) * page_size

            base_sql = "FROM notices WHERE del_yn = 'N'"
            params = []

            if keyword:
                base_sql += " AND title LIKE %s"
                params.append(f"%{keyword}%")

            # 전체 개수
            cursor.execute(f"SELECT COUNT(*) as count {base_sql}", params)
            total = cursor.fetchone()["count"]

            # 실제 데이터
            cursor.execute(
                f"""
                SELECT notice_id, title, target_type, create_dt
                {base_sql}
                ORDER BY create_dt DESC
                LIMIT %s OFFSET %s
                """,
                params + [page_size, offset]
            )
            items = cursor.fetchall()

        return {
            "items": items,
            "totalPages": (total + page_size - 1) // page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@router.get("/notices/{notice_id}")
def get_notice_detail(notice_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT notice_id, title, target_type, content, create_dt FROM notices WHERE notice_id = %s", (notice_id,))
            result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")
        return result
    finally:
        conn.close()

@router.delete("/notices/{notice_id}/delete")
def delete_notice(notice_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE notices SET del_yn = 'Y' WHERE notice_id = %s", (notice_id,))
        conn.commit()
        return {"message": "공지가 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.put("/notices/{notice_id}/update")
def update_project(notice_id: int, notice: Notice, user:dict = Depends(get_current_user)):    
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 수정할 수 있습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                 UPDATE notices
                SET title = %s,
                    target_type = %s,
                    content = %s,
                    update_dt = %s,
                    update_id = %s
                WHERE notice_id = %s
            """
            now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(sql, (notice.title, notice.target_type, notice.content, now, user["user_id"], notice_id))
        conn.commit()
        return {"message": "공지사항이 수정되었습니다."}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/project/{project_id}/members")
def get_project_members(project_id: int, user: dict = Depends(get_current_user)):
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 조회 가능")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT u.user_id, u.nickname
                FROM team_member r
                JOIN user u ON r.user_id = u.user_id
                WHERE r.project_id = %s
            """, (project_id,))
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# @router.post("/projectchannel/create")
# def create_notice(notice: Notice, user: dict = Depends(get_current_user)):
#     if user["role"] != "R03":  # 관리자만 작성
#         raise HTTPException(status_code=403, detail="관리자 권한 필요")
    
#     try:
#         conn = pymysql.connect(**db_config)
#         with conn.cursor() as cursor:
#             sql = """
#                 INSERT INTO project_chennal (title, target_type, content, create_dt, create_id)
#                 VALUES (%s, %s, %s, %s, %s)
#             """
#             now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             cursor.execute(sql, (notice.title, notice.target_type, notice.content, now, user["user_id"]))
#         conn.commit()
#         return {"message": "공지사항이 등록되었습니다."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()



@router.get("/project/common/{project_id}")
def get_project_common(project_id: int):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                    pc.channel_id, 
                    pc.title, 
                    pc.content, 
                    pc.user_id, 
                    u.nickname,
                    pc.create_dt
                FROM project_channel pc
                JOIN user u ON pc.user_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND u.role = 'R03'
                  AND pc.project_id = %s
                ORDER BY pc.create_dt DESC
            """
            cursor.execute(sql, (project_id,))
            items = cursor.fetchall()

            return {
                "items": items,
                "total": len(items)
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/project/{project_id}/invite")
def invite_member(project_id: int, body: dict = Body(...), user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO join_requests (project_id, user_id, pm_id, status, checking, create_dt, del_yn)
                VALUES (%s, %s, %s, '대기', 'N', NOW(), 'N')
            """, (project_id, body["member_id"], user["user_id"]))
        conn.commit()
        return {"message": "초대 요청이 생성되었습니다."}
    finally:
        conn.close()