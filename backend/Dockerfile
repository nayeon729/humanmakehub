# FastAPI 앱용 Dockerfile 예시
FROM python:3.10

WORKDIR /app

COPY . /app

RUN pip install --upgrade pip && \
    pip install fastapi uvicorn pymysql python-jose[bcrypt] python-multipart bcrypt \ pydantic[email]  python-dotenv

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]