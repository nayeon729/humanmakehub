from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import pymysql
import bcrypt
from jwt_auth import create_access_token, get_current_user
from database import db_config

import random, string
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from email_utils import send_verification_email  # 위에서 만든 이메일 함수

router = APIRouter(prefix="", tags=["User"])

# ---------- 모델 ----------
class SkillItem(BaseModel):
    code_id: str       # 기술 코드 (ex: B01, C02 등)
    years: str       # "신입" or "3년"
    code_name: str    # 기술 이름 (ex: React, Python 등)
    parent_code: str  # 부모코드 (ex: T01, T02 등)

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

class FindRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class askSend(BaseModel):
    username: str
    company: str
    phone: str
    position: Optional[str] = None
    email: str
    category: Optional[str] = None
    askMessage: str

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
                us.code_id,
                cc.code_name,
                us.years,
                us.parent_code,
                us.is_fresher
            FROM user_skills us
            JOIN common_code cc ON us.code_id = cc.code_id
            WHERE us.user_id = %s AND us.del_yn = 'N'
        """, (user["user_id"],))
            skills = cursor.fetchall()

            skill_list = []
            for s in skills:
                experience = "신입" if s["is_fresher"] == 'Y' else f"{s['years']}년"
                skill_list.append({
                    "code_id": s["code_id"],
                    "skill_name": s["code_name"],
                    "years": s["years"],
                    "is_fresher": s["is_fresher"],
                    "parent_code": s["parent_code"]
                })

            return {
                "user_id": user_info["user_id"],
                "nickname": user_info["nickname"],
                "email": user_info["email"],
                "phone": user_info["phone"],
                "company": user_info["company"],
                "tech": user_info["tech"],
                "experience": user_info["experience"],
                "git": user_info["git"],
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
                        user_id, years, is_fresher, code_id, code_name, parent_code, create_dt, del_yn
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, NOW(), 'N'
                    )
                '''
                for skill in user.skills:
                    is_fresher = 'Y' if skill.years.strip() == "신입" else 'N'
                    try:
                        years = 0 if is_fresher == 'Y' else int(skill.years.strip().replace("년", ""))
                    except ValueError:
                        raise HTTPException(status_code=400, detail=f"경력 입력값 오류: {skill.years}")
                    cursor.execute(sql_skill, (
                        user.user_id, years, is_fresher, skill.code_id, skill.code_name, skill.parent_code
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
        "message": ""
    }

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # user_id 중복 확인
            if data.user_id:
                cursor.execute("SELECT user_id FROM user WHERE user_id = %s AND del_yn = 'N'", (data.user_id,))
                result["user_idExists"] = cursor.fetchone() is not None

            # 이메일 중복 확인
            if data.email:
                cursor.execute("SELECT user_id FROM user WHERE email = %s AND del_yn = 'N'", (data.email,))
                result["emailExists"] = cursor.fetchone() is not None
                # ✅ 중복이 없을 때만 인증코드 발송
                if not result["emailExists"]:
                    # 32자리 랜덤 인증 코드 생성 (영문 + 숫자 조합)
                    code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
                    
                    # 3분 후 만료되도록 설정
                    expire_time = datetime.now() + timedelta(minutes=3)

                    # 인증 테이블에 이메일과 코드 저장  create_dt는 자동으로 현재시간 테이블있음
                    cursor.execute("""
                        INSERT INTO email_verification (email, code, expire_at)
                        VALUES (%s, %s, %s)
                    """, (data.email, code, expire_time))
                    conn.commit()

                    # 이메일 전송
                    send_verification_email(data.email, code)

                    # ✅ 메시지 담기
                    result["message"] = "인증 메일을 보냈습니다!"



        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# 기술불러오기
@router.get("/tech-stacks")
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


@router.get("/verify-email")
def verify_email(code: str):
    # DB 연결
    conn = pymysql.connect(**db_config)
    with conn.cursor() as cursor:
        # ✅ 먼저 해당 코드를 가진 이메일을 찾기
        cursor.execute("""
            SELECT id, email FROM email_verification
            WHERE code = %s
            AND is_verified = FALSE
            AND expire_at > NOW()
        """, (code,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 코드입니다.")

        email = row["email"]

        # ✅ 해당 이메일의 가장 최신 인증 코드인지 확인 (만료되지 않고, 아직 인증 안 된 것만)
        cursor.execute("""
            SELECT id FROM email_verification
            WHERE email = %s
            AND is_verified = FALSE
            AND expire_at > NOW()
            ORDER BY create_dt DESC
            LIMIT 1
        """, (email,))
        latest_row = cursor.fetchone()

        if not latest_row or latest_row["id"] != row["id"]:
            raise HTTPException(status_code=400, detail="이 코드는 최신 인증 코드가 아닙니다.")
        

        # 인증 완료 처리
        cursor.execute("UPDATE email_verification SET is_verified = TRUE WHERE id = %s", (latest_row["id"],))
        conn.commit()

    return {"message": f"{row['email']} 인증이 완료되었습니다!"}


@router.post("/Find-email")
def check_duplicate(data: FindRequest):
    result = {
        "emailExists": False,
        "message": "",
        "user_id": "",
        "email": "",
    }

    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            
            # 이메일만 있으면 실행
            if not data.user_id and data.email:
                cursor.execute("SELECT * FROM user WHERE email = %s AND del_yn = 'N'", (data.email,))
                row = cursor.fetchone()
                result["emailExists"] = row is not None
                # ✅ 가입된 이메일이 있으면 인증코드 발송
                if result["emailExists"]:
                    # 32자리 랜덤 인증 코드 생성 (영문 + 숫자 조합)
                    code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
                    
                    # 3분 후 만료되도록 설정
                    expire_time = datetime.now() + timedelta(minutes=3)

                    # 인증 테이블에 이메일과 코드 저장  create_dt는 자동으로 현재시간 테이블있음
                    cursor.execute("""
                        INSERT INTO email_verification (email, code, expire_at)
                        VALUES (%s, %s, %s)
                    """, (data.email, code, expire_time))
                    conn.commit()

                    # 이메일 전송
                    send_verification_email(data.email, code)

                    # ✅ 메시지 담기
                    result["message"] = "인증 메일을 보냈습니다!"

            # 아이디, 이메일 둘다 있으면 실행
            if data.user_id and data.email:
                cursor.execute("SELECT * FROM user WHERE user_id = %s AND email = %s AND del_yn = 'N'", (data.user_id, data.email,))
                row = cursor.fetchone()
                result["emailExists"] = row is not None
                if row:
                    result["user_id"] = row["user_id"]
                    result["email"] = row["email"]
                # ✅ 가입된 이메일이 있으면 인증코드 발송
                if result["emailExists"]:
                    # 32자리 랜덤 인증 코드 생성 (영문 + 숫자 조합)
                    code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
                    
                    # 3분 후 만료되도록 설정
                    expire_time = datetime.now() + timedelta(minutes=3)

                    # 인증 테이블에 이메일과 코드 저장  create_dt는 자동으로 현재시간 테이블있음
                    cursor.execute("""
                        INSERT INTO email_verification (email, code, expire_at)
                        VALUES (%s, %s, %s)
                    """, (data.email, code, expire_time))
                    conn.commit()

                    # 이메일 전송
                    send_verification_email(data.email, code)

                    # ✅ 메시지 담기
                    result["message"] = "인증 메일을 보냈습니다!"

                if not row:
                    raise HTTPException(status_code=400, detail="아이디 및 이메일을 확인해주세요.")
            

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/idFind")
def idFind(email: str):
    # DB 연결
    conn = pymysql.connect(**db_config)
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        # ✅ 먼저 해당 코드를 가진 이메일을 찾기
        cursor.execute("""
            SELECT user_id, create_dt FROM user
            WHERE email = %s
            AND del_yn = 'N'
        """, (email,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="가입된 아이디가 존재하지 않습니다.")

    return row

@router.post("/pwFind")
def idFind(data: FindRequest):
    # DB 연결
    conn = pymysql.connect(**db_config)
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        hashed_pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

        # ✅ 먼저 해당 코드를 가진 이메일을 찾기
        cursor.execute("""
            UPDATE user SET password = %s, update_dt = NOW() WHERE user_id = %s AND email = %s AND del_yn ='N'
        """, (hashed_pw, data.user_id, data.email,))

        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="비밀번호 재설정 실패")

    return {"message": "비밀번호 재설정 완료!"}

@router.post("/askSend")
def askSending(data: askSend):
    try:
        # DB 연결
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                INSERT INTO ask (username, company, phone, position, email, category, description, create_dt, del_yn)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), 'N')
            """, (data.username, data.company, data.phone, data.position, data.email, data.category, data.askMessage,))

            ask_id = cursor.lastrowid

            # ✨ 알림 추가
            cursor.execute("""
                INSERT INTO alerts (
                    target_user, value_id, category, title, message, link, answer_yn, create_dt, del_yn, create_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, 'N', NOW(), 'N', %s
                )
            """, (
                "R03",  # 알림 받을 대상   이거받는곳 if문에 R04도 넣어서 상관없음
                ask_id,
                "ask",
                "시스템 알람",
                "새로운 문의사항이 등록되었습니다.",
                "http://localhost:3000/admin/askList",
                "client"  # 알림 보낸 사람
            ))
            conn.commit()

        return {"message": "문의사항 작성완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/portfoliotest")
def get_portfolio():
    # DB 연결
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # 1. 포트폴리오 전체 조회
            cursor.execute("""
                SELECT * FROM portfolio
                WHERE del_yn = 'N'
                ORDER BY create_dt ASC
            """, ())
            portfolios = cursor.fetchall()

            # 2. 포트폴리오 ID 목록 추출
            portfolio_ids = [p["portfolio_id"] for p in portfolios]

            if not portfolio_ids:
                return {"portfolios": []}

            # 3. 관련 기술 목록 가져오기
            format_strings = ','.join(['%s'] * len(portfolio_ids))  # 조회된 포트폴리오 id 갯수만큼 %s, %s 만들어줌
            cursor.execute(f"""
                SELECT ps.portfolio_id, cc.code_name, cc.code_id, cc.parent_code
                FROM portfolio_skill ps
                JOIN common_code cc ON ps.code_id = cc.code_id
                WHERE ps.portfolio_id IN ({format_strings}) AND ps.del_yn = 'N'
            """, portfolio_ids)
            skill_rows = cursor.fetchall()

            # 4. 포트폴리오 ID별로 기술 이름 묶기
            from collections import defaultdict
            skills_map = defaultdict(list)
            for row in skill_rows:
                skills_map[row["portfolio_id"]].append(row["code_name"])

            # 5. tags 추가해서 결과 조립
            for portfolio in portfolios:
                portfolio["tags"] = skills_map.get(portfolio["portfolio_id"], [])

            return {"portfolios": portfolios}
    finally:
        conn.close()

