from main import app
import os

# Функция-обработчик для Vercel serverless функций
handler = app
 
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port) 