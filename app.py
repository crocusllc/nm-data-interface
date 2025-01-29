from flask import Flask
import psycopg2

app = Flask(__name__)

@app.route('/')
def hello():
    # Simple health check or DB connection check
    try:
        conn = psycopg2.connect(
            dbname="ptt_db",
            user="postgres",
            password="postgres",
            host="127.0.0.1",
            port="5433"
        )
        cur = conn.cursor()
        cur.execute("SELECT version();")
        db_version = cur.fetchone()
        cur.close()
        conn.close()
        return f"Hello, World! PostgreSQL version: {db_version}"
    except Exception as e:
        return f"Error connecting to DB: {e}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

