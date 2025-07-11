# 📁 backend/utils/email_utils.py
import smtplib
from email.mime.text import MIMEText
import os

BASE_URL = os.getenv("REACT_APP_API_URL")

def send_verification_email(email: str, code: str):
    # 환경 변수에서 이메일 전송 설정값 가져오기
    smtp_host = os.getenv("EMAIL_HOST")
    smtp_port = int(os.getenv("EMAIL_PORT"))
    smtp_user = os.getenv("EMAIL_USER")
    smtp_pass = os.getenv("EMAIL_PASS")

    # 이메일 내용 작성
    msg = MIMEText(f"이메일 인증을 위해 아래 링크를 클릭하세요:\n\n{BASE_URL}/user/verify-email?code={code}\n\n인증코드 : {code}")
    msg["Subject"] = "이메일 인증 링크"
    msg["From"] = smtp_user
    msg["To"] = email

    # SMTP 서버 연결 및 이메일 전송
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()  # TLS 보안 연결 시작
        server.login(smtp_user, smtp_pass)  # 로그인
        server.sendmail(smtp_user, email, msg.as_string())  # 이메일 전송
