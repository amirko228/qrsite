@echo off
cd src\backend
python -m pip install pyjwt sqlalchemy fastapi uvicorn python-multipart
uvicorn main:app --reload --host 0.0.0.0 --port 8000 