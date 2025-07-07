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
                WHERE j.user_id = %s AND j.status = '승인' AND p.del_yn = 'N'
            """, (user["user_id"],))
            projects = cursor.fetchall()
        conn.close()
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))