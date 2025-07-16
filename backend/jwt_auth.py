"""
----------------------------------------------------------------------
파일명     : jwt_auth.py
설명       : FastAPI용 JWT 인증 및 사용자 검증 처리 모듈

주요 기능
----------------------------------------------------------------------
1. JWT 토큰 발급 (`create_access_token`)
   - user_id 등 사용자 정보를 payload로 포함
   - 기본 만료 시간: 60분
   - HS256 알고리즘을 사용하여 서명

2. 사용자 인증 (`get_current_user`)
   - Authorization 헤더에서 Bearer 토큰을 추출해 디코드
   - `sub` 값에서 user_id 추출 후 DB 조회
   - 유효한 사용자인 경우 user dict 반환

3. 의존성 사용 방식
   - FastAPI의 Depends + OAuth2PasswordBearer 사용
   - 각 API 라우트에서 `Depends(get_current_user)`로 인증 적용 가능

설정값
----------------------------------------------------------------------
- SECRET_KEY : JWT 서명용 비밀 키 (개발/운영 분리 필요)
- ALGORITHM : JWT 암호화 알고리즘 (기본: HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES : 토큰 만료 시간 (기본: 60분)

주의사항
----------------------------------------------------------------------
- SECRET_KEY는 .env 등 외부 환경 변수에서 불러오는 방식 권장
- 인증 실패 시 401 Unauthorized 반환
- 토큰에는 반드시 `sub` 필드 포함 필요 (user_id 식별용)
----------------------------------------------------------------------
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

# JWT 설정값
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")

# 토큰 생성 함수
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 사용자 인증
async def get_current_user(token: str = Depends(oauth2_scheme)):
    from database import db_config
    import pymysql

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="유효하지 않은 인증 정보입니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM user WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if user is None:
                raise credentials_exception
            return user
    finally:
        conn.close()
