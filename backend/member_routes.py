from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
from database import db_config
from jwt_auth import get_current_user
import bcrypt

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
            cursor.execute("""
                UPDATE user
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
                        raw_exp = str(skill.get("experience", "0"))
                        years = int(raw_exp.replace("년", "")) if "년" in raw_exp else int(raw_exp)

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
        with conn.cursor() as cursor:
            # 요청 유효성 체크 (내가 받은 요청인지)
            cursor.execute("""
                SELECT * FROM join_requests
                WHERE request_id = %s AND user_id = %s AND del_yn = 'N'
            """, (request_id, user["user_id"]))
            request_row = cursor.fetchone()

            if not request_row:
                raise HTTPException(status_code=404, detail="초대 요청을 찾을 수 없습니다.")

            # 응답 처리
            cursor.execute("""
                UPDATE join_requests
                SET checking = 'Y',
                    status = %s,
                    update_dt = NOW()
                WHERE request_id = %s
            """, ('Y' if is_accept else 'N', request_id))
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
                SELECT project_id
                FROM team_member
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))
            rows = cursor.fetchall()
        return {"confirmed_projects": [r["project_id"] for r in rows]}
    finally:
        conn.close()
