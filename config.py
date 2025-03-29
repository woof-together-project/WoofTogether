from sqlalchemy.engine import URL
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env
db_user = os.getenv("AWS_DB_USER")
db_password = os.getenv("AWS_DB_PASSWORD")
db_endpoint = os.getenv("AWS_DB_ENDPOINT")

class Config:
    SQLALCHEMY_DATABASE_URI = URL.create(
        "mssql+pyodbc",
        username=db_user,
        password=db_password,
        host=db_endpoint,
        port=1433,
        database="WoofTogether",
        query={
            "driver": "ODBC Driver 17 for SQL Server",
            "TrustServerCertificate": "yes",
            "Encrypt": "no",
        }
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False