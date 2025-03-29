import pyodbc
from urllib.parse import quote_plus

password = quote_plus("chillie&sammyrock")  # Encode the & and other special chars

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=woof-together-db.cteosyo8km48.us-east-1.rds.amazonaws.com,1433;"
    "DATABASE=WoofTogether;"
    "UID=admin;"
    f"PWD={password};"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
)

try:
    conn = pyodbc.connect(conn_str)
    print("✅ Connection successful!")
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)