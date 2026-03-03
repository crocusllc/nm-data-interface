#!/usr/bin/env bash
# =============================================================================
# QA Security Hardening Validation Test Suite
# Tests the security fixes on the fix/security-review branch
# Usage: ./scripts/qa_security_tests.sh <admin_password> [--base-url URL]
# =============================================================================
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Globals ──────────────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
FAILURES=()
API_URL="http://localhost:3030"
CADDY_URL="https://ptt4.touchdownllc.com/db"
ADMIN_PASS=""
ADMIN_TOKEN=""
QA_ADMIN_TOKEN=""
QA_EDITOR_TOKEN=""
QA_VIEWER_TOKEN=""
ORIGIN="https://ptt4.touchdownllc.com"
CURL_API="curl -s --max-time 10"
CURL_CADDY="curl -sk --http1.1 --max-time 10"

# ── Argument parsing ────────────────────────────────────────────────────────
usage() {
    echo "Usage: $0 <admin_password> [--api-url URL] [--caddy-url URL]"
    echo "  admin_password    Password for the 'admin' seed account"
    echo "  --api-url URL     Direct API URL (default: $API_URL)"
    echo "  --caddy-url URL   Caddy reverse-proxy URL (default: $CADDY_URL)"
    exit 1
}

[[ $# -lt 1 ]] && usage
# Remove any backslash-escaping the shell may add (e.g. \! → !)
ADMIN_PASS="${1//\\/}"
shift
while [[ $# -gt 0 ]]; do
    case "$1" in
        --api-url) API_URL="$2"; shift 2 ;;
        --caddy-url) CADDY_URL="$2"; shift 2 ;;
        *) echo "Unknown arg: $1"; usage ;;
    esac
done

# Strip trailing slashes
API_URL="${API_URL%/}"
CADDY_URL="${CADDY_URL%/}"

# ── Helpers ──────────────────────────────────────────────────────────────────
pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    echo -e "  ${GREEN}PASS${NC} $1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("$1")
    echo -e "  ${RED}FAIL${NC} $1"
    [[ -n "${2:-}" ]] && echo -e "       ${RED}→ $2${NC}"
}

skip() {
    SKIP_COUNT=$((SKIP_COUNT + 1))
    echo -e "  ${YELLOW}SKIP${NC} $1"
}

section() {
    echo ""
    echo -e "${CYAN}${BOLD}══ $1 ══${NC}"
}

# Perform a curl request against the API, capture HTTP code + body.
# Sets globals: HTTP_CODE, HTTP_BODY
do_request() {
    local method="$1" url="$2"
    shift 2
    local tmp
    tmp=$(mktemp)
    HTTP_CODE=$($CURL_API -o "$tmp" -w '%{http_code}' -X "$method" "$url" "$@") || true
    HTTP_BODY=$(cat "$tmp")
    rm -f "$tmp"
}

# Perform a curl request through Caddy (for header/CORS tests).
# Sets globals: HTTP_CODE, HTTP_BODY
do_request_caddy() {
    local method="$1" url="$2"
    shift 2
    local tmp
    tmp=$(mktemp)
    HTTP_CODE=$($CURL_CADDY -o "$tmp" -w '%{http_code}' -X "$method" "$url" "$@") || true
    HTTP_BODY=$(cat "$tmp")
    rm -f "$tmp"
}

# Test that an endpoint returns the expected HTTP status code.
# Args: description method url expected_code [extra curl args...]
test_http_code() {
    local desc="$1" method="$2" url="$3" expected="$4"
    shift 4
    do_request "$method" "$url" "$@"
    if [[ "$HTTP_CODE" == "$expected" ]]; then
        pass "$desc (HTTP $HTTP_CODE)"
    else
        fail "$desc" "expected HTTP $expected, got $HTTP_CODE — body: ${HTTP_BODY:0:200}"
    fi
}

# Test RBAC: endpoint should return 403 for the given token.
test_rbac_deny() {
    local desc="$1" method="$2" url="$3" token="$4" data="${5:-}"
    local args=(-H "Authorization: Bearer $token" -H "Content-Type: application/json")
    [[ -n "$data" ]] && args+=(--data-raw "$data")
    do_request "$method" "$url" "${args[@]}"
    if [[ "$HTTP_CODE" == "403" ]]; then
        pass "$desc → 403"
    else
        fail "$desc → expected 403" "got HTTP $HTTP_CODE — body: ${HTTP_BODY:0:200}"
    fi
}

# Check that body does NOT contain any of the given patterns (case-insensitive).
assert_no_leak() {
    local desc="$1"
    shift
    local leaked=0
    for pattern in "$@"; do
        if echo "$HTTP_BODY" | grep -qi "$pattern"; then
            leaked=1
            fail "$desc — response leaks '$pattern'"
        fi
    done
    [[ $leaked -eq 0 ]] && pass "$desc"
}

# Build JSON safely using printf + jq (handles special chars in values)
json_obj() {
    # Usage: json_obj key1 val1 key2 val2 ...
    local args=()
    while [[ $# -ge 2 ]]; do
        args+=(--arg "$1" "$2")
        shift 2
    done
    jq -nc "${args[@]}" '$ARGS.named'
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 0: Bootstrap
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 0: Bootstrap"

# Login as admin
do_request POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    --data-raw "{\"username\":\"admin\",\"password\":\"$ADMIN_PASS\"}"

if [[ "$HTTP_CODE" == "200" ]]; then
    ADMIN_TOKEN=$(echo "$HTTP_BODY" | jq -r '.token // empty')
    if [[ -n "$ADMIN_TOKEN" ]]; then
        pass "Admin login → 200 with token"
    else
        fail "Admin login → 200 but no token in response"
        echo "FATAL: Cannot proceed without admin token." >&2; exit 2
    fi
else
    fail "Admin login" "HTTP $HTTP_CODE — $HTTP_BODY"
    echo "FATAL: Cannot proceed without admin token." >&2; exit 2
fi

# Helper to create a QA user
create_qa_user() {
    local uname="$1" email="$2" role="$3"
    do_request POST "$API_URL/create_user" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        --data-raw "{\"username\":\"$uname\",\"password\":\"Qa_Test_P@ss1\",\"user_email\":\"$email\",\"user_role\":\"$role\"}"
    if [[ "$HTTP_CODE" == "200" ]]; then
        pass "Create $uname ($role)"
    else
        fail "Create $uname ($role)" "HTTP $HTTP_CODE — ${HTTP_BODY:0:200}"
    fi
}

create_qa_user "qa_admin"  "qa_admin@test.local"  "administrator"
create_qa_user "qa_editor" "qa_editor@test.local" "editor"
create_qa_user "qa_viewer" "qa_viewer@test.local" "viewer"

# Login as each QA user and capture tokens
login_qa_user() {
    local uname="$1"
    do_request POST "$API_URL/login" \
        -H "Content-Type: application/json" \
        --data-raw "{\"username\":\"$uname\",\"password\":\"Qa_Test_P@ss1\"}"
    if [[ "$HTTP_CODE" == "200" ]]; then
        local tok
        tok=$(echo "$HTTP_BODY" | jq -r '.token // empty')
        if [[ -n "$tok" ]]; then
            echo "$tok"
            return 0
        fi
    fi
    echo ""
    return 1
}

QA_ADMIN_TOKEN=$(login_qa_user "qa_admin") && pass "Login qa_admin → token" || fail "Login qa_admin"
QA_EDITOR_TOKEN=$(login_qa_user "qa_editor") && pass "Login qa_editor → token" || fail "Login qa_editor"
QA_VIEWER_TOKEN=$(login_qa_user "qa_viewer") && pass "Login qa_viewer → token" || fail "Login qa_viewer"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: Security Headers & Infrastructure
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 1: Security Headers & Infrastructure"

HEADERS=$($CURL_CADDY -sI "$CADDY_URL/")

check_header() {
    local name="$1" expected="$2"
    if echo "$HEADERS" | grep -qi "^${name}:.*${expected}"; then
        pass "Header: $name contains '$expected'"
    else
        fail "Header: $name missing or wrong" "expected to contain '$expected'"
    fi
}

check_header "X-Content-Type-Options" "nosniff"
check_header "X-Frame-Options" "DENY"
check_header "Strict-Transport-Security" "max-age=31536000"
check_header "Content-Security-Policy" "default-src 'self'"
check_header "Referrer-Policy" "strict-origin-when-cross-origin"
check_header "Permissions-Policy" "camera=()"

# No Server header
if echo "$HEADERS" | grep -qi "^Server:"; then
    fail "Server header should be stripped"
else
    pass "No Server header (stripped by Caddy)"
fi

# Non-root process check (gunicorn runs as appuser) and debug mode off
# Note: ps is not available in slim containers, so we use /proc directly
PROC_CHECK=$(docker compose exec -T api sh -c '
for p in /proc/[0-9]*/cmdline; do
    if grep -q gunicorn "$p" 2>/dev/null; then
        pid=$(echo "$p" | cut -d/ -f3)
        user=$(stat -c "%U" "/proc/$pid" 2>/dev/null)
        cmd=$(cat "$p" | tr "\0" " ")
        echo "${user} ${cmd}"
    fi
done' 2>/dev/null || true)

if [[ -z "$PROC_CHECK" ]]; then
    skip "Cannot check gunicorn (docker not available)"
    skip "Cannot check gunicorn (docker not available)"
elif echo "$PROC_CHECK" | grep -q "appuser"; then
    pass "Gunicorn runs as appuser (non-root)"
    pass "Using gunicorn (not Flask dev server)"
else
    fail "Gunicorn not running as appuser" "$(echo "$PROC_CHECK" | head -1)"
    pass "Using gunicorn (not Flask dev server)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2: Authentication
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 2: Authentication"

# No auth header → 401
test_http_code "No auth header → 401" \
    GET "$API_URL/student_record_info" 401

# Malformed Bearer token → 401
test_http_code "Malformed Bearer token → 401" \
    GET "$API_URL/student_record_info" 401 \
    -H "Authorization: Bearer not.a.valid.token"

# Invalid JWT → 401
test_http_code "Invalid JWT → 401" \
    GET "$API_URL/student_record_info" 401 \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlIn0.invalidsig"

# create_user without auth → 401 (critical fix validation)
test_http_code "POST /create_user without auth → 401" \
    POST "$API_URL/create_user" 401 \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"hacker","password":"hacked123","user_email":"h@h.com","user_role":"administrator"}'

# Valid login → 200
test_http_code "Valid login → 200" \
    POST "$API_URL/login" 200 \
    -H "Content-Type: application/json" \
    --data-raw "{\"username\":\"admin\",\"password\":\"$ADMIN_PASS\"}"

# Missing username → 400
test_http_code "Login missing username → 400" \
    POST "$API_URL/login" 400 \
    -H "Content-Type: application/json" \
    --data-raw '{"password":"something"}'

# Wrong password → 401
test_http_code "Wrong password → 401" \
    POST "$API_URL/login" 401 \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"admin","password":"definitelywrong"}'

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: RBAC Matrix
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 4: RBAC Matrix"

# -- Viewer cannot access admin/editor endpoints --
test_rbac_deny "Viewer → create_user"         POST "$API_URL/create_user"         "$QA_VIEWER_TOKEN" '{"username":"x","password":"x","user_email":"x@x","user_role":"viewer"}'
test_rbac_deny "Viewer → delete_user"          POST "$API_URL/delete_user"          "$QA_VIEWER_TOKEN" '{"username":"x"}'
test_rbac_deny "Viewer → file_upload"          POST "$API_URL/file_upload"          "$QA_VIEWER_TOKEN"
test_rbac_deny "Viewer → file_download"        POST "$API_URL/file_download"        "$QA_VIEWER_TOKEN" '{"file_name":"x","fields":{}}'
test_rbac_deny "Viewer → download_opts"        GET  "$API_URL/download_opts"        "$QA_VIEWER_TOKEN"
test_rbac_deny "Viewer → update_data"          POST "$API_URL/update_data"          "$QA_VIEWER_TOKEN" '{"student_id":1,"source":"student"}'
test_rbac_deny "Viewer → delete_data"          POST "$API_URL/delete_data"          "$QA_VIEWER_TOKEN" '{"table_name":"student_info","id":1}'
test_rbac_deny "Viewer → delete_student"       POST "$API_URL/delete_student"       "$QA_VIEWER_TOKEN" '{"student_id":[99999]}'
test_rbac_deny "Viewer → district_record"      GET  "$API_URL/district_record"      "$QA_VIEWER_TOKEN"
test_rbac_deny "Viewer → log"                  POST "$API_URL/log"                  "$QA_VIEWER_TOKEN" '{"source":"student_info"}'
test_rbac_deny "Viewer → reset_user_password"  POST "$API_URL/reset_user_password"  "$QA_VIEWER_TOKEN" '{"username":"admin","new_password":"Newpass123"}'

# -- Editor cannot access admin-only endpoints --
test_rbac_deny "Editor → create_user"   POST "$API_URL/create_user"   "$QA_EDITOR_TOKEN" '{"username":"x","password":"x","user_email":"x@x","user_role":"viewer"}'
test_rbac_deny "Editor → delete_user"   POST "$API_URL/delete_user"   "$QA_EDITOR_TOKEN" '{"username":"x"}'
test_rbac_deny "Editor → file_upload"   POST "$API_URL/file_upload"   "$QA_EDITOR_TOKEN"
test_rbac_deny "Editor → file_download" POST "$API_URL/file_download" "$QA_EDITOR_TOKEN" '{"file_name":"x","fields":{}}'

# -- Viewer CAN access student_record_info --
do_request GET "$API_URL/student_record_info" \
    -H "Authorization: Bearer $QA_VIEWER_TOKEN"
if [[ "$HTTP_CODE" == "200" ]]; then
    pass "Viewer → student_record_info → 200 (allowed)"
else
    fail "Viewer → student_record_info" "expected 200, got $HTTP_CODE"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: SQL Injection Prevention
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 5: SQL Injection Prevention"

# Injection in login username
do_request POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"'\'' OR 1=1--","password":"x"}'
if [[ "$HTTP_CODE" == "401" ]]; then
    pass "SQLi in login username → 401"
else
    fail "SQLi in login username" "expected 401, got $HTTP_CODE"
fi
assert_no_leak "SQLi login username — no DB leak" "psycopg2" "Traceback" "syntax error" "SELECT" "FROM users"

# Injection in login password
do_request POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"admin","password":"'\'' OR 1=1--"}'
if [[ "$HTTP_CODE" == "401" ]]; then
    pass "SQLi in login password → 401"
else
    fail "SQLi in login password" "expected 401, got $HTTP_CODE"
fi

# Injection in delete_user
do_request POST "$API_URL/delete_user" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw "{\"username\":\"'; DROP TABLE users;--\"}"
if [[ "$HTTP_CODE" != "500" ]]; then
    pass "SQLi in delete_user → safe (HTTP $HTTP_CODE)"
else
    fail "SQLi in delete_user → got 500 (possible injection)"
fi
assert_no_leak "SQLi delete_user — no DB leak" "psycopg2" "Traceback" "syntax error"

# Injection in delete_data table_name → rejected by validate_table()
do_request POST "$API_URL/delete_data" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"table_name":"users; DROP TABLE users;--","id":1}'
if [[ "$HTTP_CODE" == "400" ]]; then
    pass "SQLi in delete_data table_name → 400 (validate_table)"
else
    fail "SQLi in delete_data table_name" "expected 400, got $HTTP_CODE"
fi

# Injection in delete_data id → int() cast fails
do_request POST "$API_URL/delete_data" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"table_name":"student_info","id":"1; DROP TABLE users"}'
if [[ "$HTTP_CODE" != "500" ]] || ! echo "$HTTP_BODY" | grep -qi "psycopg2"; then
    pass "SQLi in delete_data id → safe (HTTP $HTTP_CODE)"
else
    fail "SQLi in delete_data id" "got 500 with DB details"
fi

# Injection in student_record_info student_id → parameterized
do_request POST "$API_URL/student_record_info" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"student_id":"1 OR 1=1"}'
if [[ "$HTTP_CODE" != "500" ]]; then
    pass "SQLi in student_record_info student_id → safe (HTTP $HTTP_CODE)"
else
    fail "SQLi in student_record_info student_id" "got 500"
fi
assert_no_leak "SQLi student_record_info — no DB leak" "psycopg2" "Traceback" "syntax error"

# Injection in schools_per_district district_name → parameterized
do_request POST "$API_URL/schools_per_district" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw "{\"district_name\":\"' OR 1=1--\"}"
if [[ "$HTTP_CODE" != "500" ]]; then
    pass "SQLi in schools_per_district → safe (HTTP $HTTP_CODE)"
else
    fail "SQLi in schools_per_district" "got 500"
fi

# Injection in update_data source → rejected as invalid
do_request POST "$API_URL/update_data" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"student_id":1,"source":"student_info; DROP TABLE users;--"}'
if [[ "$HTTP_CODE" == "400" ]]; then
    pass "SQLi in update_data source → 400 (invalid source)"
else
    fail "SQLi in update_data source" "expected 400, got $HTTP_CODE"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 6: Input Validation
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 6: Input Validation"

# Invalid table_name ("users") in file_upload → rejected
do_request POST "$API_URL/file_upload" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -F "file=@/dev/null;filename=test.csv;type=text/csv" \
    -F 'data={"file_name":"test.csv","table_name":"users","fields":["student_id"]}'
if [[ "$HTTP_CODE" == "400" ]]; then
    pass "file_upload invalid table_name 'users' → 400"
else
    fail "file_upload invalid table_name" "expected 400, got $HTTP_CODE — ${HTTP_BODY:0:200}"
fi

# Non-CSV file upload → 400
TXT_TMP=$(mktemp /tmp/qa_test_XXXXXX.txt)
echo "not a csv" > "$TXT_TMP"
do_request POST "$API_URL/file_upload" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -F "file=@$TXT_TMP;type=text/plain" \
    -F 'data={"file_name":"test.txt","table_name":"student_info","fields":["student_id"]}'
rm -f "$TXT_TMP"
if [[ "$HTTP_CODE" == "400" ]]; then
    pass "file_upload non-CSV → 400"
else
    fail "file_upload non-CSV" "expected 400, got $HTTP_CODE — ${HTTP_BODY:0:200}"
fi

# Invalid source in update_data → 400
test_http_code "update_data invalid source → 400" \
    POST "$API_URL/update_data" 400 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"student_id":1,"source":"nonexistent_table"}'

# Missing required fields in create_user → 400
test_http_code "create_user missing fields → 400" \
    POST "$API_URL/create_user" 400 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"incomplete"}'

# Short password in reset_user_password → 400
test_http_code "reset_user_password short password → 400" \
    POST "$API_URL/reset_user_password" 400 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"qa_editor","new_password":"short"}'

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7: CORS
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 7: CORS"

# Correct origin → ACAO header present (must go through Caddy)
CORS_HEADERS=$($CURL_CADDY -sI "$CADDY_URL/" -H "Origin: $ORIGIN")
if echo "$CORS_HEADERS" | grep -qi "Access-Control-Allow-Origin.*$ORIGIN"; then
    pass "Correct Origin → ACAO header present"
else
    fail "Correct Origin → ACAO header missing"
fi

# Wrong origin → no ACAO header
CORS_BAD=$($CURL_CADDY -sI "$CADDY_URL/" -H "Origin: https://evil.com")
if echo "$CORS_BAD" | grep -qi "Access-Control-Allow-Origin"; then
    fail "Wrong Origin → ACAO header should be absent"
else
    pass "Wrong Origin → no ACAO header"
fi

# OPTIONS preflight with correct origin → 204 with CORS headers
PREFLIGHT_FULL=$($CURL_CADDY -sI -X OPTIONS "$CADDY_URL/" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Authorization, Content-Type")
if echo "$PREFLIGHT_FULL" | grep -qi "204" && echo "$PREFLIGHT_FULL" | grep -qi "Access-Control-Allow-Methods"; then
    pass "OPTIONS preflight → 204 with CORS headers"
else
    PREFLIGHT_STATUS=$(echo "$PREFLIGHT_FULL" | head -1)
    fail "OPTIONS preflight" "status: $PREFLIGHT_STATUS"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 8: Error Sanitization
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 8: Error Sanitization"

# Malformed JSON body
do_request POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    --data-raw '{"this is not valid json'
assert_no_leak "Malformed JSON → no stack trace" "Traceback" "psycopg2" "File \"/app" "syntax error"

# Invalid data types in various endpoints
do_request POST "$API_URL/student_record_info" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"student_id":"not_a_number_at_all"}'
assert_no_leak "Invalid student_id type → no DB internals" "psycopg2" "Traceback" "syntax error" "SELECT" "FROM student"

# Trigger error via bad delete_data params
do_request POST "$API_URL/delete_data" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"table_name":"student_info","id":"not_an_int"}'
assert_no_leak "Bad delete_data id → no DB internals" "psycopg2" "Traceback" "syntax error"

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 9: Functional CRUD (positive tests)
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 9: Functional CRUD"

# Health check
test_http_code "GET / → 200 health check" \
    GET "$API_URL/" 200

# student_record_info
test_http_code "GET /student_record_info → 200" \
    GET "$API_URL/student_record_info" 200 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN"

# district_record
test_http_code "GET /district_record → 200" \
    GET "$API_URL/district_record" 200 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN"

# download_opts
do_request GET "$API_URL/download_opts" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" ]]; then
    # Check that expected keys exist
    HAS_KEYS=$(echo "$HTTP_BODY" | jq 'has("placement_type") and has("program_name")' 2>/dev/null || echo "false")
    if [[ "$HAS_KEYS" == "true" ]]; then
        pass "GET /download_opts → 200 with expected keys"
    else
        fail "GET /download_opts → 200 but missing expected keys"
    fi
else
    fail "GET /download_opts" "expected 200, got $HTTP_CODE"
fi

# change_password (qa_editor changes own password, then changes back)
test_http_code "POST /change_password → 200" \
    POST "$API_URL/change_password" 200 \
    -H "Authorization: Bearer $QA_EDITOR_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"password":"Qa_Test_P@ss1"}'

# reset_user_password (admin resets qa_editor password)
test_http_code "POST /reset_user_password → 200" \
    POST "$API_URL/reset_user_password" 200 \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"username":"qa_editor","new_password":"Qa_Test_P@ss1"}'

# log endpoint
do_request POST "$API_URL/log" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"source":"student_info"}'
if [[ "$HTTP_CODE" == "200" ]]; then
    pass "POST /log with valid source → 200"
else
    fail "POST /log" "expected 200, got $HTTP_CODE — ${HTTP_BODY:0:200}"
fi

# schools_per_district (may return empty if no data, but should not error)
do_request POST "$API_URL/schools_per_district" \
    -H "Authorization: Bearer $QA_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --data-raw '{"district_name":"TestDistrict"}'
if [[ "$HTTP_CODE" == "200" ]]; then
    pass "POST /schools_per_district → 200"
else
    fail "POST /schools_per_district" "expected 200, got $HTTP_CODE"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 10: Cleanup
# ═══════════════════════════════════════════════════════════════════════════════
section "Phase 10: Cleanup"

delete_qa_user() {
    local uname="$1"
    do_request POST "$API_URL/delete_user" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        --data-raw "{\"username\":\"$uname\"}"
    if [[ "$HTTP_CODE" == "200" ]]; then
        pass "Delete $uname"
    else
        fail "Delete $uname" "HTTP $HTTP_CODE — ${HTTP_BODY:0:200}"
    fi
}

delete_qa_user "qa_admin"
delete_qa_user "qa_editor"
delete_qa_user "qa_viewer"

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
echo -e "${BOLD} Results: ${GREEN}$PASS_COUNT passed${NC}, ${RED}$FAIL_COUNT failed${NC}, ${YELLOW}$SKIP_COUNT skipped${NC} / $TOTAL total"
echo -e "${BOLD}═══════════════════════════════════════════════════════${NC}"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}${BOLD}Failed tests:${NC}"
    for f in "${FAILURES[@]}"; do
        echo -e "  ${RED}✗${NC} $f"
    done
fi

echo ""
if [[ $FAIL_COUNT -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}${BOLD}$FAIL_COUNT test(s) failed.${NC}"
    exit 1
fi
