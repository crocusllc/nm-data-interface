import os
import csv
import io
import jwt
import datetime
import psycopg2
import json
import psycopg2.extras
from flask import Flask, request, jsonify, send_file, current_app
from flask_cors import CORS
from passlib.hash import bcrypt
from functools import wraps
import base64

def key_to_text(key_binary):
    return base64.urlsafe_b64encode(key_binary).decode()

def load_key():
    key = open("/app/secret.key", "rb").read()
    return key_to_text(key)

def is_json(str):
  try:
    json.loads(str)
  except ValueError as e:
    return False
  return True

def get_header_data(headers, key):
  auth_header = headers.get('Authorization', None)
  token = auth_header.split(" ")[1]
  decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
  data = decoded.get(key)

  return data

def create_conn():
    # Set up DB engine
    conn = psycopg2.connect(
        dbname="ptt_db",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )

    return conn

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["*"])

    # Set up DB engine
    app.config["SECRET_KEY"] = "SUPER_SECRET"

    @app.route('/')
    def hello():
        # Simple health check or DB connection check
        try:
            conn = create_conn()
            cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
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

        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        cur.execute(f"SELECT user_id, user_role, password_hash, username, new_password from users where username=%s;", (username,))
        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid username or password"}), 401

        stored_hash = user['password_hash']

        if not bcrypt.verify(password, stored_hash):
            return jsonify({"error": "Invalid username or password"}), 401

        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=10)
        token = jwt.encode(
            {
                "sub": username,
                "id": user['user_id'],
                "role": user['user_role'],
                "exp": expiration
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({"token": token, "id": user['user_id'], "username": user['username'], "role": user['user_role'], "new_password": user['new_password']})

    # ========== DELETE USER ENDPOINT ==========
    @app.route("/delete_user", methods=["POST"])
    @login_required(role_required=["administrator"])
    def delete_user():
        data = request.get_json() or {}

        if (data != {}):
            username = data.get("username")
            
            conn = create_conn()
            cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

            if id is not None:
                query = f'DELETE FROM users WHERE username = {username};'
                
                cur.execute(query)
                conn.commit()

                return jsonify({"message": f"The record was deleted successfully."})
            else:
                return jsonify({"error": f"Data missing."})
    
    # ========== CREATE USER ENDPOINT ==========
    @app.route("/create_user", methods=["POST"])
    def create_user():
        data = request.get_json() or {}
        username = data.get("username")
        password = data.get("password")
        useremail = data.get("user_email")
        userrole = data.get("user_role")

        if not username or not password or not useremail or not userrole:
            return jsonify({"error": "Missing fields"}), 400

        date_now = datetime.date.today()
        years_to_add = date_now.year + 5

        expiration_date = date_now.replace(year=years_to_add).strftime('%Y-%m-%d')

        bytes = password.encode("utf-8")
        hash = bcrypt.hash(bytes)
        
        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        query = f"INSERT INTO users (username, password_hash, user_email, password_expiration_date, user_role) VALUES ('{username}','{hash}','{useremail}','{expiration_date}','{userrole}') RETURNING user_id;"
        cur.execute(query)
        returned_id = cur.fetchone()['user_id']
        
        conn.commit()

        cur.close()
        conn.close()

        message = f"The user was created successfully with ID {returned_id}!"

        return jsonify({"message": message })

    # ========== CHANGE PASSWORD ENDPOINT ==========
    @app.route("/change_password", methods=["POST"])
    @login_required(role_required=["administrator", "editor","viewer"])
    def change_password():
        data = request.get_json() or {}
        password = data.get("password")
        
        user = get_header_data(request.headers,'sub')

        bytes = password.encode("utf-8")
        hash = bcrypt.hash(bytes)

        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        query = f"UPDATE users SET password_hash = '{hash}', new_password = FALSE WHERE username = '{user}';"
        cur.execute(query)
        conn.commit()

        cur.close()
        conn.close()

        return jsonify({"message": f"The username {user} set the password successfully!"})

    # ========== FILE UPLOAD ENDPOINT ==========
    @app.route("/file_upload", methods=["POST"])
    @login_required(role_required=["administrator"])
    def file_upload():
        key_encrypt = load_key()

        data = request.get_data()
        json_str = data.decode('utf-8')
        json_objs = json_str.split('\n')

        for obj in json_objs:
            if is_json(obj):
                metadata = json.loads(obj)

        if (metadata):
            file_name = metadata["file_name"]
            table_name = metadata["table_name"]
            fields = metadata["fields"]
        
            file_content = request.files['file']

            if not file_name or not table_name or not fields or not file_content:
                return jsonify({"error": "Missing file_name, table_name, fields, or file"}), 400
        
            # Read file content
            stream = io.StringIO(file_content.stream.read().decode("utf-8"))
            csv_reader = csv.DictReader(stream)

            if table_name not in ["student_info", "program_info", "clinical_placements"]:
                return jsonify({"error": "Invalid table_name"}), 400

            rows_to_insert = []
            for row in csv_reader:
                row_data = {field: row[field] if row[field] != '' else None for field in fields if field in row}
                rows_to_insert.append(row_data)

            # Insert data using psycopg2
            try:
                if rows_to_insert:
            # Extract column names
                    columns = list(rows_to_insert[0].keys())
                    values = [[row[col] if isinstance(row[col], str) and col != 'student_id' and col != 'clinical_id' and col != 'program_id' else row[col] for col in columns] for row in rows_to_insert]
            
            # Build INSERT query dynamically
                    conn = create_conn()
                    cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

                    user_id = get_header_data(request.headers, 'id')
                    total_records= len(values)

                    no_encrypt = {'student_id', 'clinical_id', 'program_id'}

                    base_id = "student_id"
        
                    if table_name == 'clinical_placements':
                        base_id = "clinical_id"

                    if table_name == 'program_info':
                        base_id = "student_id"

                    query = f"""
                        INSERT INTO {table_name} ({', '.join(columns)}) 
                        VALUES ({', '.join([ '%s' if no_encrypt.issuperset([col]) else f"PGP_SYM_ENCRYPT(%s, '{key_encrypt}'::text)::bytea" for col in columns])})
                        ON CONFLICT ({base_id}) DO UPDATE
                        SET {', '.join(f"{key} = EXCLUDED.{key}" for key in columns)}
                        RETURNING {base_id}
                    """

                    for row in values:
                        cur.execute(query, row)

                        returned_id = cur.fetchone()[base_id]
                        conn.commit()

                        query_log = f"INSERT INTO logs(user_id, file_name, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, '{file_name}', 'uploaded', CURRENT_TIMESTAMP, '{table_name}', {returned_id}, {total_records}, 1, 0);"
                        cur.execute(query_log)

                        conn.commit()
 
                    cur.close()
                    conn.close()
            except psycopg2.Error as e:
                return jsonify({"message": f"Database error: {e}", "file_name": file_name, "table_name": table_name})

            return jsonify({"message": "File uploaded successfully", "file_name": file_name, "table_name": table_name})

    # ========== FILE DOWNLOAD ENDPOINT ==========
    @app.route("/file_download", methods=["POST"])
    @login_required(role_required=["administrator"])
    def file_download():
        key_encrypt = load_key()

        data = request.get_json() or {}
        file_name = data.get("file_name")
        fields = data.get("fields", [])

        if not file_name or not fields:
            return jsonify({"error": "Missing file_name or fields"}), 400

        query_fields = ",".join(str(bit) for bit in fields)
        
        if query_fields == "":
             query_fields = "*"

        fields_not_date = fields.copy()

        start_date = ''
        end_date = ''
        exit_date = ''

        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        if query_fields != "*":
            for key in fields:
                if "date" in key:
                    fields_not_date.pop(key, None)

                    if "start" in key and fields[key] != '':                        
                        start_date = f"AND PGP_SYM_DECRYPT({key},'{key_encrypt}'::text)::date >= '{fields[key]}'::date "

                    if "end" in key and fields[key] != '':
                        end_date = f"AND PGP_SYM_DECRYPT({key},'{key_encrypt}'::text)::date <= '{fields[key]}'::date "

                    if "exit" in key and fields[key] != '':
                        exit_date = f"AND PGP_SYM_DECRYPT({key},'{key_encrypt}'::text)::date <= '{fields[key]}'::date "

                if fields[key] == '':
                    fields_not_date.pop(key, None)

            conditions = " AND ".join([f"lower(PGP_SYM_DECRYPT({key}, '{key_encrypt}'::text)) like lower('%{fields_not_date[key]}%')" for key in fields_not_date])

            query_all = f'SELECT * FROM student_info s LEFT JOIN clinical_placements c ON s.student_id=c.student_id LEFT JOIN program_info p ON s.student_id=p.student_id WHERE {conditions} {start_date} {end_date} {exit_date};'
            query_all = query_all.replace("  ", " ")
            query_all = query_all.replace("WHERE AND", "WHERE")
        else:
            query_all = f'SELECT * FROM student_info s LEFT JOIN clinical_placements c ON s.student_id=c.student_id LEFT JOIN program_info p ON s.student_id=p.student_id;'

        cur.execute(query_all)
        results = cur.fetchone()

        columns = results.keys()
        decrypted_columns = ', '.join(f"PGP_SYM_DECRYPT({column}, '{key_encrypt}'::text) as {column}" if column != 'clinical_id' and column != 'program_id' and column != 'student_id' else "ignore" for column in columns)

        decrypted_columns = decrypted_columns.replace("ignore,", "")
        base_query = query_all.replace("*", f"s.student_id, c.clinical_id, {decrypted_columns}")

        cur.execute(base_query)

        result_decrypt = cur.fetchall()

        if len(result_decrypt) >= 1:
            user_id = get_header_data(request.headers, 'id')
            total_records= len(result_decrypt)
            
            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow(result_decrypt[0].keys())            

            for row in result_decrypt:
                writer.writerow([row[field] for field in result_decrypt[0].keys()])

                if row['student_id'] is None:
                    row['student_id'] = 'all'

                query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'downloaded', CURRENT_TIMESTAMP, 'all', {row['student_id']}, {total_records}, 1, 0);"
                    
                cur.execute(query_log)
                conn.commit()
            
            output.seek(0)

            cur.close()
            conn.close()

            return send_file(
                io.BytesIO(output.getvalue().encode("utf-8")),
                mimetype="text/csv",
                as_attachment=True,
                download_name=file_name
            )

        return jsonify({"message": "No data available"})

    # ========== DELETE DATA ENDPOINT ==========
    @app.route("/delete_data", methods=["POST"])
    @login_required(role_required=["administrator", "editor"])
    def delete_record():
        data = request.get_json() or {}

        if (data != {}):
            if 'table_name' in data and 'id' in data:
                id = data.get("id")
                table = data.get("table_name")
                
                user_id = get_header_data(request.headers, 'id')

                conn = create_conn()
                cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
                    
                query = f"DELETE FROM {table} WHERE id={id};"
                cur.execute(query)
                conn.commit()

                query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'deleted', CURRENT_TIMESTAMP, '{table}', {id}, 1, 1, 0);"
                    
                cur.execute(query_log)
                conn.commit()
 
                cur.close()
                conn.close()
                
                return jsonify({"message": f"The record with ID {id} was delete successfully."})
            else:
                return jsonify({"message": f"Missing student_id."})
        
        return jsonify({"message": f"Missing params."})

    # ========== DELETE STUDENT ENDPOINT ==========
    @app.route("/delete_student", methods=["POST"])
    @login_required(role_required=["administrator", "editor"])
    def delete_student():
        data = request.get_json() or {}

        if (data != {}):
            if 'student_id' in data and isinstance(data.get("student_id"), list):
                student_ids = data.get("student_id")

                for student_id in student_ids:
                    user_id = get_header_data(request.headers, 'id')

                    conn = create_conn()
                    cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)
                    
                    query = f"DELETE FROM student_info WHERE student_id={student_id};"
                    cur.execute(query)
                    conn.commit()

                    query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'deleted', CURRENT_TIMESTAMP, 'student_info', {student_id}, 1, 1, 0);"
                    
                    cur.execute(query_log)
                    conn.commit()
    
                    cur.close()
                    conn.close()
                    
                return jsonify({"message": f"The student_ids {list(student_ids)} data was delete successfully."})
            else:
                return jsonify({"message": f"Missing student_id."})
        
        return jsonify({"message": f"Missing params."})

    # ========== UPDATE RECORD ENDPOINT ==========
    @app.route("/update_data", methods=["POST"])
    @login_required(role_required=["administrator", "editor"])
    def update_record():
        fernet_key = load_key()
        data = request.get_json() or {}

        if (data != {}):
            id = data.get("id")

            if 'clinical_id' in data:
                id = data.get("clinical_id")

            if 'program_id' in data:
                id = data.get("program_id")

            student_id = data.get("student_id")
            source = data.get("source")
            user_id = get_header_data(request.headers, 'id')

            # Map source to tables
            source_to_table = {
                "additional_student_data": "program_info",
                "student": "student_info",
                "additional_program_data": "program_info",
                "clinical": "clinical_placements"
            }

            to_update = data.copy()
            to_update.pop('id', None)
            to_update.pop('student_id', None)
            to_update.pop('source', None)

            for key in to_update:
                if to_update[key] is None:
                    to_update.pop(key, None)
            
            def with_values(key):
                return '\'' if to_update[key] != '' else ''

            def value_or_null(key, fernet_key):
                value_returned = f"PGP_SYM_ENCRYPT({with_values(key)}{to_update[key]}{with_values(key)}, '{fernet_key}'::text)::bytea"

                if key == 'clinical_id' or key == 'student_id':
                    value_returned = f"{with_values(key)}{to_update[key]}{with_values(key)}"    

                if isinstance(to_update[key], list):
                    value_returned = ';'.join(to_update[key])
                    value_returned = f"PGP_SYM_ENCRYPT({with_values(key)}{value_returned}{with_values(key)}, '{fernet_key}'::text)::bytea"
  
                if to_update[key] == '' or to_update[key] is None:
                    value_returned = 'NULL'

                return value_returned

            conn = create_conn()
            cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

            if id is not None and student_id is not None:
                set_values = ', '.join(f'{key} = {value_or_null(key, fernet_key)}' for key in to_update)

                if source_to_table[source] == 'student_info':
                    query = f'UPDATE {source_to_table[source]} SET {set_values} WHERE student_id = {student_id};'
                    cur.execute(query)
                    conn.commit()

                    query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'updated', CURRENT_TIMESTAMP, '{source_to_table[source]}', {student_id}, 1, 1, 0);"
                    
                    cur.execute(query_log)
                    conn.commit()
    
                    cur.close()
                    conn.close()

                    return jsonify({"message": f"The record was created successfully."})

                if source_to_table[source] == 'clinical_placements':
                    query = f'UPDATE {source_to_table[source]} SET {set_values} WHERE clinical_id = {id};'

                if source_to_table[source] == 'program_info':
                    query = f'UPDATE {source_to_table[source]} SET {set_values} WHERE student_id = {id};'

                cur.execute(query)
                conn.commit()
                
                query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'updated', CURRENT_TIMESTAMP, '{source_to_table[source]}', {id}, 1, 1, 0);"
                
                cur.execute(query_log)
                conn.commit()

                cur.close()
                conn.close()
                
                return jsonify({"message": f"The record was updated successfully."})            

            if id is None:
                columns = ', '.join([f'{key}' for key in to_update])
                values = ', '.join([f'{value_or_null(key, fernet_key)}' for key in to_update])

                query = f'INSERT INTO {source_to_table[source]}(student_id, {columns}) VALUES ({student_id},{values});'

                cur.execute(query)
                conn.commit()

                query_log = f"INSERT INTO logs(user_id, action, timestamp, source_table, source_id, total_records, valid_records, invalid_records) VALUES ({user_id}, 'created', CURRENT_TIMESTAMP, '{source_to_table[source]}', {student_id}, 1, 1, 0);"
                    
                cur.execute(query_log)
                conn.commit()
    
                cur.close()
                conn.close()

                return jsonify({"message": f"The record was created successfully."})

    # ========== DISTRICT RECORD ENDPOINT ==========
    @app.route("/district_record", methods=["GET"])
    @login_required(role_required=["administrator", "editor"])
    def district_record():
        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        cur.execute("SELECT DISTINCT district_name from schools_districts;")
        result = cur.fetchall()

        cur.close()
        conn.close()
        res_list = [dict(row) for row in result]
        list_to_strung = ';'.join([r["district_name"] for r in res_list])
        return jsonify(list_to_strung)

    # ========== LOGS ENDPOINT ==========
    @app.route("/log", methods=["POST"])
    @login_required(role_required=["administrator", "editor"])
    def logs():
        key_encrypt = load_key()
        data = request.get_json() or {}
        
        if (data != {} and 'source' in data):
            table = data.get("source")

            conn = create_conn()
            cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

            def encrypt_based_column(key_encrypt, column, table):
                if table == 'student_info':
                    return f"PGP_SYM_DECRYPT(t.{column}, '{key_encrypt}')" 
                    
                return f"PGP_SYM_DECRYPT(s.{column}, '{key_encrypt}')"

            base_id = "student_id"
        
            if table == 'clinical_placements':
                base_id = "clinical_id"

            if table == 'program_info':
                base_id = "student_id"
            
            query_data = f"SELECT l.source_table, l.file_name, l.timestamp as upload_date, l.action as record_status, l.error_message, {'t.student_id' if table == 'student_info' else 's.student_id'} as student_id, {encrypt_based_column(key_encrypt, 'first_name', table)} as first_name, {encrypt_based_column(key_encrypt, 'last_name', table)} as last_name, {encrypt_based_column(key_encrypt, 'birth_date', table)} as birth_date FROM logs l JOIN {table} t ON l.source_id=t.{base_id} {'' if table == 'student_info' else ' JOIN student_info s ON t.student_id=s.student_id'} WHERE l.source_table='{table}'"
            
            cur.execute(query_data)
            result = cur.fetchall()

            cur.close()
            conn.close()
        
            return jsonify(result)

        return jsonify({"error": "Missing params."})

    # ========== SCHOOL RECORD ENDPOINT ==========
    @app.route("/schools_per_district", methods=["POST"])
    @login_required(role_required=["administrator", "editor"])
    def schools_record():

        data = request.get_json() or {}
        
        if (data != {} and 'district_name' in data):
            district = data.get("district_name")
            conn = create_conn()
            cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

            cur.execute("SELECT DISTINCT school_name FROM schools_districts WHERE district_name = %s;", (district,))
            result = cur.fetchall()

            cur.close()
            conn.close()

            res_list = [dict(row) for row in result]
            list_to_string = ';'.join([r["school_name"] for r in res_list])
            return jsonify(list_to_string)

    # ========== STUDENT RECORD ENDPOINT ==========
    @app.route("/student_record_info", methods=["GET", "POST"])
    @login_required(role_required=["administrator", "editor", "viewer"])
    def student_record():
        key_encrypt = load_key()

        conn = create_conn()
        cur = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        if request.method == 'POST':
            data = request.get_json() or {}
        
            if (data != {}):
                student_id = data.get("student_id")

                cur.execute("SELECT * from student_info where student_id=%s;", (student_id,))
                result = cur.fetchone()

                if result is not None:
                    columns = result.keys()
                    decrypted_columns = ', '.join(f"PGP_SYM_DECRYPT({column}, '{key_encrypt}'::text) as {column}" if column != 'student_id' else f"{column}" for column in columns)

                    cur.execute(f"SELECT {decrypted_columns} from student_info where student_id=%s;", (student_id,))

                    result_student = cur.fetchone()

                    page_result = {}
                    page_result['student_info'] = [result_student]

                    cur.execute("SELECT * from program_info where student_id=%s;", (student_id,))
                    program = cur.fetchone()

                    if program is not None:
                        columns_program = program.keys()
                        decrypted_columns_program = ', '.join(f"PGP_SYM_DECRYPT({column}, '{key_encrypt}'::text) as {column}" if column != 'clinical_id' and column != 'program_id' and column != 'student_id' else f"{column}" for column in columns_program)

                        cur.execute(f"SELECT {decrypted_columns_program} from program_info where student_id=%s;", (student_id,))

                        result_program = cur.fetchall()
                    else:
                        result_program = []

                    page_result['program_info'] = result_program

                    cur.execute("SELECT * from clinical_placements where student_id=%s;", (student_id,))
                    clinical = cur.fetchone()

                    if clinical is not None:
                        columns_clinical = clinical.keys()
                        decrypted_columns_clinical = ', '.join(f"PGP_SYM_DECRYPT({column}, '{key_encrypt}'::text) as {column}" if column != 'clinical_id' and column != 'program_id' and column != 'student_id' else f"{column}" for column in columns_clinical)

                        cur.execute(f"SELECT {decrypted_columns_clinical} from clinical_placements where student_id=%s;", (student_id,))

                        result_clinical = cur.fetchall()
                    else:
                        result_clinical = []

                    page_result['clinical_placements'] = result_clinical

                    return jsonify(page_result)
                else:
                    return jsonify({"message": "The student_id doesn't exist"})

        if request.method == 'GET':
            cur.execute("SELECT * from student_info;")
            columns_query = cur.fetchone()
            
            if columns_query is not None:
                columns = columns_query.keys()

                decrypted_columns = ', '.join(f"PGP_SYM_DECRYPT({column}, '{key_encrypt}'::text) as {column}" if column != 'student_id' else f"{column}" for column in columns)

                cur.execute(f"SELECT {decrypted_columns} from student_info;")
                result = cur.fetchall()

                return jsonify(result)            
            else:
                return jsonify([])

        cur.close()
        conn.close()

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000, host="0.0.0.0")