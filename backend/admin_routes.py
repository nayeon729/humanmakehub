from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from datetime import datetime
import pymysql
from database import db_config
from jwt_auth import get_current_user
from typing import Optional
from typing import List
import json

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

class ProjectChannel(BaseModel):
    title: str
    user_id:str
    content:str


class SkillItem(BaseModel):
    code_id: str       # 기술 코드 (ex: B01, C02 등)
    code_name: str    # 기술 이름 (ex: React, Python 등)
    parent_code: str  # 부모코드 (ex: T01, T02 등)

class Portfolio(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    estimated_dt: Optional[str] = None
    budget: Optional[str] = None
    skills: Optional[List[SkillItem]] = None


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

                # ⭐ 상태가 '진행중' (W02)일 경우 클라이언트에게 알림 전송
                if project.status == 'W02':
                     cursor.execute("""
                        INSERT INTO alerts (
                            target_user, title, message, link, create_dt, create_id
                        )
                        SELECT
                            p.client_id,
                            '시스템 알람',
                            '등록하신 프로젝트가 시작되었습니다.',
                            'http://localhost:3000/client/list',
                            NOW(),
                            %s
                        FROM project p
                        WHERE p.project_id = %s
                    """, (user["user_id"], project_id))
                if project.status == 'W03':
                    cursor.execute("""
                        INSERT INTO alerts (
                            target_user, title, message, link, create_dt, create_id
                        )
                        SELECT
                            p.client_id,
                            '시스템 알람',
                            '프로젝트가 완료되었습니다.',
                            'http://localhost:3000/client/list',
                            NOW(),
                            %s
                        FROM project p
                        WHERE p.project_id = %s
                    """, (user["user_id"], project_id))
                        
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
def update_notice(notice_id: int, notice: Notice, user:dict = Depends(get_current_user)):    
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

@router.get("/project/{project_id}/projecttitle")
def get_project_title(project_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT title
                FROM project
                WHERE project_id = %s
                AND del_yn = 'N'
            """, (project_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

            return {"title": row["title"]}

    except Exception as e:
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
            members= cursor.fetchall()
        
            cursor.execute("""
                SELECT u.user_id, u.nickname
                FROM project p
                JOIN user u ON p.pm_id = u.user_id
                WHERE p.project_id = %s
            """, (project_id,))
            pm = cursor.fetchone()

            all_users = members.copy()
            if pm and all(u["user_id"] != pm["user_id"] for u in members):
                all_users.append(pm)

            return {"members": all_users,"pm_id": pm["user_id"] if pm else None}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/projectchannel/{project_id}/create")
def create_project_channel(project_id: int, projectChannel: ProjectChannel, user: dict = Depends(get_current_user)):
    if user["role"] != "R03":  # 관리자만 작성
        raise HTTPException(status_code=403, detail="관리자 권한 필요")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO project_channel (title, user_id, content, create_dt, create_id, project_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(sql, (projectChannel.title, projectChannel.user_id, projectChannel.content, now, user["user_id"], project_id))
        conn.commit()
        return {"message": "게시글이 등록되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/projectchannel/{channel_id}")
def get_channel_by_id(channel_id: int, user: dict = Depends(get_current_user)):
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT channel_id, title, user_id, content,
                       create_dt, create_id, project_id
                FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            project = cursor.fetchone()

            if not project:
                raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
            
            return project

    except Exception as e:
        print("❌ 단건 조회 예외:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/projectchannel/{channel_id}/update")
def update_project_channel(channel_id: int, projectChannel: ProjectChannel, user: dict = Depends(get_current_user)):    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT create_id FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="글-을 찾을 수 없습니다.")
            # if row["create_id"] != user["create_id"]:
            #     raise HTTPException(status_code=403, detail="작성자만 수정할 수 있습니다.")

            sql = """
                UPDATE project_channel
                SET title = %s,
                    user_id = %s,
                    content = %s,
                    update_dt = %s,
                    update_id = %s
                WHERE channel_id = %s
            """
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(sql, (
                projectChannel.title,
                projectChannel.user_id,
                projectChannel.content,
                now,
                user["user_id"],
                channel_id  
            ))

        conn.commit()
        return {"message": "공지사항이 수정되었습니다."}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/projectchannel/{channel_id}/delete")
def delete_notice(channel_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE project_channel SET del_yn = 'Y' WHERE channel_id = %s", (channel_id,))
        conn.commit()
        return {"message": "글이 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

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
                    pc.create_id,
                    pc.create_dt
                FROM project_channel pc
                JOIN user u ON pc.user_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND u.role = 'R03'
                  AND pc.user_id = pc.create_id
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

@router.get("/project/{project_id}/user/{user_id}")
def get_channel_messages(project_id: int, user_id: str):
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
                    pc.create_id,
                    pc.create_dt
                FROM project_channel pc
                JOIN user u ON pc.create_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND pc.project_id = %s
                  AND pc.user_id = %s
                  AND (
                        pc.create_id = %s
                        OR u.role = 'R03'
                  )
                ORDER BY pc.create_dt DESC
            """
            cursor.execute(sql, (project_id, user_id, user_id))
            items = cursor.fetchall()

            cursor.execute("""
                SELECT pm_id FROM project
                WHERE project_id = %s
            """, (project_id,))
            pm_row = cursor.fetchone()
            pm_id = pm_row["pm_id"] if pm_row else None

            return {
                "items": items,
                "pm_id": pm_id,
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
                SELECT 
                   *
                FROM join_requests
                WHERE project_id = %s AND user_id = %s AND pm_id = %s AND status ='N' AND checking ='N' AND del_yn ='N'
            """, (project_id, body["member_id"], user["user_id"]))
            is_check = cursor.fetchall()

            if is_check:
                raise HTTPException(status_code=400, detail="이미 초대 요청이 존재합니다.")

            cursor.execute("""
                INSERT INTO join_requests (project_id, user_id, pm_id, checking, create_dt, del_yn)
                VALUES (%s, %s, %s, 'N', NOW(), 'N')
            """, (project_id, body["member_id"], user["user_id"]))

            # ✨ 알림 추가
            cursor.execute("""
                INSERT INTO alerts (
                    target_user, title, message, link, answer_yn, create_dt, del_yn, create_id
                ) VALUES (
                    %s, %s, %s, %s, 'N', NOW(), 'N', %s
                )
            """, (
                body["member_id"],  # 알림 받을 대상
                "시스템 알람",
                "PM이 프로젝트에 초대하였습니다. 프로젝트 목록에서 확인 후 수락 또는 거절할 수 있습니다.",
                "http://localhost:3000/member/projectlist",
                user["user_id"]  # 알림 보낸 사람
            ))

        conn.commit()
        return {"message": "초대 요청이 생성되었습니다."}
    finally:
        conn.close()


@router.get("/askList")
def get_askList(user: dict = Depends(get_current_user)):
    if user.get("role") != "R03":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                   *
                FROM ask
                WHERE del_yn = 'N'
                ORDER BY create_dt ASC
            """
            cursor.execute(sql)
            items = cursor.fetchall()

            # 🔁 category를 문자열 → 배열로 변환
            for item in items:
                try:
                    item["category"] = json.loads(item["category"])
                except Exception:
                    item["category"] = []  # 혹시 JSON이 아니거나 오류 나면 빈 리스트

            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/askCheck")
def get_askCheck(payload: dict = Body(...) ,user: dict = Depends(get_current_user)):
    if user.get("role") != "R03":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                UPDATE ask
                SET update_dt = NOW(),
                    update_id = %s,
                    del_yn ='Y'
                WHERE ask_id = %s
            """
            cursor.execute(sql, (user.get("user_id"), payload.get("ask_id")))

            conn.commit()

            return {"message": "문의사항이 확인되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()




@router.post("/projects")
def create_project_as_admin(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO project (
                    client_id,
                    title,
                    category,
                    description,
                    estimated_duration,
                    budget,
                    urgency,
                    create_dt,
                    create_id,
                    del_yn
                ) VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, NOW(), %s, 'N'
                )
            """, (
                payload.get("user_id"),          # ✅ 입력받은 클라이언트 ID
                payload.get("projectName"),
                payload.get("projectType"),
                payload.get("projectContent"),
                int(payload.get("estimatedDuration", 0)),
                int(payload.get("budget", 0)),
                payload.get("urgencyLevel"),
                user["user_id"]                  # ✅ 현재 로그인한 관리자 ID
            ))
        conn.commit()
        return {"message": "프로젝트가 등록되었습니다! (관리자 등록)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/projects/{project_id}")
def get_project_by_id(project_id: int, user: dict = Depends(get_current_user)):
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 조회할 수 있습니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT project_id, title, description, category,
                       estimated_duration, budget, urgency, client_id
                FROM project
                WHERE project_id = %s AND del_yn = 'N'
            """, (project_id,))
            project = cursor.fetchone()

            if not project:
                raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
            
            return project

    except Exception as e:
        print("❌ 단건 조회 예외:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/projects/{project_id}/update")
def update_project(project_id: int, payload: dict = Body(...), user: dict = Depends(get_current_user)):    
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 수정할 수 있습니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            sql = """
                UPDATE project
                SET title = %s,
                    description = %s,
                    category = %s,
                    estimated_duration = %s,
                    budget = %s,
                    urgency = %s,
                    client_id = %s,
                    update_dt = %s,
                    update_id = %s
                WHERE project_id = %s
            """
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(sql, (
                payload.get("title"),
                payload.get("description"),
                payload.get("category"),
                int(payload.get("estimated_duration", 0)),
                int(payload.get("budget", 0)),
                payload.get("urgency"),
                payload.get("client_id"),
                now,
                user["user_id"],
                project_id
            ))

        conn.commit()
        return {"message": "프로젝트가 수정되었습니다."}

    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------- 포트폴리오작성 ----------
@router.post("/portfolioCreate")
def portfolio_Create(data:Portfolio ,user: dict = Depends(get_current_user)):
    if user["role"] != "R03":
        raise HTTPException(status_code=403, detail="관리자만 수정할 수 있습니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:

            sql = '''
                INSERT INTO portfolio (title, content, estimated_dt, budget, create_dt, create_id, del_yn)
                VALUES (%s, %s, %s, %s, NOW(), %s, 'N')
            '''
            cursor.execute(sql, (
                data.title, data.content, data.estimated_dt, data.budget, user["user_id"],
            ))

            # ✅ 여기서 바로 ID 가져오기!
            portfolio_id = cursor.lastrowid

            # 기술 스택 등록
            if data.skills:
                sql_skill = '''
                    INSERT INTO portfolio_skill (
                        portfolio_id, code_id, code_name, parent_code, create_dt, create_id, del_yn
                    ) VALUES (
                        %s, %s, %s, %s, NOW(), %s, 'N'
                    )
                '''

                for skill in data.skills:
                    cursor.execute(sql_skill, (
                        portfolio_id, skill.code_id, skill.code_name, skill.parent_code, user["user_id"],
                    ))

        conn.commit()
        return {"message": "포트폴리오 작성완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()