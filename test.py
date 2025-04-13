import json
import os
import pyodbc


# Set this so Lambda can find your layer's shared .so files
#os.environ["LD_LIBRARY_PATH"] = "/opt/python/lib"


try:
    # Get DB credentials from env vars
    db_user = 'admin'
    db_password = 'chillie&sammyrock'
    db_host = 'wooftogether.cteosyo8km48.us-east-1.rds.amazonaws.com'
    db_name = 'WoofTogether'

    # ODBC Driver 18 for SQL Server - secure, simple
    conn_str = (
        f"DRIVER=ODBC Driver 18 for SQL Server;"
        f"SERVER={db_host},1433;"
        f"DATABASE={db_name};"
        f"UID={db_user};"
        f"PWD={db_password};"
        f"TrustServerCertificate=yes;"
    )

    # conn = pyodbc.connect('DRIVER={ODBC Driver 18 for SQL Server};SERVER=' + db_host + ';DATABASE=' + db_name + ';UID=' + db_user + ';PWD=' + db_password)


    # Connect and query
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM Dogs")
    row = cursor.fetchone()

    # Return the result as JSON
    # if row:
    #     columns = [column[0] for column in cursor.description]
    #     data = dict(zip(columns, row))
    # else:
    #     data = {"message": "No data found."}

    # return {
    #     "statusCode": 200,
    #     "body": json.dumps(data)
    # }
    while row:
        print(row[2])
        row = cursor.fetchone()

except Exception as e:
    print(e)
