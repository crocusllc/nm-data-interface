
import os
import csv
import io
import jwt
import datetime
import psycopg2
from flask import Flask, request, jsonify, send_file
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from passlib.hash import bcrypt
from functools import wraps

def get_database_config(config_path="config.yaml"):
    """Load database configuration from a YAML file."""
    with open(config_path, "r") as file:
        docs = yaml.safe_load_all(file)
    for doc in docs:
        if doc.get('database'):
            config = doc['database']
    return config

def setup_db_connection():
    """Set up database connection using credentials from config.yaml."""
    db_config = get_database_config()
    print(db_config)
    # Create database connection string
    db_url = (f"postgresql+psycopg2://{db_config['user']}:{db_config['password']}"
              f"@{db_config['host']}:{db_config['port']}/{db_config['name']}")
    
    # Initialize SQLAlchemy engine and session
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Reflect existing database tables
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    # Retrieve users table explicitly
    users_table = metadata.tables.get("users")
    if users_table is None:
        raise ValueError("Users table not found in the database schema.")
    
    return engine, session, metadata, users_table

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "SUPER-SECRET"

    # Set up DB engine
    engine = create_engine("postgresql+psycopg2://postgres:postgres@localhost:5433/ptt_db", echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

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


    # ========== AUTH DECORATOR ==========
    def login_required(role_required=None):
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                auth_header = request.headers.get('Authorization', None)
                if not auth_header or not auth_header.startswith("Bearer "):
                    return jsonify({"error": "Missing or invalid Authorization header"}), 401
                token = auth_header.split(" ")[1]
                try:
                    decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                    request.user = decoded.get("sub")
                    request.user_role = decoded.get("role")
                    if role_required and request.user_role not in role_required:
                        return jsonify({"error": "Access denied"}), 403
                except jwt.ExpiredSignatureError:
                    return jsonify({"error": "Token expired"}), 401
                except jwt.InvalidTokenError:
                    return jsonify({"error": "Invalid token"}), 401
                return f(*args, **kwargs)
            return decorated_function
        return decorator

    # ========== LOGIN ENDPOINT ==========
    @app.route("/login", methods=["POST"])
    def login():
        data = request.get_json() or {}
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return jsonify({"error": "Missing username/password"}), 400
        user = session.execute(text(select password from ))).fetchone()
        if not user:
            return jsonify({"error": "Invalid username or password"}), 401

        stored_hash = user[users_table.c.password_hash]
        if not bcrypt.verify(password, stored_hash):
            return jsonify({"error": "Invalid username or password"}), 401

        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        token = jwt.encode(
            {
                "sub": username,
                "role": user[users_table.c.user_role],
                "exp": expiration
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )
        return jsonify({"token": token})

    # ========== FILE UPLOAD ENDPOINT ==========
    @app.route("/file_upload", methods=["POST"])
    @login_required(role_required=["admin", "editor"])
    def file_upload():
        data = request.get_json() or {}
        file_name = data.get("file_name")
        table_name = data.get("table_name")
        fields = data.get("fields", [])
        file_content = request.files.get("file")

        if not file_name or not table_name or not fields or not file_content:
            return jsonify({"error": "Missing file_name, table_name, fields, or file"}), 400
        
        # Read file content
        stream = io.StringIO(file_content.stream.read().decode("utf-8"))
        csv_reader = csv.DictReader(stream)

        if table_name not in ["student_info", "program_info", "clinical_placement_info"]:
            return jsonify({"error": "Invalid table_name"}), 400
        
        table = metadata.tables.get(table_name)
        if not table:
            return jsonify({"error": "Table not found"}), 400

        rows_to_insert = []
        for row in csv_reader:
            row_data = {field: row[field] for field in fields if field in row}
            rows_to_insert.append(row_data)

        conn = engine.connect()
        conn.execute(table.insert(), rows_to_insert)
        conn.close()
        
        return jsonify({"message": "File uploaded successfully", "file_name": file_name, "table_name": table_name})

 # ========== FILE DOWNLOAD ENDPOINT ==========
    @app.route("/file_download", methods=["POST"])
    @login_required(role_required=["admin", "viewer"])
    def file_download():
        data = request.get_json() or {}
        file_name = data.get("file_name")
        fields = data.get("fields", [])

        if not file_name or not fields:
            return jsonify({"error": "Missing file_name or fields"}), 400

        conn = engine.connect()
        sel = student_table.select().with_only_columns([student_table.c[field] for field in fields if field in student_table.c])
        results = conn.execute(sel).fetchall()
        conn.close()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(fields)
        for row in results:
            writer.writerow([row[field] for field in fields])
        
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=file_name
        )

    # ========== STUDENT RECORD ENDPOINT ==========
    @app.route("/student_record", methods=["GET"])
    @login_required(role_required=["admin", "viewer"])
    def student_record():
        student_id = request.args.get("student_id")
        conn = engine.connect()
        sel = student_table.select()
        if student_id:
            sel = sel.where(student_table.c.id == int(student_id))
        results = conn.execute(sel).fetchall()
        conn.close()

        return jsonify([dict(row) for row in results])

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, host="0.0.0.0")
