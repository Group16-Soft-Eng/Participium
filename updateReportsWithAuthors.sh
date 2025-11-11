#!/bin/bash

DB_PATH="server/participium.db"

echo "Updating reports with proper authors and anonymity flags..."

# Array of user IDs to randomly assign (we have users 1, 2, 3)
USER_IDS=(1 2 3 1 2 3 1 2 3)

# Get all report IDs
REPORT_IDS=$(sqlite3 "$DB_PATH" "SELECT id FROM reports;")

counter=0
for report_id in $REPORT_IDS; do
    # Get current description
    current_desc=$(sqlite3 "$DB_PATH" "SELECT json_extract(document, '$.Description') FROM reports WHERE id=$report_id;")
    
    # Remove "Reported by: ..." part from description
    clean_desc=$(echo "$current_desc" | sed 's/\. Reported by:.*$/\./')
    
    # Escape single quotes for SQL
    clean_desc=$(echo "$clean_desc" | sed "s/'/''/g")
    
    # Assign a user ID (cycle through available users)
    user_index=$((counter % 3))
    author_id=${USER_IDS[$user_index]}
    
    # Determine anonymity (30% chance of being anonymous)
    anonymity=0
    random=$((RANDOM % 10))
    if [ $random -lt 3 ]; then
        anonymity=1
    fi
    
    # Update the report
    sqlite3 "$DB_PATH" "UPDATE reports SET 
        document = json_set(document, '$.Description', '$clean_desc'),
        author_id = $author_id,
        anonymity = $anonymity
        WHERE id = $report_id;"
    
    if [ $anonymity -eq 1 ]; then
        echo "Updated report $report_id: author_id=$author_id (ANONYMOUS)"
    else
        echo "Updated report $report_id: author_id=$author_id"
    fi
    
    counter=$((counter + 1))
done

echo ""
echo "✅ All reports updated successfully!"
echo ""
echo "Summary:"
sqlite3 "$DB_PATH" "SELECT 
    COUNT(*) as total_reports,
    SUM(CASE WHEN anonymity = 1 THEN 1 ELSE 0 END) as anonymous_reports,
    SUM(CASE WHEN anonymity = 0 THEN 1 ELSE 0 END) as named_reports
FROM reports;"
