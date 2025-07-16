"""
----------------------------------------------------------------------
파일명     : client_routes.py
설명       : 클라이언트(Client, R01)를 위한 전용 API 라우터

주요 기능
----------------------------------------------------------------------
1. 회원정보 관리
   - 회원 정보 조회 (/userinfo)
   - 회원 정보 수정 (/userupdate)
   - 회원 탈퇴 처리 (/withdraw)
   - 비밀번호 확인 (/verify-password)

2. 프로젝트 관리
   - 프로젝트 등록 (/projects)
   - 등록된 프로젝트 목록 조회 (/list)
   - 프로젝트 목록 필드 내 urgency, category 코드명을 공통코드에서 조회하여 변환 처리

권한 제어
----------------------------------------------------------------------
- 클라이언트(R01) 전용 기능
- JWT 인증을 통해 사용자 정보 확인 후 기능 제공
- 모든 라우트에서 `Depends(get_current_user)` 사용

기타
----------------------------------------------------------------------
- DB는 pymysql 사용 (DictCursor)
- SQL 실행 후 커넥션은 반드시 close
- 공통 코드(urgency, category)는 `common_code` 테이블에서 매핑 처리
- 오류 발생 시 HTTPException으로 상태 및 메시지 반환
----------------------------------------------------------------------
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
import pymysql
import bcrypt
from database import db_config
from jwt_auth import get_current_user 

router = APIRouter( tags=["Client"])


#회원정보 조회
@router.get("/userinfo")
def get_client_user_info(user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    user_id, 
                    nickname, 
                    email,
                    phone,
                    company
                FROM user
                WHERE user_id = %s AND del_yn = 'N'
            """, (user["user_id"],))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="유저 정보를 찾을 수 없습니다.")
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
#회원정보 수정        
@router.put("/userupdate")
def update_user_info(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE user
                SET 
                    phone = %s, 
                    company = %s, 
                    update_dt = NOW()
                WHERE 
                    user_id = %s 
                    AND del_yn = 'N'
            """, (payload["phone"], payload["company"], user["user_id"]))
        conn.commit()
        return {"message": "수정 완료"}
    finally:
        conn.close()

#회원탈퇴
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


@router.post("/projects")
def create_project(payload: dict = Body(...), user: dict = Depends(get_current_user)):
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
                user["user_id"],
                payload.get("projectName"),
                payload.get("projectType"),
                payload.get("projectContent"),
                int(payload.get("estimatedDuration", 0)),
                int(payload.get("budget", 0)),
                payload.get("ugencyLevel"),
                user["user_id"]
            ))
        conn.commit()
        return {"message": "프로젝트가 등록되었습니다!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/list")
def project_list(payload: dict = Body(...), user: dict = Depends(get_current_user)):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            # 프로젝트 목록을 가져옵니다.
            cursor.execute("""
                SELECT 
                    title,
                    category,
                    description,
                    estimated_duration,
                    budget,
                    urgency,
                    progress,
                    status,
                    DATE(create_dt) AS create_date,
                    del_yn
                FROM
                    project
                WHERE
                    client_id = %s
                    AND del_yn = 'N'
                ORDER BY create_dt DESC  
            """, (user["user_id"],))

            projects = cursor.fetchall()  # 프로젝트 목록을 가져옵니다.
            
            if not projects:
                raise HTTPException(status_code=404, detail="프로젝트가 없습니다.")
            
            # 각 프로젝트의 'urgency' 값을 'code_name'으로 변환
            for project in projects:
                # urgency 값을 공통 코드에서 가져오기
                cursor.execute("""
                    SELECT code_name
                    FROM common_code
                    WHERE group_id = 'URGENCY_LEVEL' 
                    AND code_id = %s
                    AND del_yn = 'N'
                """, (project['urgency'],))

                urgency_level = cursor.fetchone()
                if urgency_level:
                    project['urgency_level'] = urgency_level['code_name']
                else:
                    project['urgency_level'] = ' - '  # 공통코드가 없는 경우 처리
                
                # category 값을 공통 코드에서 가져오기
                cursor.execute("""
                    SELECT code_name
                    FROM common_code
                    WHERE group_id = 'PROJECT_TYPE' 
                    AND code_id = %s
                    AND del_yn = 'N'
                """, (project['category'],))

                project_type = cursor.fetchone()
                if project_type:
                    project['category_name'] = project_type['code_name']
                else:
                    project['category_name'] = ' - '  # 공통코드가 없는 경우 처리

            return {"projects": projects}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()