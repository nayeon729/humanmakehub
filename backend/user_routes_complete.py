from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import pymysql
import bcrypt
from jwt_auth import create_access_token, get_current_user
from database import db_config

router = APIRouter(prefix="", tags=["User"])

# ---------- 모델 ----------
class SkillItem(BaseModel):
    skill_code: str       # 기술 코드 (ex: B01, C02 등)
    experience: str       # "신입" or "3년"

class UserRegister(BaseModel):
    user_id: str
    nickname: str
    email: EmailStr
    password: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None
    portfolio: Optional[str] = None
    skills: Optional[List[SkillItem]] = None

class DuplicateCheckRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    nickname: Optional[str] = None

# ---------- 로그인 ----------
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM user WHERE user_id = %s AND del_yn = 'N'", (form_data.username,))
            user = cursor.fetchone()
        if not user or not bcrypt.checkpw(form_data.password.encode(), user["password"].encode()):
            raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
        access_token = create_access_token(data={"sub": str(user["user_id"]), "nickname": user["nickname"], "role": user["role"]})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ---------- 내 정보 조회 ----------
@router.get("/me")
def get_my_info(user: dict = Depends(get_current_user)):
    print("🔥 get_my_info 받은 user:", user)
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM user WHERE user_id = %s", (user["user_id"],))
            user_info = cursor.fetchone()
            if user_info is None:
                raise HTTPException(status_code=404, detail="유저 정보를 찾을 수 없습니다.")
            cursor.execute("""
                SELECT 
                    us.skill_id,
                    cc.code_name,
                    us.experience,
                    us.is_fresher
                FROM user_skills us
                JOIN common_code cc ON us.skill_id = cc.code_id
                WHERE us.user_id = %s AND us.del_yn = 'N'
            """, (user["user_id"],))
            skills = cursor.fetchall()

            skill_list = []
            for s in skills:
                experience = "신입" if s["is_fresher"] == 'Y' else f"{s['experience']}년"
                skill_list.append({
                    "skill_id": s["skill_id"],
                    "skill_name": s["code_name"],
                    "experience": experience
                })

            return {
                "user_id": user_info["user_id"],
                "nickname": user_info["nickname"],
                "email": user_info["email"],
                "phone": user_info["phone"],
                "company": user_info["company"],
                "portfolio": user_info["portfolio"],
                "role": user_info["role"],
                "skills": skill_list
            }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        conn.close()

# ---------- 회원가입 ----------
@router.post("/register")
def register_user(user: UserRegister):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT user_id FROM user WHERE user_id = %s", (user.user_id,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
            cursor.execute("SELECT user_id FROM user WHERE nickname = %s", (user.nickname,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")
            cursor.execute("SELECT user_id FROM user WHERE email = %s", (user.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

            hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
            sql = '''
                INSERT INTO user (user_id, nickname, email, password, role, phone, company, portfolio, create_dt, del_yn)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'N')
            '''
            cursor.execute(sql, (
                user.user_id, user.nickname, user.email, hashed_pw, user.role,
                user.phone, user.company, user.portfolio
            ))

            # 기술 스택 등록
            if user.skills:
                sql_skill = '''
                    INSERT INTO user_skills (
                        user_id, skill_code, experience, is_fresher, create_dt, del_yn
                    ) VALUES (
                        %s, %s, %s, %s, NOW(), 'N'
                    )
                '''
                for skill in user.skills:
                    is_fresher = 'Y' if skill.experience.strip() == "신입" else 'N'
                    try:
                        years = 0 if is_fresher == 'Y' else int(skill.experience.strip().replace("년", ""))
                    except ValueError:
                        raise HTTPException(status_code=400, detail=f"경력 입력값 오류: {skill.experience}")
                    cursor.execute(sql_skill, (
                        user.user_id, skill.skill_code, years, is_fresher
                    ))

        conn.commit()
        return {"message": "회원가입 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/check-duplicate")
def check_duplicate(data: DuplicateCheckRequest):
    result = {
        "user_idExists": False,
        "emailExists": False,
        "nicknameExists": False
    }

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # user_id 중복 확인
            if data.user_id:
                cursor.execute("SELECT user_id FROM user WHERE user_id = %s", (data.user_id,))
                result["user_idExists"] = cursor.fetchone() is not None

            # 이메일 중복 확인
            if data.email:
                cursor.execute("SELECT user_id FROM user WHERE email = %s", (data.email,))
                result["emailExists"] = cursor.fetchone() is not None

            # 닉네임 중복 확인
            if data.nickname:
                cursor.execute("SELECT user_id FROM user WHERE nickname = %s", (data.nickname,))
                result["nicknameExists"] = cursor.fetchone() is not None

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()