from sqlalchemy.engine import URL


class Config:
    SQLALCHEMY_DATABASE_URI = URL.create(
        "mssql+pyodbc",
        username="admin",
        password="chillie&sammyrock",
        host="woof-together-db.cteosyo8km48.us-east-1.rds.amazonaws.com",
        port=1433,
        database="WoofTogether",
        query={
            "driver": "ODBC Driver 17 for SQL Server",
            "TrustServerCertificate": "yes",
            "Encrypt": "no",
        }
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False