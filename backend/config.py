import os
from dotenv import load_dotenv

# load_dotenv() mencari file .env di direktori di atasnya (root folder)
load_dotenv()

class Settings:
    # mengambil nilai dari .env atau default ke localhost jika tidak ada
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

settings = Settings()