#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
DB_PATH="$SCRIPT_DIR/server/participium.db"

echo "📝 Adding reporter information to existing reports..."

# Array of reporter names
reporters=(
    "Marco Rossi, local business owner"
    "Anna Ferrari, concerned parent"
    "Giuseppe Colombo, daily commuter"
    "Laura Ricci, elderly resident"
    "Paolo Marino, wheelchair user"
    "Elena Greco, jogger and park visitor"
    "Andrea Romano, cyclist"
    "Francesca Conti, shop owner"
    "Roberto Gallo, taxi driver"
    "Silvia Costa, tourist guide"
    "Matteo Fontana, student"
    "Chiara Barbieri, dog owner"
    "Giovanni Mancini, delivery driver"
    "Sara Lombardi, new resident"
    "Luca Martini, architect"
    "Valentina Serra, nurse"
    "Davide Bruno, teacher"
    "Alessia Gatti, photographer"
    "Federico Villa, security guard"
    "Martina Rizzo"
)

# Get all report IDs
report_ids=$(sqlite3 "$DB_PATH" "SELECT id FROM reports;")

counter=0
for id in $report_ids; do
    # Get random reporter from array
    reporter_index=$((RANDOM % ${#reporters[@]}))
    reporter="${reporters[$reporter_index]}"
    
    # Get current description
    current_desc=$(sqlite3 "$DB_PATH" "SELECT json_extract(document, '$.Description') FROM reports WHERE id=$id;")
    
    # Add reporter info if not already present
    if [[ ! "$current_desc" =~ "Reported by:" ]]; then
        new_desc="${current_desc} Reported by: ${reporter}."
        
        # Escape single quotes for SQL
        new_desc="${new_desc//\'/\'\'}"
        
        # Update the description
        sqlite3 "$DB_PATH" "UPDATE reports SET document = json_set(document, '$.Description', '$new_desc') WHERE id=$id;"
        ((counter++))
    fi
done

echo "✅ Updated $counter reports with reporter information!"
echo ""
echo "Sample updated reports:"
sqlite3 "$DB_PATH" "SELECT id, title, json_extract(document, '$.Description') as description FROM reports LIMIT 3;"
