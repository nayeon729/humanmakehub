from fastapi import APIRouter, HTTPException, Depends, Body, UploadFile, File, Form
from pydantic import BaseModel
import pymysql
import os
import shutil
from database import db_config
from jwt_auth import get_current_user
from typing import List
import bcrypt
from fastapi import Query
from config import FRONT_BASE_URL
from typing import Optional

router = APIRouter(tags=["Member"])

# 비밀번호 확인을 위한 모델
class PasswordRequest(BaseModel):
    password: str

# 회원 정보 수정 요청 모델
class MemberUpdateRequest(BaseModel):
    phone: str 
    company: str 
    tech: str 
    experience: str 
    git: str 
    portfolio: str
    
class ProjectChannel(BaseModel):
    title: str
    content: str
    pm_id: str
    teamMemberId: int
    
# ----------------------- 회원 정보 조회 -------------------------
@router.get("/userinfo")
def get_member_user_info(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 1. 사용자 기본 정보
            cursor.execute("""
                SELECT 
                    user_id, nickname, email, phone, 
                    tech, experience, git, portfolio
                FROM user
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="회원 정보를 찾을 수 없습니다.")

            # 2. 기술 스택 가져오기
            cursor.execute("""
                SELECT 
                    us.code_id,
                    us.code_name,
                    us.parent_code,
                    us.years,
                    us.is_fresher
                FROM user_skills us
                WHERE us.user_id = %s AND us.del_yn = 'N'
            """, (user["user_id"],))
            skills = cursor.fetchall()
            result["skills"] = skills
            
            # 3. 사용자 정보에 기술 스택 추가
            result["skills"] = [
                {
                    "code_id": s["code_id"],
                    "code_name": s["code_name"],
                    "parent_code": s["parent_code"],
                    "experience": "신입" if s["is_fresher"] == "Y" else f"{s['years']}년",
                    "is_fresher": s["is_fresher"],
                    "years": s["years"]
                }
                for s in skills
            ]

            return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
    finally:
        conn.close()
# ------------------------ 회원탈퇴 ------------------------

@router.put("/withdraw")
def withdraw_user(user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            # 유저테이블 delyn Y
            cursor.execute("""
                UPDATE user
                SET del_yn = 'Y', update_dt = NOW()
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))

            # 유저스킬테이블 delyn Y
            cursor.execute("""
                UPDATE user_skills
                SET del_yn = 'Y', update_dt = NOW()
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))

            # teammember테이블 delyn Y
            cursor.execute("""
                UPDATE team_member
                SET del_yn = 'Y', update_dt = NOW()
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))
        conn.commit()
        return {"message": "회원탈퇴 처리 완료"}
    finally:
        conn.close()
# ------------------------ 비밀번호 확인 ------------------------
@router.post("/verify-password")
def verify_password(data: dict = Body(...), user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT password FROM user WHERE user_id = %s", (user["user_id"],))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
            if not bcrypt.checkpw(data["password"].encode(), result["password"].encode()):
                raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")
            return {"message": "확인 성공"}
    finally:
        conn.close()

# ------------------------ 회원 정보 수정 ------------------------
     
@router.put("/userupdate")
def update_user_info(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    print("📦 받은 payload:", payload)  # ✅ 추가!
    
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            # 1. 기본 정보 수정
            cursor.execute("""
                UPDATE user
                SET 
                    tech = %s,
                    experience = %s,
                    git = %s,
                    portfolio = %s,
                    update_dt = NOW()
                WHERE user_id = %s AND del_yn = 'N'
            """, (
                payload["tech"],
                payload["experience"],
                payload["git"],
                payload["portfolio"],
                user["user_id"],
            ))

            # 2. 기존 skills 삭제
            cursor.execute("DELETE FROM user_skills WHERE user_id = %s", (user["user_id"],))

            # 3. 새 skills 삽입
            skills = payload.get("skills", [])
            print("🧪 skills:", skills)  # ✅ 추가!
            
            sql = """
            INSERT INTO user_skills (
                user_id, code_id, code_name, parent_code, years, is_fresher, del_yn, create_dt
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            for skill in skills:
                try:
                    print("🌱 삽입 시도:", skill)
                    is_fresher = skill.get("is_fresher", 'N')
                    if is_fresher == 'Y':
                        years = 0
                    else:
                        raw_exp = (skill.get("years", "0"))
                        years = (raw_exp.replace("년", "")) if "년" in raw_exp else (raw_exp)

                    cursor.execute(sql, (
                        user["user_id"],
                        skill["code_id"],
                        skill["code_name"],
                        skill["parent_code"],
                        years,
                        is_fresher,
                        'N'
                    ))
                except Exception as e:
                    print("💥 skill insert 실패:", skill)
                    print("🔥 오류:", e)

        conn.commit()
        return {"message": "회원 정보가 성공적으로 수정되었습니다."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
        
        
# ------------------------ 내 프로젝트 ------------------------
@router.get("/my-projects")
def get_my_projects(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT p.* 
                FROM project p
                JOIN join_requests j ON p.project_id = j.project_id
                WHERE j.user_id = %s AND j.status = 'Y' AND p.del_yn = 'N'
            """, (user["user_id"],))
            projects = cursor.fetchall()
        conn.close()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
    
@router.post("/alllist")
def project_list(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # ✅ 1. 팀원으로 내가 포함된 프로젝트들 조회
            cursor.execute("""
                SELECT 
                    p.project_id,
                    p.title,
                    p.description,
                    p.category,
                    p.estimated_duration,
                    p.budget,
                    p.urgency,
                    p.progress,
                    p.status
                    DATE(p.create_dt) AS create_date,
                    p.del_yn
                FROM project p
                JOIN team_member tm ON p.project_id = tm.project_id
                WHERE tm.user_id = %s
                  AND tm.del_yn = 'N'
                  AND p.del_yn = 'N'
            """, (user["user_id"],))

            projects = cursor.fetchall()

            if not projects:
                raise HTTPException(status_code=404, detail="참여한 프로젝트가 없습니다.")

            # ✅ 2. 공통 코드 변환
            for project in projects:
                # 긴급도
                cursor.execute("""
                    SELECT code_name FROM common_code
                    WHERE group_id = 'URGENCY_LEVEL'
                    AND code_id = %s
                    AND del_yn = 'N'
                """, (project['urgency'],))
                urgency = cursor.fetchone()
                project['urgency_level'] = urgency['code_name'] if urgency else '-'

                # 카테고리
                cursor.execute("""
                    SELECT code_name FROM common_code
                    WHERE group_id = 'PROJECT_TYPE'
                    AND code_id = %s
                    AND del_yn = 'N'
                """, (project['category'],))
                category = cursor.fetchone()
                project['category_name'] = category['code_name'] if category else '-'

            return {"projects": projects}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/invites")
def get_my_invites(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    jr.request_id,
                    jr.project_id,
                    p.title,
                    p.description,
                    p.estimated_duration,
                    p.budget,
                    p.create_dt,
                    p.progress,
                    jr.status,
                    jr.checking,
                    cat.code_name AS category_name,
                    urg.code_name AS urgency_level
                FROM join_requests jr
                JOIN project p ON jr.project_id = p.project_id
                LEFT JOIN common_code cat ON p.category = cat.code_id AND cat.group_id = 'PROJECT_TYPE'
                LEFT JOIN common_code urg ON p.urgency = urg.code_id AND urg.group_id = 'URGENCY_LEVEL'
                WHERE jr.user_id = %s
                  AND jr.del_yn = 'N'
                  AND p.del_yn = 'N'
                  AND NOT (jr.status = 'N' AND jr.checking = 'Y')
            """, (user["user_id"],))
            rows = cursor.fetchall()
            return {"invites": rows}
    finally:
        conn.close()


#초대 응답
@router.put("/invite/{request_id}/respond")
def respond_to_invite(
    request_id: int,
    response: dict = Body(...),  # {"accept": true or false}
    user: dict = Depends(get_current_user)
):
    is_accept = response.get("accept")
    if is_accept not in [True, False]:
        raise HTTPException(status_code=400, detail="accept 값은 true 또는 false여야 합니다.")

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:  # DictCursor 써야 user["nickname"] 사용 가능
            # 1. 초대 요청 조회
            cursor.execute("""
                SELECT * FROM join_requests
                WHERE request_id = %s AND user_id = %s AND del_yn = 'N'
            """, (request_id, user["user_id"]))
            request_row = cursor.fetchone()

            if not request_row:
                raise HTTPException(status_code=404, detail="초대 요청을 찾을 수 없습니다.")

            # 2. 응답 처리
            cursor.execute("""
                UPDATE join_requests
                SET checking = 'Y',
                    status = %s,
                    update_dt = NOW()
                WHERE request_id = %s
            """, ('Y' if is_accept else 'N', request_id))

            # 나에게 보낸 alerts 알람지우기
            cursor.execute("""
                UPDATE alerts
                SET del_yn ='Y', update_dt = NOW(), update_id = %s
                WHERE value_id = %s AND category="project"
            """, (user["user_id"], request_id))
            
            # 3. 승인일 경우 알림 추가
            if is_accept:
                pm_id = request_row["pm_id"]
                nickname = user.get("nickname", user["user_id"])  # 닉네임이 없으면 user_id 사용
                message = f"{nickname}님이 프로젝트 참여를 승인 요청했습니다."
                link = f"{FRONT_BASE_URL}/admin/projects"
                cursor.execute("""
                    INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
                """, (
                    pm_id,
                    request_id,
                    "project",
                    "시스템 알림",
                    message,
                    link,
                    user["user_id"]
                ))

        conn.commit()
        return {"message": "초대 응답이 처리되었습니다."}
    finally:
        conn.close()


@router.post("/list")
def get_my_accepted_projects(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT
                    p.project_id,
                    p.title,
                    p.description,
                    p.estimated_duration,
                    p.budget,
                    p.progress,
                    p.create_dt AS create_date,
                    cat.code_name AS category_name,
                    urg.code_name AS urgency_level
                FROM join_requests j
                JOIN project p ON j.project_id = p.project_id
                LEFT JOIN common_code cat ON p.category = cat.code_id
                LEFT JOIN common_code urg ON p.urgency = urg.code_id
                WHERE j.user_id = %s
                  AND j.status = 'Y'
                  AND j.checking = 'Y'
                  AND j.del_yn = 'N'
                  AND p.del_yn = 'N'
            """, (user["user_id"],))
            rows = cursor.fetchall()
        return {"projects": rows}
    finally:
        conn.close()

# 백엔드: 실제 참여 확정된 프로젝트 조회 (team_member 기준)
@router.post("/confirmed-projects")
def get_confirmed_projects(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT p.project_id, p.title, p.description, c.code_name as category_name,
                       u.code_name as urgency_level, p.estimated_duration, p.budget, p.progress, p.create_dt
                FROM team_member tm
                JOIN project p ON tm.project_id = p.project_id
                LEFT JOIN common_code c ON p.category = c.code_id
                LEFT JOIN common_code u ON p.urgency = u.code_id
                WHERE tm.user_id = %s AND tm.del_yn = 'N'
            """, (user["user_id"],))
            result = cursor.fetchall()
            return {"confirmed_projects": result}
    finally:
        conn.close()

@router.get("/project/common/{project_id}")
def get_project_common(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1)
    ):
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
                        (
                        SELECT COUNT(*) 
                        FROM post_file f 
                        WHERE f.channel_id = pc.channel_id AND f.del_yn = 'N'
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
        
from datetime import datetime

# @router.post("/projectchannel/{project_id}/create")
# def create_project_channel(project_id: int, projectChannel: ProjectChannel, user: dict = Depends(get_current_user)):
#     if user["role"] != "R02": 
#         raise HTTPException(status_code=403, detail="관리자 권한 필요")
    
#     try:
#         conn = pymysql.connect(**db_config)
#         with conn.cursor() as cursor:
#             sql = """
#                 INSERT INTO project_channel 
#                 (title, user_id, content, create_dt, create_id, value_id, category, del_yn)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
#             """
#             now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             cursor.execute(sql, (
#                 projectChannel.title,             # title
#                 projectChannel.pm_id,             # user_id
#                 projectChannel.content,           # content
#                 now,                              # create_dt
#                 user["user_id"],                  # create_id
#                 projectChannel.teamMemberId,      # value_id
#                 "board02",                        # category
#                 "N"                               # del_yn
#             ))

#             cursor.execute("""
#                     INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
#                     VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
#                 """, (
#                     "",
#                     projectChannel.teamMemberId,
#                     "chat",
#                     "시스템 알림제목",
#                     "시스템 알림내용",
#                     "http://localhost:3000/admin/projects",
#                     user["user_id"]
#                 ))
#         conn.commit()
#         return {"message": "게시글이 등록되었습니다."}
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()


@router.post("/projectchannel/{project_id}/create")
async def create_project_channel_with_file(
    project_id: int,
    title: str = Form(...),
    pm_id: str = Form(...),
    content: str = Form(...),
    teamMemberId: int = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    user: dict = Depends(get_current_user)
):
    if user["role"] != "R02":
        raise HTTPException(status_code=403, detail="관리자 권한 필요")

    allowed_types = {"image/jpeg", "image/jpg",  "image/png", "image/gif", "image/webp"}
    UPLOAD_DIR = "C:/Users/admin/uploads/projectchannel"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # 1. 게시글 등록
            cursor.execute("""
                INSERT INTO project_channel 
                (title, user_id, content, create_dt, create_id, value_id, category, del_yn)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, pm_id, content, now, user["user_id"], teamMemberId, "board02", "N"))
            
            channel_id = cursor.lastrowid

            # 2. 파일 저장
            if files:
                for file in files:
                    if file.content_type not in allowed_types:
                        raise HTTPException(status_code=400, detail="이미지 파일만 등록하실 수 있습니다.")
                    
                    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
                    filepath = os.path.join(UPLOAD_DIR, filename)

                    with open(filepath, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)

                    cursor.execute("""
                        INSERT INTO post_file (channel_id, file_name, file_path, create_dt, create_id, del_yn)
                        VALUES (%s, %s, %s, NOW(), %s, 'N')
                    """, (channel_id, file.filename, filepath, user["user_id"]))
            link = f"{FRONT_BASE_URL}/admin/projects"
            # 3. 알림 등록
            cursor.execute("""
                INSERT INTO alerts (target_user, value_id, category, title, message, link, create_dt, create_id)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
            """, (
                "", 
                teamMemberId, 
                "chat", 
                "시스템 알림제목",
                "시스템 알림내용",
                link, 
                user["user_id"]))

        conn.commit()
        return {"message": "게시글과 이미지가 등록되었습니다."}
    except Exception as e:
        import traceback
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

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import pymysql

class ProjectChannel(BaseModel):
    title: str
    user_id: str
    content: str

@router.put("/projectchannel/{channel_id}/update")
def update_project_channel(
    channel_id: int, 
    title: str = Form(...),
    pm_id: str = Form(...),
    content: str = Form(...),
    delete_ids: Optional[List[int]] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    user: dict = Depends(get_current_user)
):
    
    allowed_types = {"image/jpeg", "image/jpg",  "image/png", "image/gif", "image/webp"}
    UPLOAD_DIR = "C:/Users/admin/uploads/projectchannel"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT create_id FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
            if row["create_id"] != user["user_id"]:
                 raise HTTPException(status_code=403, detail="작성자만 수정할 수 있습니다.")

            cursor.execute("""
                UPDATE project_channel
                SET title = %s,
                    content = %s,
                    update_dt = NOW(),
                    update_id = %s
                WHERE channel_id = %s
            """, (title, content, user["user_id"], channel_id))

            # 삭제할 이미지 파일 처리
            for file_id in delete_ids or []:
                cursor.execute("SELECT file_path FROM post_file WHERE file_id = %s", (file_id,))
                result = cursor.fetchone()
                if result and os.path.exists(result["file_path"]):
                    os.remove(result["file_path"])
                cursor.execute("DELETE FROM post_file WHERE file_id = %s", (file_id,))
            # 새 이미지 파일 저장
            if files:
                for file in files:
                    if file.content_type not in allowed_types:
                        raise HTTPException(status_code=400, detail="이미지 파일만 등록하실 수 있습니다.")
                    
                    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
                    filepath = os.path.join(UPLOAD_DIR, filename)
                    with open(filepath, "wb") as buffer:
                        shutil.copyfileobj(file.file, buffer)

                    cursor.execute("""
                        INSERT INTO post_file (channel_id, file_name, file_path, create_dt, create_id, del_yn)
                        VALUES (%s, %s, %s, NOW(), %s, 'N')
                    """, (channel_id, file.filename, filepath, user["user_id"]))

        conn.commit()
        return {"message": "글이 수정되었습니다."}
    except Exception as e:
        import traceback
        print("❌ 예외 발생:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

        
@router.get("/project/{project_id}/members")
def get_project_members(project_id: int, user: dict = Depends(get_current_user)):
    if user["role"] not in ["R04", "R03", "R02"]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
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

            return {"members": members, "pm_id": pm_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        

@router.get("/project/{project_id}/user/{user_id}/{teamMemberId}")
def get_user_project_channel(
    project_id: int, 
    user_id: str,
    teamMemberId: int, 
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1),
    user: dict = Depends(get_current_user)):
    if user["role"] == "R02" and user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="해당 채널에 접근할 수 없습니다.")

    try:
        offset = (page - 1) * page_size
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # sql = """
            #     SELECT 
            #         pc.channel_id,
            #         pc.title,
            #         pc.content,
            #         pc.user_id,
            #         u.nickname,
            #         pc.create_id,
            #         pc.create_dt
            #     FROM project_channel pc
            #     JOIN user u ON pc.create_id = u.user_id
            #     WHERE pc.del_yn = 'N'
            #       AND pc.project_id = %s
            #       AND pc.user_id = %s
            #       AND (
            #             pc.create_id = %s
            #             OR u.role = 'R03'
            #       )
            #     ORDER BY pc.create_dt DESC
            # """
            # cursor.execute(sql, (project_id, user_id, user_id))
            # items = cursor.fetchall()

            cursor.execute("""
                SELECT pm_id 
                FROM project
                WHERE project_id = %s
            """, (project_id,))
            pm_row = cursor.fetchone()
            pm_id = pm_row["pm_id"] if pm_row else None

            # 🔍 user_id 또는 pm_id가 작성한 글만 가져오기
            cursor.execute("""
                    SELECT 
                        c.channel_id, 
                        c.value_id, 
                        c.title, 
                        c.content,
                        c.user_id, 
                        c.create_dt, 
                        c.create_id, 
                        u.nickname,
                        (
                            SELECT COUNT(*) 
                            FROM post_file f 
                            WHERE f.channel_id = c.channel_id AND f.del_yn = 'N'
                        ) AS has_image
                    FROM project_channel c
                    JOIN user u ON c.create_id = u.user_id
                    WHERE c.value_id = %s
                        AND c.create_id IN (%s, %s)
                        AND c.del_yn = 'N'
                        AND c.category = "board02"
                    ORDER BY c.create_dt DESC
                    LIMIT %s OFFSET %s
                """, (teamMemberId, user_id, pm_id, page_size, offset))
            
            channels = cursor.fetchall()
            
            cursor.execute("""
                SELECT COUNT(*) AS total
                FROM project_channel c
                WHERE c.value_id = %s
                    AND c.create_id IN (%s, %s)
                    AND c.del_yn = 'N'
                    AND c.category = "board02"
                """, (teamMemberId, user_id, pm_id))

            total = cursor.fetchone()["total"]
            
            return {"items": channels, "pm_id": pm_id, "total": total}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/projectchannel/{channel_id}")
def get_project_channel(channel_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    channel_id, value_id, title, content, user_id, create_dt, create_id
                FROM project_channel
                WHERE channel_id = %s AND del_yn = 'N'
            """, (channel_id,))
            data = cursor.fetchone()
            if not data:
                raise HTTPException(status_code=404, detail="해당 글을 찾을 수 없습니다.")
            return data
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
        
@router.get("/user/tech-stacks")
def get_tech_stacks():
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 자식 코드만 가져오기 (PARENT_CODE가 NULL 아닌 것만)  React , Node.js 등등
            sql = """
                SELECT code_id, code_name, parent_code
                FROM common_code
                WHERE group_id = 'TECH_STACK' AND parent_code IS NOT NULL
                ORDER BY code_id ASC
            """
            cursor.execute(sql)
            child_codes = cursor.fetchall()

            # 부모 코드도 같이 가져오기  프론트엔드, 백엔드 등등
            cursor.execute("""
                SELECT code_id, code_name
                FROM common_code
                WHERE group_id = 'TECH_STACK' AND parent_code IS NULL
                ORDER BY code_id ASC
            """)
            parent_codes = cursor.fetchall()

        # 🧠 분류용 딕셔너리로 정리
        result = {}
        parent_map = {row["code_id"]: row["code_name"] for row in parent_codes}
        for item in child_codes:
            parent_name = parent_map.get(item["parent_code"], "기타")
            if parent_name not in result:
                result[parent_name] = []
            result[parent_name].append({
                "label": item["code_name"],
                "code_id": item["code_id"],
                "parent_code": item["parent_code"]
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))