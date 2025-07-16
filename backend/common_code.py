"""
----------------------------------------------------------------------
파일명     : common_routes.py
설명       : 공통 기능(코드, 알림, 팀원 정보 등)을 제공하는 FastAPI 라우터

주요 기능
----------------------------------------------------------------------
1. 공통 코드 조회
   - 단일 그룹 코드 조회 (/codes/{group_id})
   - 전체 그룹 및 공통코드 조회 (/groups)

2. 알림 관리
   - 사용자 알림 조회 (/alerts)
   - 알림 개별 삭제 (/alerts/{alert_id}/delete)
   - 특정 팀원에 대한 알림 개수 조회 (/alerts/{teamMemberId}/{pmId})
   - 알림 체크 상태 처리 (/alertsCheck)

3. 팀원 ID 조회
   - 프로젝트 ID와 사용자 ID 기준으로 팀원 ID 조회 (/teamMemberId/{project_id}/{user_id})

권한 제어
----------------------------------------------------------------------
- 대부분의 기능은 JWT 인증 필수 (`Depends(get_current_user)`)
- 알림 기능은 역할(role)에 따라 분기 처리 (예: R03/R04는 공통 알림 포함 조회)

기타
----------------------------------------------------------------------
- DB 연결은 pymysql 사용, DictCursor 설정 포함
- SQL 실행 후 커넥션은 반드시 close 처리
- 알림 테이블은 `alerts`, 공통코드는 `group_code`, `common_code` 사용
- 알림 값은 `target_user`, `create_id`, `value_id`, `category` 기준으로 필터링
----------------------------------------------------------------------
"""


from fastapi import APIRouter, HTTPException, Depends, Body
import pymysql
from pydantic import BaseModel
from database import db_config  # ✅ 원래대로!
from typing import List
from jwt_auth import get_current_user 

 
router = APIRouter(prefix="", tags=["공통코드"])


class CommonCode(BaseModel):
    code_id: str
    code_name: str

class GroupCodeWithChildren(BaseModel):
    group_id: str
    group_name: str
    common_codes: List[CommonCode]

# ✅ 단일 그룹 코드 목록 조회
@router.get("/codes/{group_id}", response_model=List[CommonCode])
def get_common_codes(group_id: str):
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT code_id, code_name 
                FROM common_code 
                WHERE group_id = %s AND del_yn = 'N'
            """, (group_id,))
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ✅ 전체 그룹 + 공통코드 함께 조회
@router.get("/groups", response_model=list[GroupCodeWithChildren])
def get_groups_with_codes():
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT group_id, group_name 
                FROM group_code 
                WHERE use_yn = 'Y' AND del_yn = 'N'
            """)
            groups = cursor.fetchall()

            cursor.execute("""
                SELECT code_id, code_name, group_id 
                FROM common_code 
                WHERE use_yn = 'Y' AND del_yn = 'N'
            """)
            codes = cursor.fetchall()

        group_map = {g["group_id"]: {**g, "common_codes": []} for g in groups}
        for code in codes:
            if code["group_id"] in group_map:
                group_map[code["group_id"]]["common_codes"].append({
                    "code_id": code["code_id"],
                    "code_name": code["code_name"]
                })

        return list(group_map.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/alerts")
def get_alerts(user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT *
                FROM alerts
                WHERE target_user = %s AND del_yn = 'N'
                ORDER BY create_dt DESC
            """, (user["user_id"],))
            row1 = list(cursor.fetchall())
            print("row1 type:", type(row1))  # 👈 이거 찍어보면 확실

            if user["role"] in ("R03", "R04"):
                cursor.execute("""
                    SELECT *
                    FROM alerts
                    WHERE target_user = "R03" AND del_yn = 'N'
                    ORDER BY create_dt DESC
                """)
                row2 = cursor.fetchall()
                row1.extend(row2)

        return row1
    finally:
        conn.close()


@router.put("/alerts/{alert_id}/delete")
def delete_alert(alert_id: int, user: dict = Depends(get_current_user)):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor() as cursor:
            # 해당 알림을 del_yn = 'Y'로 업데이트
            cursor.execute("""
                UPDATE alerts
                SET del_yn = 'Y', update_dt = NOW(), update_id = %s
                WHERE alert_id = %s AND target_user = %s
            """, (user["user_id"], alert_id, user["user_id"]))

            if user["role"] in ("R03", "R04"):
            # 관리자면 target_user가 "R03" 인것도 delyn
                cursor.execute("""
                    UPDATE alerts
                    SET del_yn = 'Y', update_dt = NOW(), update_id = %s
                    WHERE alert_id = %s AND target_user = "R03"
                """, (user["user_id"], alert_id))

        conn.commit()
        return {"message": "알림이 삭제되었습니다."}
    finally:
        conn.close()


@router.get("/teamMemberId/{project_id}/{user_id}")
def get_teamMemberId(project_id: int, user_id: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT *
                FROM team_member
                WHERE project_id = %s AND user_id = %s AND del_yn = 'N'
            """, (project_id, user_id))

        data = cursor.fetchone()
        if data:
            return data
        
        return {"team_member_id": "공용"}
    finally:
        conn.close()


@router.get("/alerts/{teamMemberId}/{pmId}")
def get_alertsList(teamMemberId: int, pmId: str):
    try:
        conn = pymysql.connect(**db_config)
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT *
                FROM alerts
                WHERE value_id = %s AND target_user = "" AND create_id = %s AND del_yn = 'N'
            """, (teamMemberId, pmId))

        results = cursor.fetchall()
        alert_count = len(results)
        
        return {"count": alert_count}
    finally:
        conn.close()


@router.post("/alertsCheck")
def alertsCheck(body: dict = Body(...)):
    # DB 연결
    conn = pymysql.connect(**db_config)
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:

        cursor.execute("""
            UPDATE alerts SET del_yn ='Y' WHERE target_user = "" AND create_id = %s AND value_id = %s AND category = "chat" AND del_yn ='N'
        """, (body["user_id"], body["teamMemberId"],))

        conn.commit()

    return {"message": "알람체크 완료!"}