"""
----------------------------------------------------------------------
파일명     : admin_routes.py
설명       : 관리자(Admin, R04) 및 프로젝트 매니저(PM R03)를 위한 전용 API 라우터

주요 기능
----------------------------------------------------------------------
1. 사용자 관리
   - 전체 사용자 목록 조회
   - 사용자 등급(grade), 역할(role) 변경

2. 프로젝트 관리
   - 전체 프로젝트 조회
   - 프로젝트 생성, 상태(status)/진행률(progress) 업데이트
   - PM 지정 기능

3. 채널 및 게시판
   - 프로젝트 채널 글 등록/수정/삭제
   - 이미지 및 파일 업로드

4. 알림 관리
   - 초대 요청, 승인, 정산 등의 이벤트에 따른 알림 등록

사용 권한
----------------------------------------------------------------------
- 관리자(R03) 또는 프로젝트 매니저(R04)만 접근 가능
- JWT 인증을 통해 사용자 검증
- 각 기능별 역할(Role) 검사 후 분기 처리

비고
----------------------------------------------------------------------
- DB 연결은 pymysql 사용 (DictCursor)
- SQL 실행 후 커넥션 반드시 close
- 일부 요청은 FormData 및 UploadFile 병행 처리
----------------------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Depends, Body, UploadFile, File, Form, Query
from pydantic import BaseModel
from datetime import datetime
import pymysql
from database import db_config
import shutil, os
from jwt_auth import get_current_user
from typing import Optional
from typing import List
from config import FRONT_BASE_URL
import json

router = APIRouter( tags=["Admin"])
UPLOAD_DIR = "C:/Users/admin/uploads"

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
    value_id:int
    category:str
    project_id:int


class SkillItem(BaseModel):
    code_id: str       # 기술 코드 (ex: B01, C02 등)
    code_name: str    # 기술 이름 (ex: React, Python 등)
    parent_code: str  # 부모코드 (ex: T01, T02 등)

class Portfolio(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    estimated_dt: Optional[str] = None
    budget: Optional[str] = None
    link: Optional[str] = None
    skills: Optional[List[SkillItem]] = None
    checking: Optional[bool] = None
    




# --- 관리자(Admin, PM) 전용 라우터 ---

@router.get("/users")
def get_all_users(user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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

@router.put("/users/{user_id}/grade")
def update_user_grade(user_id: str, update: GradeUpdate, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE user 
                SET grade = %s,
                    update_id = %s,
                    update_dt = NOW()
                WHERE user_id = %s
            """, (update.grade, user["user_id"], user_id))
        conn.commit()
        return {"message": "사용자 등급이 수정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/users/{user_id}/role")
def update_user_role(user_id: str, update: RoleUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "R04":
        raise HTTPException(status_code=403, detail="최종관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:

            # ✅ R02(개발자)로 변경될 경우, 해당 유저가 PM으로 있는 프로젝트 조회
            if update.role == "R02":
                cursor.execute("""
                    SELECT * 
                    FROM project 
                    WHERE pm_id = %s AND del_yn = 'N' AND status != 'W03'
                """, (user_id,))
                pm_projects = cursor.fetchone()

                if pm_projects:
                    raise HTTPException(status_code=400, detail="프로젝트 보유중")
                
                # ✅ 보유중인 프로젝트 없으면 PM으로 바꾸기
                cursor.execute("UPDATE user SET role = %s WHERE user_id = %s", (update.role, user_id))
            
            # ✅ R03(PM)으로 변경될 경우 그냥 PM으로 바꾸기
            else:
                cursor.execute("UPDATE user SET role = %s WHERE user_id = %s", (update.role, user_id))
        conn.commit()
        return {"message": "사용자 역할이 수정되었습니다."}
    except HTTPException as http_err:
        raise http_err  # ✅ HTTP 예외는 그대로 던짐!
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/users/{user_id}/delete")
def delete_user(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE user 
                SET del_yn = 'Y',
                    update_id = %s,
                    update_dt = NOW()
                WHERE user_id = %s
            """, (user["user_id"], user_id))
        conn.commit()
        return {"message": "사용자가 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.put("/users/{user_id}/recover")
def recover_user(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE user 
                SET del_yn = 'N',
                    update_id = %s,
                    update_dt = NOW()
                WHERE user_id = %s
            """, (user["user_id"], user_id))

        conn.commit()
        return {"message": "사용자가 복구되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/projects")
def get_all_projects(user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                    p.project_id, p.title, p.status, p.description,
                    p.category, p.estimated_duration, p.budget, p.create_dt, p.urgency, p.progress, p.pm_id,
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # pm_id를 현재 로그인한 사용자로 지정
            cursor.execute("UPDATE project SET pm_id = %s, status = '검토 중', update_dt = NOW(), update_id = %s WHERE project_id = %s",
                           (user["user_id"], user["user_id"], data.project_id))
            
            # 프로젝트에 팀멤버가 존재하는지 확인
            cursor.execute("""
                SELECT * FROM team_member
                WHERE project_id = %s AND pm_id IS NULL AND del_yn = 'N'
            """, (data.project_id,))
            team_members = cursor.fetchall()


            if team_members:
                #  존재하면 team_member 테이블에서도 pm_id 지정
                cursor.execute("""
                    UPDATE team_member
                    SET pm_id = %s, update_dt = NOW(), update_id = %s
                    WHERE project_id = %s AND del_yn = 'N'
                """, (user["user_id"], user["user_id"], data.project_id))
        conn.commit()
        return {"message": "PM으로 지정되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
@router.put("/projects/{project_id}")
def update_project(project_id: int, project: ProjectFlexibleUpdate, user:dict = Depends(get_current_user)):    
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            if project.status is not None:
                link = f"{FRONT_BASE_URL}/client/list"
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
                            %s,
                            NOW(),
                            %s
                        FROM project p
                        WHERE p.project_id = %s
                    """, (link, user["user_id"], project_id))
                if project.status == 'W03':
                    cursor.execute("""
                        INSERT INTO alerts (
                            target_user, title, message, link, create_dt, create_id
                        )
                        SELECT
                            p.client_id,
                            '시스템 알람',
                            '프로젝트가 완료되었습니다.',
                            %s,
                            NOW(),
                            %s
                        FROM project p
                        WHERE p.project_id = %s
                    """, (link,user["user_id"], project_id))
                        
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

@router.get("/project/{project_id}/members/without-pm")
def get_members_exclude_pm(project_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:

            # 멤버 조회
            cursor.execute("""
                SELECT u.user_id, u.nickname
                FROM team_member r
                JOIN user u ON r.user_id = u.user_id
                WHERE r.project_id = %s AND r.del_yn = 'N'
            """, (project_id,))
            members = cursor.fetchall()

            # PM 조회
            cursor.execute("""
                SELECT pm_id FROM project WHERE project_id = %s
            """, (project_id,))
            row = cursor.fetchone()
            pm_id = row["pm_id"] if row else None

            # PM 제외
            filtered_members = [m for m in members if m["user_id"] != pm_id]

            return {"members": filtered_members}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@router.post("/members/filter")
def filter_member_users(
    ranks: List[str] = Body(default=[]),
    positions: List[str] = Body(default=[]),
    keyword: str = Body(default=""),
    page: int = Body(default=1),
    page_size: int = Body(default=5),
    user: dict = Depends(get_current_user)
):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            offset = (page - 1) * page_size
            base_sql = """
                FROM user u
                LEFT JOIN user_skills us ON u.user_id = us.user_id AND us.del_yn = 'N'
                LEFT JOIN common_code cc ON us.code_id = cc.code_id AND cc.del_yn = 'N'
                LEFT JOIN common_code grade ON u.grade = grade.code_id AND grade.group_id = 'USER_GRADE'
                WHERE u.role = 'R02' AND u.del_yn = 'N'
            """
            where_clauses = []
            params = []

            if ranks:
                placeholders = ','.join(['%s'] * len(ranks))
                where_clauses.append(f"u.grade IN ({placeholders})")
                params.extend(ranks)

            if positions:
                placeholders = ','.join(['%s'] * len(positions))
                where_clauses.append(f"cc.parent_code IN ({placeholders})")
                params.extend(positions)

            if keyword:
                where_clauses.append("u.nickname LIKE %s")
                params.append(f"%{keyword}%")

            if where_clauses:
                base_sql += " AND " + " AND ".join(where_clauses)

            # 👉 전체 개수 가져오기
            count_sql = "SELECT COUNT(DISTINCT u.user_id) " + base_sql
            cursor.execute(count_sql, params)
            total = cursor.fetchone()["COUNT(DISTINCT u.user_id)"]

            # 👉 실제 데이터 조회
            data_sql = f"""
                SELECT u.user_id, u.nickname, u.grade,
                       grade.code_name AS user_grade,
                       GROUP_CONCAT(DISTINCT cc.code_name) AS skills
                {base_sql}
                GROUP BY u.user_id
                LIMIT %s OFFSET %s
            """
            cursor.execute(data_sql, params + [page_size, offset])
            rows = cursor.fetchall()

            return {
                "total": total,
                "users": rows
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/projects/{project_id}/delete")
def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE project 
                SET del_yn = 'Y',
                    update_id = %s,
                    update_dt = NOW()
                WHERE project_id = %s
            """, (user["user_id"], project_id))
        conn.commit()
        return {"message": "프로젝트가 삭제되었습니다."}
    except Exception as e:
        print("❌ 삭제 중 오류 발생:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/notices")
def create_notice(notice: Notice, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
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
def get_notices(page: int = 1, keyword: str = "", user: dict = Depends(get_current_user)):
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
def delete_notice(notice_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT u.user_id, u.nickname
                FROM team_member r
                JOIN user u ON r.user_id = u.user_id
                WHERE r.project_id = %s AND r.del_yn='N'
            """, (project_id,))
            members= cursor.fetchall() or []
        
            cursor.execute("""
                SELECT u.user_id, u.nickname
                FROM project p
                JOIN user u ON p.pm_id = u.user_id
                WHERE p.project_id = %s
            """, (project_id,))
            pm = cursor.fetchone()
            pm_id = pm["user_id"] if pm and "user_id" in pm else None

            
            if pm and all(u["user_id"] != pm.get("user_id") for u in members):
                members.append(pm)

            # 🔁 각 멤버마다 team_member_id, 알림 수 조회
            for member in members:
                 # ✅ team_member_id 조회
                cursor.execute("""
                    SELECT team_member_id
                    FROM team_member
                    WHERE project_id = %s
                      AND user_id = %s
                      AND pm_id = %s
                      AND del_yn = 'N'
                """, (project_id, member["user_id"], pm_id))
                team_member = cursor.fetchone()
                member["team_member_id"] = team_member["team_member_id"] if team_member else None
                
                # ✅ 알림 수 조회
                cursor.execute("""
                    SELECT COUNT(*) as count
                    FROM alerts
                    WHERE target_user = ''
                      AND create_id = %s
                      AND value_id = %s
                      AND category = 'chat'
                      AND del_yn = 'N'
                """, (member["user_id"],member["team_member_id"]))
                count_result = cursor.fetchone()
                member["count"] = count_result["count"] if count_result else 0

            return {"members": members, "pm_id": pm_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/project/{project_id}/member/{user_id}")
def remove_member_from_project(project_id: int, user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE team_member
                SET del_yn = 'Y'
                WHERE project_id = %s AND user_id = %s
            """, (project_id, user_id))
        conn.commit()
        return {"message": "팀원 삭제 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# @router.post("/projectchannel/{project_id}/create")
# def create_project_channel(projectChannel: ProjectChannel, user: dict = Depends(get_current_user)):
#     print("🧾 받은 데이터:", projectChannel.dict())  # 여기 추가!
#     if user["role"] not in ("R03", "R04"):
#         raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
#     try:
#         conn = pymysql.connect(**db_config)
#         with conn.cursor() as cursor:
#             if projectChannel.category == "board01":
#                 sql = """
#                     INSERT INTO project_channel (title, user_id, content, create_dt, create_id, value_id, category)
#                     VALUES (%s, %s, %s, %s, %s, %s, "board01")
#                 """
#                 now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#                 cursor.execute(sql, (projectChannel.title, projectChannel.user_id, projectChannel.content, now, user["user_id"], projectChannel.project_id))

#                 # 프로젝트에 참가한 팀멤버아이디 조회
#                 cursor.execute("""
#                     SELECT user_id
#                     FROM team_member 
#                     WHERE project_id = %s
#                     AND del_yn = 'N'
#                 """, (projectChannel.project_id,))
#                 team_members = cursor.fetchall()

#                 # 각 팀원에게 알림 보내기
#                 for member in team_members:
#                     target_user = member["user_id"]
#                     cursor.execute("""
#                         INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
#                         VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
#                     """, (
#                         target_user,
#                         projectChannel.project_id,
#                         "chat",
#                         "시스템 알림제목",
#                         "프로젝트에서 PM이 공지사항을 작성하였습니다.",
#                         f"http://localhost:3000/member/channel/{projectChannel.project_id}/common",
#                         user["user_id"]
#                     ))

#             else:
#                 sql = """
#                     INSERT INTO project_channel (title, user_id, content, create_dt, create_id, value_id, category)
#                     VALUES (%s, %s, %s, %s, %s, %s, "board02")
#                 """
#                 now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#                 cursor.execute(sql, (projectChannel.title, projectChannel.user_id, projectChannel.content, now, user["user_id"], projectChannel.value_id))

#                 cursor.execute("""
#                         INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
#                         VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
#                     """, (
#                         "",
#                         projectChannel.value_id,
#                         "chat",
#                         "시스템 알림제목",
#                         "시스템 알림내용",
#                         f"http://localhost:3000/member/channel/{projectChannel.project_id}/pm/{projectChannel.user_id}",
#                         user["user_id"]
#                     ))

#         conn.commit()
#         return {"message": "게시글이 등록되었습니다."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()

@router.post("/projectchannel/{project_id}/create")
async def create_project_channel(
    project_id: int,
    title: str = Form(...),
    user_id: str = Form(...),
    content: str = Form(...),
    value_id: int = Form(...),
    category: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    user: dict = Depends(get_current_user)
):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    allowed_types = {"image/jpeg","image/jpg", "image/png", "image/gif", "image/webp"}
    UPLOAD_DIR = "C:/Users/admin/uploads/projectchannel"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            link = f"{FRONT_BASE_URL}/client/list"
            # 🔸 게시글 등록
            cursor.execute("""
                INSERT INTO project_channel (title, user_id, content, create_dt, create_id, value_id, category)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, user_id, content, now, user["user_id"], value_id, category))
            channel_id = cursor.lastrowid

            # 📎 이미지 파일 저장
            if files:
                for file in files:
                    if file.content_type not in allowed_types:
                        raise HTTPException(status_code=400, detail="이미지 파일만 등록 가능합니다.")

                    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
                    filepath = os.path.join(UPLOAD_DIR, filename)

                    with open(filepath, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)

                    cursor.execute("""
                        INSERT INTO post_file (channel_id, file_name, file_path, create_dt, create_id, del_yn)
                        VALUES (%s, %s, %s, %s, %s, 'N')
                    """, (channel_id, file.filename, filepath, now, user["user_id"]))

            # 프로젝트에 참가한 팀멤버아이디 조회
                cursor.execute("""
                    SELECT user_id
                    FROM team_member 
                    WHERE project_id = %s
                    AND del_yn = 'N'
                """, (project_id,))
                team_members = cursor.fetchall()

            # 🔔 알림 전송 (이 부분은 그린 코드 그대로!)
            if category == "board01":
                cursor.execute("""
                    SELECT user_id
                    FROM team_member 
                    WHERE project_id = %s
                    AND del_yn = 'N'
                """, (project_id,))
                team_members = cursor.fetchall()
                link1 = f"{FRONT_BASE_URL}/member/channel/{project_id}/common"
                for member in team_members:
                    target_user = member["user_id"]
                    cursor.execute("""
                        INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
                    """, (
                        target_user,
                        project_id,
                        "commonChat",
                        "프로젝트 공지",
                        "프로젝트에서 PM이 공지사항을 작성하였습니다.",
                        link1,
                        user["user_id"]
                    ))
            else:
                link2 = f"{FRONT_BASE_URL}/member/channel/{project_id}/pm/{user_id}"
                cursor.execute("""
                    INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
                """, (
                    "",
                    value_id,
                    "chat",
                    "프로젝트 PM",
                    "프로젝트에서 PM이 개인채널에 글을 작성하였습니다.",
                    link2,
                    user["user_id"]
                ))

        conn.commit()
        return {"message": "게시글과 이미지가 등록되었습니다."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/projectchannel/{channel_id}/view")
def get_project_channel_detail(channel_id: int, user: dict = Depends(get_current_user)):

    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 채널 게시글 정보 조회
            cursor.execute("""
                SELECT channel_id, title, content, user_id, create_dt, value_id, category, create_id
                FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            channel = cursor.fetchone()

            if not channel:
                raise HTTPException(status_code=404, detail="게시글이 존재하지 않습니다")

            # 첨부 이미지 조회
            cursor.execute("""
                SELECT file_id, file_name, file_path
                FROM post_file
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            images = cursor.fetchall()

            # 파일 경로를 URL로 바꿔주기 (프론트에서 쓸 수 있게!)
            for img in images:
                if img["file_path"].startswith("C:/Users/admin/uploads"):
                    img["file_path"] = img["file_path"].replace(
                        "C:/Users/admin/uploads", "http://localhost:8001/static"
                    )

            return {
                "channel": channel,
                "images": images
            }
    finally:
        conn.close()


@router.get("/projectchannel/{channel_id}")
def get_channel_by_id(channel_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT channel_id, title, user_id, content,
                       create_dt, create_id, value_id
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
def update_project_channel(
    channel_id: int,
    title: str = Form(...),
    user_id: str = Form(...),
    content: str = Form(...),
    delete_ids: Optional[List[int]] = Form(None),  # 삭제할 기존 이미지 file_id 리스트
    files: Optional[List[UploadFile]] = File(None),
    user: dict = Depends(get_current_user)
):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 1. 게시글 존재 & 작성자 확인
            cursor.execute("""
                SELECT create_id FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
            if row["create_id"] != user["user_id"]:
                raise HTTPException(status_code=403, detail="작성자만 수정할 수 있습니다.")

            # 2. 글 수정
            cursor.execute("""
                UPDATE project_channel
                SET title = %s, user_id = %s, content = %s,
                    update_dt = NOW(), update_id = %s
                WHERE channel_id = %s
            """, (title, user_id, content, user["user_id"], channel_id))

            # 3. 삭제할 이미지 파일 처리
            for file_id in delete_ids or []:
                cursor.execute("SELECT file_path FROM post_file WHERE file_id = %s", (file_id,))
                result = cursor.fetchone()
                if result and os.path.exists(result["file_path"]):
                    os.remove(result["file_path"])
                cursor.execute("DELETE FROM post_file WHERE file_id = %s", (file_id,))

            # 4. 새 이미지 파일 저장
            if files:
                upload_dir = "C:/Users/admin/uploads"
                for file in files:
                    filename = file.filename
                    file_path = os.path.join(upload_dir, filename)
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)

                    cursor.execute("""
                        INSERT INTO post_file (channel_id, file_name, file_path)
                        VALUES (%s, %s, %s)
                    """, (channel_id, filename, file_path))

        conn.commit()
        return {"message": "공지사항이 성공적으로 수정되었습니다!"}
    
    except Exception as e:
        print("❌ 게시글 수정 중 오류:", e)
        raise HTTPException(status_code=500, detail="게시글 수정 중 서버 오류 발생")
    
    finally:
        conn.close()


@router.delete("/projectchannel/{channel_id}/delete")
def delete_notice(channel_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
def get_project_common(
    project_id: int, 
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1),
    user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        offset = (page - 1) * page_size
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
                    pc.create_dt,
                    EXISTS (
                        SELECT 1
                        FROM post_file pf
                        WHERE pf.channel_id = pc.channel_id AND pf.del_yn = 'N'
                    ) AS has_image
                FROM project_channel pc
                JOIN user u ON pc.user_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND u.role IN ('R03', 'R04')
                  AND pc.user_id = pc.create_id
                  AND pc.value_id = %s
                  AND pc.category = "board01"
                ORDER BY pc.create_dt DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, (project_id, page_size, offset))
            items = cursor.fetchall()

            count_sql = """
                SELECT COUNT(*) AS total
                FROM project_channel pc
                JOIN user u ON pc.user_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND u.role IN ('R03', 'R04')
                  AND pc.user_id = pc.create_id
                  AND pc.value_id = %s
                  AND pc.category = "board01"
            """
            cursor.execute(count_sql, (project_id,))
            total = cursor.fetchone()["total"]

            return {
                "items": items,
                "total": total
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/project/{project_id}/user/{user_id}/{teamMemberId}")
def get_channel_messages(
    project_id: int, 
    user_id: str, 
    teamMemberId:int, 
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1),
    user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        offset = (page - 1) * page_size
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
                    pc.create_dt,
                    EXISTS (
                        SELECT 1
                        FROM post_file pf
                        WHERE pf.channel_id = pc.channel_id AND pf.del_yn = 'N'
                    ) AS has_image
                FROM project_channel pc
                JOIN user u ON pc.create_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND pc.value_id = %s
                  AND pc.category = "board02"
                ORDER BY pc.create_dt DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(sql, (teamMemberId, page_size, offset))
            items = cursor.fetchall()

            count_sql = """
                SELECT COUNT(*) AS total
                FROM project_channel pc
                JOIN user u ON pc.create_id = u.user_id
                WHERE pc.del_yn = 'N'
                  AND pc.value_id = %s
                  AND pc.category = "board02"
            """
            cursor.execute(count_sql, (teamMemberId,))
            total = cursor.fetchone()["total"]

            cursor.execute("""
                SELECT pm_id FROM project
                WHERE project_id = %s
            """, (project_id,))
            pm_row = cursor.fetchone()
            pm_id = pm_row["pm_id"] if pm_row else None

            return {
                "items": items,
                "pm_id": pm_id,
                "total": total
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/project/{project_id}/invite")
def invite_member(project_id: int, body: dict = Body(...), user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
            request_id = cursor.lastrowid

            cursor.execute("""
                SELECT * FROM team_member
                WHERE project_id = %s AND user_id = %s AND del_yn = 'N'
            """, (project_id, body["member_id"]))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 팀원으로 등록된 사용자입니다.")
            link = f"{FRONT_BASE_URL}/member/projectlist"
            # ✨ 알림 추가
            cursor.execute("""
                INSERT INTO alerts (
                    target_user, value_id, category, title, message, link, answer_yn, create_dt, del_yn, create_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, 'N', NOW(), 'N', %s
                )
            """, (
                body["member_id"],  # 알림 받을 대상
                request_id,
                "project",
                "시스템 알람",
                "PM이 프로젝트에 초대하였습니다. 프로젝트 목록에서 확인 후 수락 또는 거절할 수 있습니다.",
                link,
                user["user_id"]  # 알림 보낸 사람
            ))

        conn.commit()
        return {"message": "초대 요청이 생성되었습니다."}
    finally:
        conn.close()

@router.get("/project/{project_id}/invited-members")
def get_invited_members(project_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT r.request_id, u.user_id, u.nickname, r.status, r.checking
                FROM join_requests r
                JOIN user u ON r.user_id = u.user_id
                WHERE r.project_id = %s
                  AND r.pm_id = %s
                  AND r.del_yn = 'N'
                  AND NOT (r.status = 'N' AND r.checking = 'Y')  -- ❌ 거절한 건 안 보이게
            """, (project_id, user["user_id"]))
            invited = cursor.fetchall()
            return {"invited": invited}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/project/{project_id}/approve/{request_id}")
def approve_member(project_id: int, request_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # 초대 상태 확인
            cursor.execute("""
                SELECT user_id FROM join_requests
                WHERE request_id = %s
                  AND project_id = %s
                  AND status = 'Y'
                  AND checking = 'Y'
                  AND del_yn = 'N'
            """, (request_id, project_id))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=400, detail="수락된 요청이 아닙니다.")

            user_id = row["user_id"]

            # 이미 등록된 팀원인지 확인
            cursor.execute("""
                SELECT * FROM team_member
                WHERE project_id = %s AND user_id = %s AND del_yn = 'N'
            """, (project_id, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 팀원으로 등록됨")

            # ✅ 팀원 등록
            cursor.execute("""
                INSERT INTO team_member (project_id, user_id, pm_id, del_yn)
                VALUES (%s, %s, %s, 'N')
            """, (project_id, user_id, user["user_id"]))

            # ✅ join_requests 상태를 del_yn='Y'로 변경 (목록에서 안 보이게)
            cursor.execute("""
                UPDATE join_requests
                SET del_yn = 'Y'
                WHERE request_id = %s
            """, (request_id,))

            # 나에게 보낸 alerts 알람지우기
            cursor.execute("""
                UPDATE alerts
                SET del_yn ='Y', update_dt = NOW(), update_id = %s
                WHERE value_id = %s AND category="project"
            """, (user["user_id"], request_id))

        conn.commit()
        return {"message": "팀원 등록 및 목록 제거 완료!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@router.post("/project/{project_id}/reject/{request_id}")
def reject_member(project_id: int, request_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE join_requests
                SET del_yn = 'Y'
                WHERE project_id = %s AND request_id = %s AND del_yn = 'N'
            """, (project_id, request_id))

            # 나에게 보낸 alerts 알람지우기
            cursor.execute("""
                UPDATE alerts
                SET del_yn ='Y', update_dt = NOW(), update_id = %s
                WHERE value_id = %s AND category="project"
            """, (user["user_id"], request_id))

            conn.commit()
            return {"message": "요청이 거절되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
@router.get("/askList")
def get_askList(user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT 
                   *
                FROM ask
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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

            # 나에게 보낸 alerts 알람지우기
            cursor.execute("""
                UPDATE alerts
                SET del_yn ='Y', update_dt = NOW(), update_id = %s
                WHERE value_id = %s AND category="ask"
            """, (user["user_id"], payload.get("ask_id")))

            conn.commit()

            return {"message": "문의사항이 확인되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()




@router.post("/projects")
def create_project_as_admin(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
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
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            checking = "Y" if data.checking else "N"

            sql = '''
                INSERT INTO portfolio (title, content, estimated_dt, budget, link, checking, create_dt, create_id, del_yn)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, 'N')
            '''
            cursor.execute(sql, (
                data.title, data.content, data.estimated_dt, data.budget, data.link, checking, user["user_id"],
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

# -----------특정 포트폴리오불러오기----------------
@router.get("/portfolio/{portfolio_id}")
def get_user_info(portfolio_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            

        # 1. 포트폴리오 기본 정보 조회
            cursor.execute("""
                SELECT 
                    *
                FROM portfolio
                WHERE portfolio_id = %s AND del_yn = 'N'
            """, (portfolio_id,))
            portfolio = cursor.fetchone()

            if not portfolio:
                raise HTTPException(status_code=404, detail="포트폴리오를 찾을 수 없습니다.")

            return portfolio
    finally:
        conn.close()

# ---------- 특정포트폴리오 선택되어있는기술불러오기 ----------
@router.get("/portfolio/{portfolio_id}/tech-stacks")
def get_portfolio_tech_stacks(portfolio_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 1. 포트폴리오에 등록된 기술의 code_id만 가져오기
            cursor.execute("""
                SELECT code_id 
                FROM portfolio_skill 
                WHERE portfolio_id = %s AND del_yn = 'N'
            """, (portfolio_id,))
            tech_ids = [row["code_id"] for row in cursor.fetchall()]
            
            if not tech_ids:
                return {}  # 등록된 기술이 없다면 빈 딕셔너리 반환

            # 2. 해당 code_id들의 정보 가져오기 (code_name, parent_code 등)
            format_strings = ','.join(['%s'] * len(tech_ids))
            sql = f"""
                SELECT code_id, code_name, parent_code 
                FROM common_code 
                WHERE group_id = 'TECH_STACK' AND code_id IN ({format_strings})
            """
            cursor.execute(sql, tech_ids)
            tech_info = cursor.fetchall()

            # 3. code_name을 label로 바꿔서 보내기
            result = [
                {
                    "label": row["code_name"],
                    "code_id": row["code_id"],
                    "parent_code": row["parent_code"]
                }
                for row in tech_info
            ]
        

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- 포트폴리오수정 ----------
@router.post("/portfolioUpdate/{portfolio_id}")
def portfolio_Update(portfolio_id:int, data:Portfolio ,user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            checking = "Y" if data.checking else "N"


            # 1. 포트폴리오 기본 정보 업데이트
            cursor.execute("""
                UPDATE portfolio
                SET title = %s, content = %s, estimated_dt = %s, budget = %s, link = %s, checking = %s, update_dt = NOW(), update_id = %s
                WHERE portfolio_id = %s AND del_yn = 'N'
            """, (data.title, data.content, data.estimated_dt, data.budget, data.link, checking, user["user_id"], portfolio_id))

            # 2. 기존 기술 목록 조회
            cursor.execute("""
                SELECT code_id
                FROM portfolio_skill
                WHERE portfolio_id = %s AND del_yn = 'N'
            """, (portfolio_id,))
            existing_skills = set(row["code_id"] for row in cursor.fetchall())  # 기존에있는 code_id만 추출

            # 2. 새로 받은 전체 스킬 목록은 리스트로 유지
            new_skills = data.skills  # 이건 List[Skill] 객체
            # 3. 추가할 스킬 추출 (code_id 기준 비교)
            to_insert = [skill for skill in new_skills if skill.code_id not in existing_skills]

            # 4. DB에 insert
            for skill in to_insert:
                cursor.execute("""
                    INSERT INTO portfolio_skill (portfolio_id, code_id, code_name, parent_code, create_id, create_dt, del_yn)
                    VALUES (%s, %s, %s, %s, %s, NOW(), 'N')
                """, (portfolio_id, skill.code_id, skill.code_name, skill.parent_code, user["user_id"]))

            # 삭제할 스킬
            new_skill_ids = set(skill.code_id for skill in new_skills)
            to_delete = existing_skills - new_skill_ids

            for code in to_delete:
                cursor.execute("""
                    UPDATE portfolio_skill
                    SET del_yn = 'Y', update_id = %s, update_dt = NOW()
                    WHERE portfolio_id = %s AND code_id = %s
                """, (user["user_id"], portfolio_id, code))

        conn.commit()
        return {"message": "포트폴리오 수정완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ---------- 포트폴리오삭제 ----------
@router.post("/portfolioDelete/{portfolio_id}")
def portfolio_Delete(portfolio_id:int, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:

            # 1. 포트폴리오 기본 정보 삭제
            cursor.execute("""
                UPDATE portfolio
                SET update_id = %s, update_dt = NOW(), del_yn = 'Y'
                WHERE portfolio_id = %s
            """, (user["user_id"], portfolio_id))

            # 1-1. 포트폴리오 기술도 같이 삭제
            cursor.execute("""
                UPDATE portfolio_skill
                SET update_id = %s, update_dt = NOW(), del_yn = 'Y'
                WHERE portfolio_id = %s
            """, (user["user_id"], portfolio_id))

        conn.commit()
        return {"message": "포트폴리오 삭제완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


        
@router.get("/users/{user_id}")
def get_user_info(user_id: str, user: dict = Depends(get_current_user)):
    print("📌 요청된 user_id:", user_id)  # 이거 추가!
    print("📌 요청한 사람의 권한:", user["role"])  # 이거도!
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT u.user_id, u.nickname, u.email, u.role, u.phone, u.company, u.tech, u.experience, u.git, u.portfolio
                FROM user u
                WHERE u.user_id = %s AND del_yn = 'N'
            """, (user_id,))
            user_info = cursor.fetchone()

            if not user_info:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

            # 기술스택 추가 조회 (예: user_skills 테이블)
            cursor.execute("""
                SELECT s.code_id, c.code_name AS skill_name, s.years, s.is_fresher
                FROM user_skills s
                JOIN common_code c ON s.code_id = c.code_id
                WHERE s.user_id = %s AND s.del_yn = 'N'
            """, (user_id,))
            user_info["skills"] = cursor.fetchall()

        return user_info
    finally:
        conn.close()


@router.post("/pmRemove/{user_id}")
def get_haveProject(user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] != "R04":
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 1. 삭제되지않고 완료되지않은 보유 프로젝트 pmid null, 진행도도 null (PM 미지정)
            cursor.execute("""
                UPDATE project
                SET pm_id = NULL, status = "W04", update_dt = NOW(), update_id = %s
                WHERE pm_id = %s AND del_yn = 'N' AND status != 'W03'
            """, (user["user_id"], user_id))
            affected_rows = cursor.rowcount  # 몇 건 수정되었는지 확인용

            # 2. team_member 테이블에 해당 pm_id가 존재하는지 확인
            cursor.execute("""
                SELECT * FROM team_member
                WHERE pm_id = %s AND del_yn = 'N'
            """, (user_id,))
            team_members = cursor.fetchall()


            if team_members:
                # 3. 존재하면 team_member 테이블에서도 pm_id 제거
                cursor.execute("""
                    UPDATE team_member
                    SET pm_id = NULL, update_dt = NOW(), update_id = %s
                    WHERE pm_id = %s AND del_yn = 'N'
                """, (user["user_id"], user_id))

            # 4. user 테이블 등급을 R02로 변경
            cursor.execute("""
                UPDATE user
                SET role = 'R02'
                WHERE user_id = %s
            """, (user_id,))

        conn.commit()
        return {"message": f"{affected_rows}건의 프로젝트에서 PM이 제거되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



@router.get("/project/pmCheck/{project_id}/{user_id}")
def get_project_common(project_id: int, user_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("R03", "R04"):
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT *
                FROM project
                WHERE project_id = %s AND pm_id = %s AND del_yn = 'N'
            """
            cursor.execute(sql, (project_id, user_id))

            result = cursor.fetchone()

            return {"pmCheck": bool(result)}  # 👈 결과가 있으면 True, 없으면 False

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()