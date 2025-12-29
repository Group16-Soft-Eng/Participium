#!/bin/bash

# Seed Internal Chat Script
# Creates a sample report assigned to a technical officer and a maintainer,
# then populates the `internal_messages` table with a sensible conversation.
#
# Usage:
#   From repository root:
#     ./seedInternalChat.sh
#
# The script will:
# - create a timestamped backup of `server/participium.db`
# - insert one report (if it doesn't already exist with the same title)
# - assign it to a technical officer and a maintainer (by inserting into reports fields)
# - insert a sequence of internal messages between the two participants
#
# NOTE: Adjust the `TECH_ID` and `MAINTAINER_ID` variables below to match user ids
# in your database if needed.

set -euo pipefail
SCRIPT_DIR="$(dirname "$0")"
DB_PATH="$SCRIPT_DIR/server/participium.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH"
  echo "Start the server at least once or ensure the DB exists."
  exit 1
fi

TS=$(date +%s)
BACKUP="$DB_PATH.bak-$TS"
cp "$DB_PATH" "$BACKUP"
echo "Backup created: $BACKUP"

# Prefer existing officers in the 'infrastructure' officeType by role.
# If none are found, create placeholder accounts with known usernames.
OFFICER_USERNAME="officer-infrastucture"
MAINTAINER_USERNAME="mainteiner-infrastructure"

# Helper to get or create an officer and return its id
get_or_create_officer() {
  USERNAME="$1"; shift
  NAME="$1"; shift
  SURNAME="$1"; shift
  EMAIL="$1"; shift
  PASSWORD_HASH="$1"; shift

  EXISTING=$(sqlite3 "$DB_PATH" "SELECT id FROM officers WHERE username = '$USERNAME' LIMIT 1;")
  if [ -n "$EXISTING" ]; then
    echo "$EXISTING"
    return
  fi
  # Insert and return last_insert_rowid() in the same sqlite3 connection
  INSERT_RESULT=$(sqlite3 "$DB_PATH" "INSERT INTO officers (username,name,surname,email,password) VALUES (
    '$USERNAME', '$NAME', '$SURNAME', '$EMAIL', '$PASSWORD_HASH'
  ); SELECT last_insert_rowid();")
  echo "$INSERT_RESULT"
}

# Use a simple bcrypt-like placeholder hash so DB schema is satisfied.
# In a real environment you may want to create a real bcrypt hash.
PLACEHOLDER_HASH='\$2b\$10\$infrastructureplaceholderhashxxxxxx'

# Try to find existing officers by role and officeType
TECH_ID=$(sqlite3 "$DB_PATH" "SELECT officerID FROM role WHERE officerRole='technical_office_staff' AND officeType='infrastructure' LIMIT 1;")
MAINTAINER_ID=$(sqlite3 "$DB_PATH" "SELECT officerID FROM role WHERE officerRole='external_maintainer' AND officeType='infrastructure' LIMIT 1;")

if [ -n "$TECH_ID" ]; then
  echo "Found technical officer by role: TECH_ID=$TECH_ID"
else
  TECH_ID=$(get_or_create_officer "$OFFICER_USERNAME" "Infra" "Officer" "${OFFICER_USERNAME}@example.local" "$PLACEHOLDER_HASH")
  echo "Created technical officer: TECH_ID=$TECH_ID"
fi

if [ -n "$MAINTAINER_ID" ]; then
  echo "Found maintainer by role: MAINTAINER_ID=$MAINTAINER_ID"
else
  MAINTAINER_ID=$(get_or_create_officer "$MAINTAINER_USERNAME" "Mainteiner" "Infra" "${MAINTAINER_USERNAME}@example.local" "$PLACEHOLDER_HASH")
  echo "Created maintainer: MAINTAINER_ID=$MAINTAINER_ID"
fi

echo "Using officers: TECH_ID=$TECH_ID MAINTAINER_ID=$MAINTAINER_ID"

# Ensure role entries exist linking them to 'infrastructure' officeType
ensure_role() {
  local OFF_ID="$1"; local ROLE="$2"; local OFFICE="$3"
  local EXISTS=$(sqlite3 "$DB_PATH" "SELECT id FROM role WHERE officerID = $OFF_ID AND officerRole = '$ROLE' AND officeType = '$OFFICE' LIMIT 1;")
  if [ -z "$EXISTS" ]; then
    sqlite3 "$DB_PATH" "INSERT INTO role (officerID, officerRole, officeType) VALUES ($OFF_ID, '$ROLE', '$OFFICE');"
    echo "Inserted role $ROLE/$OFFICE for officer $OFF_ID"
  else
    echo "Role $ROLE/$OFFICE already exists for officer $OFF_ID"
  fi
}

ensure_role $TECH_ID 'technical_office_staff' 'infrastructure'
ensure_role $MAINTAINER_ID 'external_maintainer' 'infrastructure'

# Cleanup any previous failed role entries with officerID = 0 for infrastructure
sqlite3 "$DB_PATH" "DELETE FROM role WHERE officerID = 0 AND officeType = 'infrastructure';"
# Remove previous failed seeded reports that might have officer ids = 0 (avoid duplicates)
sqlite3 "$DB_PATH" "DELETE FROM reports WHERE title LIKE 'Seeded chat report %' AND (assignedOfficerId = 0 OR assignedMaintainerId = 0);"

# Report payload - change title/description as needed
REPORT_TITLE="Seeded chat report $TS"
REPORT_DESCRIPTION="Automatically created report for chat seeding. Location: Piazza Castello."
REPORT_CATEGORY="infrastructure"
LAT=45.0703
LNG=7.6600
ANON=0

# 1) Create report and get its id. We try to avoid creating duplicates by title.
EXISTING_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM reports WHERE title = '$REPORT_TITLE' LIMIT 1;")
if [ -n "$EXISTING_ID" ]; then
  REPORT_ID=$EXISTING_ID
  echo "Found existing report with id=$REPORT_ID"
else
  # Build JSON strings and escape single quotes so sqlite receives valid SQL literals
  ESC_TITLE=$(echo "$REPORT_TITLE" | sed "s/'/''/g")
  ESC_DESC=$(echo "$REPORT_DESCRIPTION" | sed "s/'/''/g")
  ESC_CATEGORY=$(echo "$REPORT_CATEGORY" | sed "s/'/''/g")
  DOC=$(printf '{"description":"%s"}' "$ESC_DESC" | sed "s/'/''/g")
  LOC=$(printf '{"Coordinates":{"latitude":%s,"longitude":%s}}' "$LAT" "$LNG" | sed "s/'/''/g")

  # Insert a new report assigned to the found technical officer and maintainer
  INSERT_RES=$(sqlite3 "$DB_PATH" "INSERT INTO reports (title, location, anonymity, date, category, document, state, assignedOfficerId, assignedMaintainerId, author_id) VALUES (
    '$ESC_TITLE',
    '$LOC',
    $ANON,
    datetime('now'),
    '$ESC_CATEGORY',
    '$DOC',
    'IN_PROGRESS',
    $TECH_ID,
    $MAINTAINER_ID,
    NULL
  ); SELECT last_insert_rowid();")
  REPORT_ID=$INSERT_RES
  echo "Inserted report id=$REPORT_ID"
fi

# 2) Assign the report to tech and maintainer
# This assumes `reports` table has `technical_officer_id` and `maintainer_id` columns or similar.
# If your schema uses different column names, adjust them here.

# Try to detect common column names
CAND1=$(sqlite3 "$DB_PATH" "PRAGMA table_info(reports);" | grep -E "technic|technical|maintain" || true)

# We'll attempt to update common columns if present
# Update technical officer
if sqlite3 "$DB_PATH" "PRAGMA table_info(reports);" | grep -q "technical_officer_id"; then
  sqlite3 "$DB_PATH" "UPDATE reports SET technical_officer_id = $TECH_ID WHERE id = $REPORT_ID;"
  echo "Set technical_officer_id = $TECH_ID"
elif sqlite3 "$DB_PATH" "PRAGMA table_info(reports);" | grep -q "assigned_to"; then
  sqlite3 "$DB_PATH" "UPDATE reports SET assigned_to = $TECH_ID WHERE id = $REPORT_ID;"
  echo "Set assigned_to = $TECH_ID"
else
  echo "No known technical officer column found — skipping technical assignment (please update script if needed)."
fi

# Update maintainer
if sqlite3 "$DB_PATH" "PRAGMA table_info(reports);" | grep -q "maintainer_id"; then
  sqlite3 "$DB_PATH" "UPDATE reports SET maintainer_id = $MAINTAINER_ID WHERE id = $REPORT_ID;"
  echo "Set maintainer_id = $MAINTAINER_ID"
else
  echo "No known maintainer column found — skipping maintainer assignment (please update script if needed)."
fi

# 3) Populate internal_messages conversation
# We'll insert a sensible conversation between TECH_ID and MAINTAINER_ID

MESSAGES=(
  "Hi, I inspected the site and it looks like the pavement has settled near the manhole cover."
  "Thanks — can you send photos and exact coordinates so I can add them to the intervention plan?"
  "Here are the coordinates and I attached the photos to the main report. I think this needs urgent action for pedestrian safety."
  "Understood. I'll schedule the intervention and inform the maintenance team."
  "Great, please let me know the planned date."
  "I spoke with maintenance: intervention is scheduled in 2-3 days, I'll update the report status.")

# Insert messages as alternating sender/receiver starting with technical -> maintainer
i=0
for txt in "${MESSAGES[@]}"; do
  if (( i % 2 == 0 )); then
    SENDER_TYPE='technical_office_staff'
    SENDER_ID=$TECH_ID
    RECEIVER_TYPE='MAINTAINER'
    RECEIVER_ID=$MAINTAINER_ID
  else
    SENDER_TYPE='MAINTAINER'
    SENDER_ID=$MAINTAINER_ID
    RECEIVER_TYPE='technical_office_staff'
    RECEIVER_ID=$TECH_ID
  fi

  # Escape single quotes in message text for sqlite
  ESCAPED=$(echo "$txt" | sed "s/'/''/g")

  sqlite3 "$DB_PATH" "INSERT INTO internal_messages (report_id, message, senderType, senderId, receiverType, receiverId, createdAt, read) VALUES (
    $REPORT_ID,
    '$ESCAPED',
    '$SENDER_TYPE',
    $SENDER_ID,
    '$RECEIVER_TYPE',
    $RECEIVER_ID,
    datetime('now','+' || $i || ' seconds'),
    0
  );"
  echo "Inserted message $((i+1))"
  i=$((i+1))
done

echo "Done. Inserted $i messages for report id=$REPORT_ID"

# 4) Show preview
sqlite3 "$DB_PATH" "SELECT id, report_id, substr(message,1,120) AS preview, senderType, senderId, receiverType, receiverId, createdAt, read FROM internal_messages WHERE report_id = $REPORT_ID ORDER BY createdAt ASC;"

echo "Script finished. If you need different user ids or message content, edit the top of this script." 
