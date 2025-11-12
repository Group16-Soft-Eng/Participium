#!/bin/bash

# Navigate to the correct directory
SCRIPT_DIR="$(dirname "$0")"
DB_PATH="$SCRIPT_DIR/server/participium.db"

echo "🌱 Adding more APPROVED reports to database..."

# Get the first user ID to use as author
USER_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM users LIMIT 1;")

if [ -z "$USER_ID" ]; then
    echo "❌ No users found in database."
    exit 1
fi

echo "Using user ID: $USER_ID"

# Function to insert report (all APPROVED)
insert_report() {
    local title="$1"
    local description="$2"
    local category="$3"
    local latitude="$4"
    local longitude="$5"
    local anonymity="$6"
    
    # Random date within last 60 days
    local days_ago=$((RANDOM % 60))
    local date=$(date -d "$days_ago days ago" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v-${days_ago}d '+%Y-%m-%d %H:%M:%S')
    
    # Set authorId based on anonymity
    local author_id="NULL"
    if [ "$anonymity" = "0" ]; then
        author_id="$USER_ID"
    fi
    
    sqlite3 "$DB_PATH" <<EOF
INSERT INTO reports (title, location, author_id, anonymity, date, category, document, state, reason, assignedOfficerId)
VALUES (
    '$title',
    '{"name":"Turin, Italy","Coordinates":{"latitude":$latitude,"longitude":$longitude}}',
    $author_id,
    $anonymity,
    '$date',
    '$category',
    '{"Description":"$description","Photos":[]}',
    'APPROVED',
    NULL,
    NULL
);
EOF
}

# INFRASTRUCTURE (15 more)
insert_report "Sinking pavement on Corso Massimo" "Section of sidewalk gradually sinking, creating dangerous step. Water pooling after rain." "infrastructure" "45.0723" "7.6801" "0"
insert_report "Broken curb on Via Barbaroux" "Curb edge crumbled away making it difficult for wheelchairs and strollers to access sidewalk." "infrastructure" "45.0698" "7.6745" "0"
insert_report "Faded road markings on Via Sacchi" "Lane dividers barely visible creating confusion for drivers, especially at night." "infrastructure" "45.0712" "7.6889" "0"
insert_report "Rusty bridge joints visible" "Pedestrian bridge showing signs of corrosion on metal joints. Needs inspection for safety." "infrastructure" "45.0634" "7.7012" "1"
insert_report "Damaged road surface from tree roots" "Tree roots pushing up through asphalt creating bumpy, uneven driving surface." "infrastructure" "45.0623" "7.6723" "0"
insert_report "Crumbling retaining wall" "Old stone wall showing cracks and loose stones near sidewalk. Risk of collapse." "infrastructure" "45.0756" "7.6678" "0"
insert_report "Pothole cluster near intersection" "Multiple potholes forming on Via Bertola causing vehicles to swerve dangerously." "infrastructure" "45.0612" "7.6756" "1"
insert_report "Uneven paving stones in square" "Cobblestones lifted and misaligned creating tripping hazard in pedestrian area." "infrastructure" "45.0689" "7.6634" "0"
insert_report "Sidewalk too narrow for wheelchairs" "Sidewalk blocked by utility pole forcing wheelchairs onto road. Accessibility issue." "infrastructure" "45.0734" "7.6712" "0"
insert_report "Eroded shoulder on curved road" "Road edge crumbling away on dangerous curve. No barrier between road and drop." "infrastructure" "45.0923" "7.6456" "1"
insert_report "Sunken manhole in driving lane" "Manhole cover several centimeters below road surface causing jarring bump." "infrastructure" "45.0667" "7.6834" "0"
insert_report "Damaged expansion joint on bridge" "Gap in bridge surface wider than normal, dangerous for bicycles." "infrastructure" "45.0545" "7.6789" "0"
insert_report "Cracked concrete pillars under overpass" "Visible cracks in support columns under elevated roadway. Structural concern." "infrastructure" "45.0478" "7.6645" "1"
insert_report "Missing tactile warning strips" "Pedestrian crossing lacks textured paving for visually impaired users. Safety standard violation." "infrastructure" "45.0701" "7.6867" "0"
insert_report "Broken water main leak ongoing" "Pavement constantly wet from underground leak. Water waste and potential road damage." "infrastructure" "45.0812" "7.6789" "0"

# ENVIRONMENT (15 more)
insert_report "Dying trees need attention" "Row of trees with brown leaves and visible disease. Arborist evaluation needed urgently." "environment" "45.0612" "7.6534" "0"
insert_report "Park benches vandalized with carvings" "Multiple benches heavily carved with graffiti, splinters dangerous for sitting." "environment" "45.0745" "7.6856" "0"
insert_report "Flower beds trampled and destroyed" "Garden area repeatedly walked through, plants crushed, no barrier protection." "environment" "45.0719" "7.6862" "1"
insert_report "Invasive weeds overtaking garden" "Public garden overrun with thorny invasive plants choking out native species." "environment" "45.0856" "7.6712" "0"
insert_report "Park littered with plastic bottles" "Recycling bins full, bottles scattered across grass near picnic areas." "environment" "45.0591" "7.6823" "0"
insert_report "Fountain pump not working properly" "Water barely trickling, pump making grinding noise. Stagnant water attracting mosquitoes." "environment" "45.0689" "7.6734" "1"
insert_report "Grass areas worn to bare dirt" "Heavy foot traffic created muddy patches, no grass growing in high-use zones." "environment" "45.0567" "7.6867" "0"
insert_report "Rusted playground equipment unsafe" "Swings and slides showing severe rust, chains weak, paint flaking off." "environment" "45.0823" "7.6601" "0"
insert_report "Wasp nest in public picnic shelter" "Large wasp nest under roof making shelter unusable. Multiple people stung." "environment" "45.0534" "7.6834" "1"
insert_report "Overgrown hedges blocking path view" "Bushes grown too large obscuring visibility at path intersection. Safety concern." "environment" "45.0778" "7.6723" "0"
insert_report "Compost bins broken and overflowing" "Lids broken, organic waste spilling out, strong smell, attracting rodents." "environment" "45.0891" "7.6667" "0"
insert_report "Picnic tables broken and unstable" "Wooden tables rotted, benches wobbling dangerously, splinters everywhere." "environment" "45.0523" "7.6801" "1"
insert_report "Pond water turning green with algae" "Thick algae bloom covering surface, foul smell, fish appearing stressed." "environment" "45.0612" "7.6712" "0"
insert_report "Trail markers missing or fallen" "Hiking path signage knocked down, visitors getting lost in wooded area." "environment" "45.0967" "7.6534" "0"
insert_report "Dog waste not collected from park" "Dog excrement bags piling up near full bins, unpleasant smell throughout area." "environment" "45.0656" "7.6689" "1"

# SAFETY (12 more)
insert_report "Emergency call box vandalized" "SOS phone box smashed, wires exposed, non-functional in isolated area." "safety" "45.0598" "7.6756" "0"
insert_report "Security camera pointing wrong direction" "CCTV aimed at sky, not monitoring actual pedestrian area. Needs adjustment." "safety" "45.0734" "7.6801" "0"
insert_report "Underpass lights burned out completely" "Pedestrian tunnel in total darkness even during day. Very dangerous, avoided by residents." "safety" "45.0612" "7.6623" "1"
insert_report "Fire extinguisher expired and empty" "Safety equipment in metro station past inspection date, pressure gauge at zero." "safety" "45.0623" "7.6598" "0"
insert_report "Missing railing section on riverside" "Gap in protective barrier along embankment. Serious fall risk into river below." "safety" "45.0645" "7.6989" "0"
insert_report "Crosswalk signal stuck on don't walk" "Pedestrian light never turns to walk signal. People forced to jaywalk dangerously." "safety" "45.0689" "7.6756" "1"
insert_report "Slippery bridge surface when wet" "Smooth metal grating becomes ice-like in rain. Multiple slip incidents reported." "safety" "45.0656" "7.7001" "0"
insert_report "Sharp curve lacks warning sign" "Dangerous bend in bike path with no advance warning. Several collision incidents." "safety" "45.0567" "7.6534" "0"
insert_report "Pole in middle of dark pathway" "Unmarked obstacle in poorly lit area causing collisions with pedestrians and cyclists." "safety" "45.0812" "7.6645" "1"
insert_report "Blind corner needs safety mirror" "Intersection with no visibility, multiple near-miss accidents between vehicles and bikes." "safety" "45.0723" "7.6823" "0"
insert_report "Emergency exit sign not illuminated" "Exit marker in public building dark and invisible. Code violation, dangerous in emergency." "safety" "45.0601" "7.6612" "0"
insert_report "Broken handrail on steep stairs" "Metal railing detached from wall on public stairway. Elderly falling, serious injuries." "safety" "45.0778" "7.6767" "1"

# SANITATION (12 more)
insert_report "Street sweeping never happens" "Streets covered in debris, leaves, litter for weeks. No cleaning crews seen." "sanitation" "45.0695" "7.6845" "0"
insert_report "Trash bins broken and unusable" "Lids missing, bins tipped over, waste spilling onto sidewalk daily." "sanitation" "45.0712" "7.6878" "0"
insert_report "Graffiti covering entire building wall" "Large obscene graffiti visible to everyone, been there for months, no cleanup." "sanitation" "45.0667" "7.6789" "1"
insert_report "Public restroom completely filthy" "Toilet facilities disgusting, no toilet paper, broken lock, unusable condition." "sanitation" "45.0689" "7.6712" "0"
insert_report "Litter accumulating along sidewalk" "Trash piling up for days, wind spreading it further, no collection happening." "sanitation" "45.0756" "7.6823" "0"
insert_report "Cigarette butts covering entire plaza" "Ground littered with thousands of cigarette ends, no receptacles available." "sanitation" "45.0634" "7.6867" "1"
insert_report "Monument covered in bird droppings" "Historic statue completely white with bird waste, very unsightly for tourists." "sanitation" "45.0701" "7.6834" "0"
insert_report "Garbage bags left on street for days" "Waste bags torn open by animals, contents scattered, strong smell." "sanitation" "45.0723" "7.6801" "0"
insert_report "Chewing gum carpet on pavement" "Sidewalk black with old gum, sticky surface, looks terrible and unhygienic." "sanitation" "45.0678" "7.6756" "1"
insert_report "Tags and spray paint on new building" "Fresh construction already vandalized with ugly graffiti tags everywhere." "sanitation" "45.0645" "7.6689" "0"
insert_report "Food waste rotting in broken bin" "Organic bin cracked, maggots visible, terrible smell affecting entire block." "sanitation" "45.0812" "7.6734" "0"
insert_report "Unauthorized posters covering walls" "Hundreds of old event posters layered, peeling, making area look abandoned." "sanitation" "45.0589" "7.6645" "1"

# TRANSPORT (12 more)
insert_report "Bus shelter roof collapsed inward" "Metal frame bent, glass broken, shelter unusable. Dangerous debris, no seating." "transport" "45.0698" "7.6789" "0"
insert_report "All bike sharing bikes vandalized" "Every bike at station has flat tires, seats torn off, unusable for months." "transport" "45.0723" "7.6834" "0"
insert_report "Traffic lights out of sync causing jams" "Red lights on all directions simultaneously then all green. Total chaos." "transport" "45.0689" "7.6756" "1"
insert_report "Bus lane blocked by parked cars daily" "Private vehicles ignoring bus lane, no enforcement, buses stuck in traffic." "transport" "45.0734" "7.6701" "0"
insert_report "Electronic display showing wrong times" "Bus arrival times completely incorrect, passengers missing buses, very frustrating." "transport" "45.0656" "7.6823" "0"
insert_report "No stop sign at dangerous intersection" "Four-way crossing with no traffic control. Near misses daily, accident waiting to happen." "transport" "45.0712" "7.6867" "1"
insert_report "Parking garage entrance gate broken" "Barrier stuck in down position, cars cannot enter or exit facility." "transport" "45.0645" "7.6712" "0"
insert_report "Bike repair station tools stolen" "Chain and tools ripped off station, only empty bolts remaining. Pump non-functional." "transport" "45.0678" "7.6645" "0"
insert_report "EV charging cables cut by vandals" "All electric vehicle chargers disabled, cables severed. Equipment destroyed." "transport" "45.0701" "7.6801" "1"
insert_report "Metro elevator broken for weeks" "Wheelchair users cannot access platform. Stairs only option, disability discrimination." "transport" "45.0623" "7.6589" "0"
insert_report "Bike racks bent and unusable" "Parking bars twisted by vehicle impact, bikes cannot lock properly, many thefts." "transport" "45.0612" "7.6734" "0"
insert_report "Parking meter screen smashed" "Display broken, cannot see charges or time. Still issuing tickets though." "transport" "45.0667" "7.6778" "1"

# OTHER (8 more)
insert_report "Public WiFi network not working" "Cannot connect to advertised free WiFi in square. Network error or doesn't exist." "other" "45.0718" "7.6869" "0"
insert_report "Tourist kiosk unstaffed and locked" "Information point always closed, no one ever present during posted hours." "other" "45.0689" "7.6845" "0"
insert_report "Bulletin board glass smashed" "Community board vandalized, glass shattered, announcements getting wet and ruined." "other" "45.0756" "7.6723" "1"
insert_report "Drinking fountain not working" "Push button broken, no water flowing. Only water source in park unavailable." "other" "45.0634" "7.6801" "0"
insert_report "Loud music late at night from bar" "Commercial establishment playing music past 2 AM, disturbing residents sleep nightly." "other" "45.0812" "7.6667" "0"
insert_report "Construction dust affecting apartments" "Nearby construction creating clouds of dust, covering balconies and entering homes." "other" "45.0545" "7.6756" "1"
insert_report "Aggressive panhandling in tourist area" "Multiple people harassing visitors for money in aggressive manner, creating unsafe feeling." "other" "45.0878" "7.6712" "0"
insert_report "Abandoned shopping cart in street" "Large metal cart left in middle of narrow road for weeks. Obstructing traffic flow." "other" "45.0701" "7.6789" "0"

echo ""
echo "✅ Additional APPROVED reports added successfully!"
echo ""
echo "📊 Updated Summary:"
sqlite3 "$DB_PATH" "SELECT state, COUNT(*) as count FROM reports GROUP BY state;"
echo ""
echo "📋 Total reports by category:"
sqlite3 "$DB_PATH" "SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY category;"
