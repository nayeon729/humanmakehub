
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
import pymysql
import bcrypt
from jwt_auth import create_access_token, get_current_user
from database import db_config

app = FastAPI(title="HumanMakeHub API", description="FastAPI + pymysql + JWT 인증 기반 플랫폼 API")

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str
    phone: Optional[str] = None
    company: Optional[str] = None
    portfolio: Optional[str] = None
    nickname: Optional[str] = None
    skills: Optional[str] = None
    career: Optional[str] = None
    contact: Optional[str] = None

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
            user = cursor.fetchone()
        if not user or not bcrypt.checkpw(form_data.password.encode(), user["password"].encode()):
            raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
        access_token = create_access_token(data={"sub": str(user["id"]), "username": user["username"]})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/me")
def get_my_info(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "username": user.get("username", "")
    }

@app.post("/register")
def register_user(user: UserRegister):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
            hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
            sql = '''
                INSERT INTO users (username, email, password, role)
                VALUES (%s, %s, %s, %s)
            '''
            cursor.execute(sql, (user.username, user.email, hashed_pw, user.role))
        conn.commit()
        return {"message": "회원가입 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

 # ✅ 라우터 포함
app.include_router(router)

