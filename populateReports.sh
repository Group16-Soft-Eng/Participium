#!/bin/bash

# Navigate to the correct directory
SCRIPT_DIR="$(dirname "$0")"
DB_PATH="$SCRIPT_DIR/server/participium.db"

echo "🗑️  Deleting existing reports..."
sqlite3 "$DB_PATH" "DELETE FROM reports;"

echo "🌱 Populating database with sample reports..."

# Get the first user ID to use as author
USER_ID=$(sqlite3 "$DB_PATH" "SELECT id FROM users LIMIT 1;")

if [ -z "$USER_ID" ]; then
    echo "❌ No users found in database. Please create a user first."
    exit 1
fi

echo "Using user ID: $USER_ID"

# Function to insert report
insert_report() {
    local title="$1"
    local description="$2"
    local category="$3"
    local latitude="$4"
    local longitude="$5"
    local state="$6"
    local anonymity="$7"
    
    # Random date within last 30 days
    local days_ago=$((RANDOM % 30))
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
    '$state',
    NULL,
    NULL
);
EOF
}

# Counter for alternating states
count=0

# INFRASTRUCTURE (10 reports)
insert_report "Pothole on Corso Vittorio Emanuele II" "Large pothole approximately 30cm deep near address 125. It's causing damage to vehicles and is a hazard for motorcycles and bicycles." "infrastructure" "45.0655" "7.6892" "APPROVED" "0"
((count++))

insert_report "Cracked pavement on Via Garibaldi" "Uneven and cracked pavement creating tripping hazard for pedestrians, especially elderly citizens. Located in front of shop number 47." "infrastructure" "45.0691" "7.6823" "PENDING" "1"
((count++))

insert_report "Missing street sign at Via Lagrange intersection" "Street name sign has been missing for over a week, causing confusion for visitors and delivery services trying to navigate the area." "infrastructure" "45.0665" "7.6875" "APPROVED" "0"
((count++))

insert_report "Damaged pedestrian crossing on Corso Francia" "White stripes of pedestrian crossing almost completely faded, making it dangerous for people crossing the busy road." "infrastructure" "45.0889" "7.6523" "PENDING" "0"
((count++))

insert_report "Broken manhole cover on Via Po" "Manhole cover partially broken and unstable. Creates loud noise when vehicles pass over and poses risk of tire damage." "infrastructure" "45.0688" "7.6956" "APPROVED" "1"
((count++))

insert_report "Collapsed sidewalk on Corso Duca degli Abruzzi" "Section of sidewalk has collapsed near the metro entrance, forcing pedestrians to walk on the road. Urgent repair needed." "infrastructure" "45.0632" "7.6589" "PENDING" "0"
((count++))

insert_report "Water leak causing road subsidence" "Visible water leak from underground pipe causing road surface to sink on Via Nizza. Growing larger every day." "infrastructure" "45.0521" "7.6712" "APPROVED" "0"
((count++))

insert_report "Damaged guardrail on Corso Regina Margherita" "Metal guardrail bent and broken, likely from vehicle collision. Safety hazard for both vehicles and pedestrians." "infrastructure" "45.0856" "7.6834" "PENDING" "1"
((count++))

insert_report "Loose cobblestones in historic center" "Multiple cobblestones loose on Via Stampatori, creating uneven surface dangerous for pedestrians, especially in wet conditions." "infrastructure" "45.0698" "7.6878" "APPROVED" "0"
((count++))

insert_report "Broken drainage grate on Piazza Vittorio Veneto" "Drainage grate broken and partially missing, creating hole that could trap bicycle wheels or cause pedestrian injuries." "infrastructure" "45.0625" "7.6978" "PENDING" "0"
((count++))

# ENVIRONMENT (10 reports)
insert_report "Damaged park bench in Parco del Valentino" "Wooden bench near the entrance has several broken slats making it unusable and potentially dangerous. Popular sitting area for families." "environment" "45.0585" "7.6847" "APPROVED" "0"
((count++))

insert_report "Dead tree in residential area" "Large dead tree on Corso Regina Margherita poses risk of falling branches. Located near playground area, immediate inspection recommended." "environment" "45.0823" "7.6912" "PENDING" "0"
((count++))

insert_report "Broken fountain in Piazza CLN" "Historic fountain not functioning, water basin empty and collecting debris. Important landmark requiring maintenance." "environment" "45.0642" "7.6695" "APPROVED" "0"
((count++))

insert_report "Overgrown vegetation blocking pathway" "Bushes and trees overgrown along pedestrian path in Parco della Pellerina, making passage difficult and unsafe." "environment" "45.0945" "7.6456" "PENDING" "1"
((count++))

insert_report "Damaged playground equipment" "Swing set in Giardini Cavour has broken chains and damaged seats. Popular playground needs urgent safety check." "environment" "45.0756" "7.6712" "APPROVED" "0"
((count++))

insert_report "Abandoned waste in park area" "Large pile of construction debris dumped illegally in wooded area of Parco del Valentino. Environmental hazard." "environment" "45.0512" "7.6823" "PENDING" "1"
((count++))

insert_report "Dried up pond in Botanical Garden" "Decorative pond completely dried up with dead fish visible. Unpleasant smell affecting visitor experience." "environment" "45.0598" "7.6734" "APPROVED" "0"
((count++))

insert_report "Broken public exercise equipment" "Outdoor gym equipment in park has broken resistance mechanism. Could cause injuries if used." "environment" "45.0867" "7.6645" "PENDING" "0"
((count++))

insert_report "Fallen tree blocking park path" "Large tree fallen across main walking path after recent storm. Completely blocks access to picnic area." "environment" "45.0534" "7.6889" "APPROVED" "0"
((count++))

insert_report "Dog waste bins overflowing" "All dog waste bins in Giardini Reali completely full and overflowing. Creating unsanitary conditions." "environment" "45.0734" "7.6867" "PENDING" "1"
((count++))

# SAFETY (10 reports)
insert_report "Broken streetlight on Via Roma" "The streetlight near the corner of Via Roma and Piazza San Carlo has been out for three days, creating safety concerns for pedestrians at night." "safety" "45.0678" "7.6847" "APPROVED" "0"
((count++))

insert_report "Flickering streetlights on Corso Duca degli Abruzzi" "Multiple streetlights flickering intermittently along the corso, creating inadequate lighting conditions. Possibly electrical issue affecting several poles." "safety" "45.0628" "7.6623" "PENDING" "1"
((count++))

insert_report "Broken railing on pedestrian bridge" "Metal railing on footbridge over railway missing section. Serious fall hazard, especially for children." "safety" "45.0712" "7.6556" "APPROVED" "0"
((count++))

insert_report "Exposed electrical wires on building facade" "Electrical wires hanging loose from building wall at low height. Serious electrocution risk after rain." "safety" "45.0701" "7.6789" "PENDING" "1"
((count++))

insert_report "Missing safety barrier near construction site" "Construction area on Via San Francesco not properly fenced. Easy access for children, multiple hazards visible." "safety" "45.0667" "7.6834" "APPROVED" "0"
((count++))

insert_report "Dark tunnel under railway" "All lights out in pedestrian underpass. Completely dark even during day, safety concern for vulnerable users." "safety" "45.0589" "7.6567" "PENDING" "0"
((count++))

insert_report "Broken glass on children's playground" "Shattered glass bottle scattered across playground sand area. Immediate cleanup required to prevent injuries." "safety" "45.0778" "7.6701" "APPROVED" "1"
((count++))

insert_report "Unstable scaffolding on historic building" "Construction scaffolding appears unstable and poorly secured. Located on busy pedestrian street, serious public safety risk." "safety" "45.0689" "7.6845" "PENDING" "0"
((count++))

insert_report "Ice accumulation on sidewalk" "Large patch of ice on sidewalk not treated with salt. Multiple people have slipped, needs immediate attention." "safety" "45.0812" "7.6723" "APPROVED" "0"
((count++))

insert_report "Broken fire hydrant leaking water" "Fire hydrant damaged and continuously leaking water onto sidewalk, creating slipping hazard and water waste." "safety" "45.0645" "7.6912" "PENDING" "1"
((count++))

# SANITATION (10 reports)
insert_report "Overflowing trash bin on Piazza Castello" "Public waste bin has been overflowing for two days, causing litter to scatter around the area. Located near the main tourist entrance." "sanitation" "45.0725" "7.6868" "APPROVED" "0"
((count++))

insert_report "Graffiti on historic building facade" "Vandalism graffiti covering approximately 10 square meters on the facade of a historic building on Via Po. Requires urgent cleaning to preserve the architectural heritage." "sanitation" "45.0676" "7.6912" "PENDING" "1"
((count++))

insert_report "Illegal dumping of furniture" "Old mattress, sofa and other furniture dumped on street corner. Been there for over a week attracting rats." "sanitation" "45.0623" "7.6745" "APPROVED" "0"
((count++))

insert_report "Sewage smell from storm drain" "Strong sewage odor coming from storm drain on Via Pietro Micca. Smell has intensified over past few days." "sanitation" "45.0703" "7.6823" "PENDING" "1"
((count++))

insert_report "Broken public restroom facility" "Public toilet in Giardini Reali out of order for two weeks. Door broken, unsanitary conditions inside." "sanitation" "45.0741" "7.6856" "APPROVED" "0"
((count++))

insert_report "Overflowing recycling containers" "All recycling bins on Corso Vinzaglio completely full. Cardboard and plastic scattered around by wind." "sanitation" "45.0689" "7.6712" "PENDING" "0"
((count++))

insert_report "Rat infestation near market area" "Multiple rats visible during daytime near Porta Palazzo market. Waste accumulation seems to be attracting them." "sanitation" "45.0778" "7.6823" "APPROVED" "1"
((count++))

insert_report "Abandoned vehicle leaking fluids" "Car abandoned for months now leaking oil onto street. Creating environmental hazard and ugly stain." "sanitation" "45.0567" "7.6678" "PENDING" "0"
((count++))

insert_report "Pigeon droppings on public benches" "Benches in Piazza San Carlo covered in pigeon droppings. Completely unusable and unsanitary." "sanitation" "45.0689" "7.6834" "APPROVED" "0"
((count++))

insert_report "Graffiti on metro station entrance" "Extensive graffiti vandalism covering entire wall of metro entrance. Makes area look neglected and unsafe." "sanitation" "45.0612" "7.6598" "PENDING" "1"
((count++))

# TRANSPORT (10 reports)
insert_report "Malfunctioning traffic light at Piazza Statuto" "Traffic light at the intersection is stuck on red in all directions, causing traffic congestion. Urgent intervention needed for traffic safety." "transport" "45.0712" "7.6745" "APPROVED" "0"
((count++))

insert_report "Damaged bike lane marking" "Bike lane road markings severely faded and barely visible on Via Nizza, creating safety concerns for cyclists and motorists." "transport" "45.0556" "7.6734" "PENDING" "0"
((count++))

insert_report "Bus stop shelter damaged" "Glass panels of bus shelter shattered on Corso Vittorio. Sharp glass pieces pose danger to waiting passengers." "transport" "45.0667" "7.6867" "APPROVED" "0"
((count++))

insert_report "Missing electronic bus schedule display" "Digital display at busy bus stop not working for two weeks. Passengers have no information about arrivals." "transport" "45.0734" "7.6789" "PENDING" "1"
((count++))

insert_report "Bicycle parking rack broken" "Bike rack near metro station broken and bent. Only 2 of 10 spaces usable, causing bikes to be locked to trees." "transport" "45.0623" "7.6601" "APPROVED" "0"
((count++))

insert_report "Road signs obscured by tree branches" "Multiple important road signs completely hidden by overgrown tree branches on Corso Regina Margherita." "transport" "45.0889" "7.6756" "PENDING" "0"
((count++))

insert_report "Parking meter not accepting payment" "Parking meter on Via Carlo Alberto refuses all payment methods. Causing confusion and unfair parking tickets." "transport" "45.0656" "7.6923" "APPROVED" "1"
((count++))

insert_report "Zebra crossing paint completely worn" "Pedestrian crossing near school completely invisible. Very dangerous for children crossing busy street." "transport" "45.0745" "7.6645" "PENDING" "0"
((count++))

insert_report "Bus shelter bench broken" "Seating at bus stop collapsed and broken. Elderly passengers have nowhere to sit while waiting." "transport" "45.0598" "7.6712" "APPROVED" "0"
((count++))

insert_report "Speed limit sign knocked down" "Speed limit sign lying on ground after apparent vehicle collision. Needs replacement for traffic safety." "transport" "45.0812" "7.6534" "PENDING" "1"
((count++))

# OTHER (5 reports)
insert_report "Public WiFi not working in piazza" "Free public WiFi service advertised in Piazza Castello not functioning. Multiple users unable to connect." "other" "45.0721" "7.6872" "APPROVED" "0"
((count++))

insert_report "Noisy construction starting too early" "Construction site on Via Lagrange starting work at 6 AM, violating noise ordinance. Disturbing entire neighborhood." "other" "45.0663" "7.6881" "PENDING" "1"
((count++))

insert_report "Public clock tower showing wrong time" "Historic clock tower in piazza showing incorrect time for over a month. Tourist landmark needs maintenance." "other" "45.0695" "7.6845" "APPROVED" "0"
((count++))

insert_report "Stray dogs in residential area" "Pack of three stray dogs roaming residential streets. Concerned about safety, especially for children and elderly." "other" "45.0534" "7.6623" "PENDING" "0"
((count++))

insert_report "Missing manhole cover in pedestrian area" "Manhole cover completely missing leaving dangerous open hole on busy pedestrian walkway. Immediate action required." "other" "45.0678" "7.6789" "APPROVED" "1"

echo ""
echo "✅ Database populated successfully!"
echo ""
echo "📊 Summary:"
sqlite3 "$DB_PATH" "SELECT state, COUNT(*) as count FROM reports GROUP BY state;"
echo ""
echo "📋 Reports by category:"
sqlite3 "$DB_PATH" "SELECT category, COUNT(*) as count FROM reports GROUP BY category;"
