import { AppDataSource } from "@database";
import { ReportDAO } from "@models/dao/ReportDAO";
import { UserDAO } from "@models/dao/UserDAO";
import { OfficeType } from "@models/enums/OfficeType";
import { ReportState } from "@models/enums/ReportState";

// Sample reports for Turin, Italy (coordinates around 45.0703, 7.6869)
const sampleReports = [
  // INFRASTRUCTURE (10 reports)
  {
    title: "Pothole on Corso Vittorio Emanuele II",
    description: "Large pothole approximately 30cm deep near address 125. It's causing damage to vehicles and is a hazard for motorcycles and bicycles. Reported by: Maria Bianchi, local resident who noticed damage to her car.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0655,
    longitude: 7.6892,
    anonymity: false,
  },
  {
    title: "Cracked pavement on Via Garibaldi",
    description: "Uneven and cracked pavement creating tripping hazard for pedestrians, especially elderly citizens. Located in front of shop number 47.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0691,
    longitude: 7.6823,
    anonymity: true,
  },
  {
    title: "Missing street sign at Via Lagrange intersection",
    description: "Street name sign has been missing for over a week, causing confusion for visitors and delivery services trying to navigate the area.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0665,
    longitude: 7.6875,
    anonymity: false,
  },
  {
    title: "Damaged pedestrian crossing on Corso Francia",
    description: "White stripes of pedestrian crossing almost completely faded, making it dangerous for people crossing the busy road.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0889,
    longitude: 7.6523,
    anonymity: false,
  },
  {
    title: "Broken manhole cover on Via Po",
    description: "Manhole cover partially broken and unstable. Creates loud noise when vehicles pass over and poses risk of tire damage.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0688,
    longitude: 7.6956,
    anonymity: true,
  },
  {
    title: "Collapsed sidewalk on Corso Duca degli Abruzzi",
    description: "Section of sidewalk has collapsed near the metro entrance, forcing pedestrians to walk on the road. Urgent repair needed.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0632,
    longitude: 7.6589,
    anonymity: false,
  },
  {
    title: "Water leak causing road subsidence",
    description: "Visible water leak from underground pipe causing road surface to sink on Via Nizza. Growing larger every day.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0521,
    longitude: 7.6712,
    anonymity: false,
  },
  {
    title: "Damaged guardrail on Corso Regina Margherita",
    description: "Metal guardrail bent and broken, likely from vehicle collision. Safety hazard for both vehicles and pedestrians.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0856,
    longitude: 7.6834,
    anonymity: true,
  },
  {
    title: "Loose cobblestones in historic center",
    description: "Multiple cobblestones loose on Via Stampatori, creating uneven surface dangerous for pedestrians, especially in wet conditions.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0698,
    longitude: 7.6878,
    anonymity: false,
  },
  {
    title: "Broken drainage grate on Piazza Vittorio Veneto",
    description: "Drainage grate broken and partially missing, creating hole that could trap bicycle wheels or cause pedestrian injuries.",
    category: OfficeType.INFRASTRUCTURE,
    latitude: 45.0625,
    longitude: 7.6978,
    anonymity: false,
  },

  // ENVIRONMENT (10 reports)
  {
    title: "Damaged park bench in Parco del Valentino",
    description: "Wooden bench near the entrance has several broken slats making it unusable and potentially dangerous. Popular sitting area for families.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0585,
    longitude: 7.6847,
    anonymity: false,
  },
  {
    title: "Dead tree in residential area",
    description: "Large dead tree on Corso Regina Margherita poses risk of falling branches. Located near playground area, immediate inspection recommended.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0823,
    longitude: 7.6912,
    anonymity: false,
  },
  {
    title: "Broken fountain in Piazza CLN",
    description: "Historic fountain not functioning, water basin empty and collecting debris. Important landmark requiring maintenance.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0642,
    longitude: 7.6695,
    anonymity: false,
  },
  {
    title: "Overgrown vegetation blocking pathway",
    description: "Bushes and trees overgrown along pedestrian path in Parco della Pellerina, making passage difficult and unsafe.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0945,
    longitude: 7.6456,
    anonymity: true,
  },
  {
    title: "Damaged playground equipment",
    description: "Swing set in Giardini Cavour has broken chains and damaged seats. Popular playground needs urgent safety check.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0756,
    longitude: 7.6712,
    anonymity: false,
  },
  {
    title: "Abandoned waste in park area",
    description: "Large pile of construction debris dumped illegally in wooded area of Parco del Valentino. Environmental hazard.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0512,
    longitude: 7.6823,
    anonymity: true,
  },
  {
    title: "Dried up pond in Botanical Garden",
    description: "Decorative pond completely dried up with dead fish visible. Unpleasant smell affecting visitor experience.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0598,
    longitude: 7.6734,
    anonymity: false,
  },
  {
    title: "Broken public exercise equipment",
    description: "Outdoor gym equipment in park has broken resistance mechanism. Could cause injuries if used.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0867,
    longitude: 7.6645,
    anonymity: false,
  },
  {
    title: "Fallen tree blocking park path",
    description: "Large tree fallen across main walking path after recent storm. Completely blocks access to picnic area.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0534,
    longitude: 7.6889,
    anonymity: false,
  },
  {
    title: "Dog waste bins overflowing",
    description: "All dog waste bins in Giardini Reali completely full and overflowing. Creating unsanitary conditions.",
    category: OfficeType.ENVIRONMENT,
    latitude: 45.0734,
    longitude: 7.6867,
    anonymity: true,
  },

  // SAFETY (10 reports)
  {
    title: "Broken streetlight on Via Roma",
    description: "The streetlight near the corner of Via Roma and Piazza San Carlo has been out for three days, creating safety concerns for pedestrians at night.",
    category: OfficeType.SAFETY,
    latitude: 45.0678,
    longitude: 7.6847,
    anonymity: false,
  },
  {
    title: "Flickering streetlights on Corso Duca degli Abruzzi",
    description: "Multiple streetlights flickering intermittently along the corso, creating inadequate lighting conditions. Possibly electrical issue affecting several poles.",
    category: OfficeType.SAFETY,
    latitude: 45.0628,
    longitude: 7.6623,
    anonymity: true,
  },
  {
    title: "Broken railing on pedestrian bridge",
    description: "Metal railing on footbridge over railway missing section. Serious fall hazard, especially for children.",
    category: OfficeType.SAFETY,
    latitude: 45.0712,
    longitude: 7.6556,
    anonymity: false,
  },
  {
    title: "Exposed electrical wires on building facade",
    description: "Electrical wires hanging loose from building wall at low height. Serious electrocution risk after rain.",
    category: OfficeType.SAFETY,
    latitude: 45.0701,
    longitude: 7.6789,
    anonymity: true,
  },
  {
    title: "Missing safety barrier near construction site",
    description: "Construction area on Via San Francesco not properly fenced. Easy access for children, multiple hazards visible.",
    category: OfficeType.SAFETY,
    latitude: 45.0667,
    longitude: 7.6834,
    anonymity: false,
  },
  {
    title: "Dark tunnel under railway",
    description: "All lights out in pedestrian underpass. Completely dark even during day, safety concern for vulnerable users.",
    category: OfficeType.SAFETY,
    latitude: 45.0589,
    longitude: 7.6567,
    anonymity: false,
  },
  {
    title: "Broken glass on children's playground",
    description: "Shattered glass bottle scattered across playground sand area. Immediate cleanup required to prevent injuries.",
    category: OfficeType.SAFETY,
    latitude: 45.0778,
    longitude: 7.6701,
    anonymity: true,
  },
  {
    title: "Unstable scaffolding on historic building",
    description: "Construction scaffolding appears unstable and poorly secured. Located on busy pedestrian street, serious public safety risk.",
    category: OfficeType.SAFETY,
    latitude: 45.0689,
    longitude: 7.6845,
    anonymity: false,
  },
  {
    title: "Ice accumulation on sidewalk",
    description: "Large patch of ice on sidewalk not treated with salt. Multiple people have slipped, needs immediate attention.",
    category: OfficeType.SAFETY,
    latitude: 45.0812,
    longitude: 7.6723,
    anonymity: false,
  },
  {
    title: "Broken fire hydrant leaking water",
    description: "Fire hydrant damaged and continuously leaking water onto sidewalk, creating slipping hazard and water waste.",
    category: OfficeType.SAFETY,
    latitude: 45.0645,
    longitude: 7.6912,
    anonymity: true,
  },

  // SANITATION (10 reports)
  {
    title: "Overflowing trash bin on Piazza Castello",
    description: "Public waste bin has been overflowing for two days, causing litter to scatter around the area. Located near the main tourist entrance.",
    category: OfficeType.SANITATION,
    latitude: 45.0725,
    longitude: 7.6868,
    anonymity: false,
  },
  {
    title: "Graffiti on historic building facade",
    description: "Vandalism graffiti covering approximately 10 square meters on the facade of a historic building on Via Po. Requires urgent cleaning to preserve the architectural heritage.",
    category: OfficeType.SANITATION,
    latitude: 45.0676,
    longitude: 7.6912,
    anonymity: true,
  },
  {
    title: "Illegal dumping of furniture",
    description: "Old mattress, sofa and other furniture dumped on street corner. Been there for over a week attracting rats.",
    category: OfficeType.SANITATION,
    latitude: 45.0623,
    longitude: 7.6745,
    anonymity: false,
  },
  {
    title: "Sewage smell from storm drain",
    description: "Strong sewage odor coming from storm drain on Via Pietro Micca. Smell has intensified over past few days.",
    category: OfficeType.SANITATION,
    latitude: 45.0703,
    longitude: 7.6823,
    anonymity: true,
  },
  {
    title: "Broken public restroom facility",
    description: "Public toilet in Giardini Reali out of order for two weeks. Door broken, unsanitary conditions inside.",
    category: OfficeType.SANITATION,
    latitude: 45.0741,
    longitude: 7.6856,
    anonymity: false,
  },
  {
    title: "Overflowing recycling containers",
    description: "All recycling bins on Corso Vinzaglio completely full. Cardboard and plastic scattered around by wind.",
    category: OfficeType.SANITATION,
    latitude: 45.0689,
    longitude: 7.6712,
    anonymity: false,
  },
  {
    title: "Rat infestation near market area",
    description: "Multiple rats visible during daytime near Porta Palazzo market. Waste accumulation seems to be attracting them.",
    category: OfficeType.SANITATION,
    latitude: 45.0778,
    longitude: 7.6823,
    anonymity: true,
  },
  {
    title: "Abandoned vehicle leaking fluids",
    description: "Car abandoned for months now leaking oil onto street. Creating environmental hazard and ugly stain.",
    category: OfficeType.SANITATION,
    latitude: 45.0567,
    longitude: 7.6678,
    anonymity: false,
  },
  {
    title: "Pigeon droppings on public benches",
    description: "Benches in Piazza San Carlo covered in pigeon droppings. Completely unusable and unsanitary.",
    category: OfficeType.SANITATION,
    latitude: 45.0689,
    longitude: 7.6834,
    anonymity: false,
  },
  {
    title: "Graffiti on metro station entrance",
    description: "Extensive graffiti vandalism covering entire wall of metro entrance. Makes area look neglected and unsafe.",
    category: OfficeType.SANITATION,
    latitude: 45.0612,
    longitude: 7.6598,
    anonymity: true,
  },

  // TRANSPORT (10 reports)
  {
    title: "Malfunctioning traffic light at Piazza Statuto",
    description: "Traffic light at the intersection is stuck on red in all directions, causing traffic congestion. Urgent intervention needed for traffic safety.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0712,
    longitude: 7.6745,
    anonymity: false,
  },
  {
    title: "Damaged bike lane marking",
    description: "Bike lane road markings severely faded and barely visible on Via Nizza, creating safety concerns for cyclists and motorists.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0556,
    longitude: 7.6734,
    anonymity: false,
  },
  {
    title: "Bus stop shelter damaged",
    description: "Glass panels of bus shelter shattered on Corso Vittorio. Sharp glass pieces pose danger to waiting passengers.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0667,
    longitude: 7.6867,
    anonymity: false,
  },
  {
    title: "Missing electronic bus schedule display",
    description: "Digital display at busy bus stop not working for two weeks. Passengers have no information about arrivals.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0734,
    longitude: 7.6789,
    anonymity: true,
  },
  {
    title: "Bicycle parking rack broken",
    description: "Bike rack near metro station broken and bent. Only 2 of 10 spaces usable, causing bikes to be locked to trees.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0623,
    longitude: 7.6601,
    anonymity: false,
  },
  {
    title: "Road signs obscured by tree branches",
    description: "Multiple important road signs completely hidden by overgrown tree branches on Corso Regina Margherita.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0889,
    longitude: 7.6756,
    anonymity: false,
  },
  {
    title: "Parking meter not accepting payment",
    description: "Parking meter on Via Carlo Alberto refuses all payment methods. Causing confusion and unfair parking tickets.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0656,
    longitude: 7.6923,
    anonymity: true,
  },
  {
    title: "Zebra crossing paint completely worn",
    description: "Pedestrian crossing near school completely invisible. Very dangerous for children crossing busy street.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0745,
    longitude: 7.6645,
    anonymity: false,
  },
  {
    title: "Bus shelter bench broken",
    description: "Seating at bus stop collapsed and broken. Elderly passengers have nowhere to sit while waiting.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0598,
    longitude: 7.6712,
    anonymity: false,
  },
  {
    title: "Speed limit sign knocked down",
    description: "Speed limit sign lying on ground after apparent vehicle collision. Needs replacement for traffic safety.",
    category: OfficeType.TRANSPORT,
    latitude: 45.0812,
    longitude: 7.6534,
    anonymity: true,
  },

  // OTHER (5 reports)
  {
    title: "Public WiFi not working in piazza",
    description: "Free public WiFi service advertised in Piazza Castello not functioning. Multiple users unable to connect.",
    category: OfficeType.OTHER,
    latitude: 45.0721,
    longitude: 7.6872,
    anonymity: false,
  },
  {
    title: "Noisy construction starting too early",
    description: "Construction site on Via Lagrange starting work at 6 AM, violating noise ordinance. Disturbing entire neighborhood.",
    category: OfficeType.OTHER,
    latitude: 45.0663,
    longitude: 7.6881,
    anonymity: true,
  },
  {
    title: "Public clock tower showing wrong time",
    description: "Historic clock tower in piazza showing incorrect time for over a month. Tourist landmark needs maintenance.",
    category: OfficeType.OTHER,
    latitude: 45.0695,
    longitude: 7.6845,
    anonymity: false,
  },
  {
    title: "Stray dogs in residential area",
    description: "Pack of three stray dogs roaming residential streets. Concerned about safety, especially for children and elderly.",
    category: OfficeType.OTHER,
    latitude: 45.0534,
    longitude: 7.6623,
    anonymity: false,
  },
  {
    title: "Missing manhole cover in pedestrian area",
    description: "Manhole cover completely missing leaving dangerous open hole on busy pedestrian walkway. Immediate action required.",
    category: OfficeType.OTHER,
    latitude: 45.0678,
    longitude: 7.6789,
    anonymity: true,
  },
];

export async function seedReports() {
  try {
    console.log("🌱 Starting to seed reports...");
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const reportRepo = AppDataSource.getRepository(ReportDAO);
    const userRepo = AppDataSource.getRepository(UserDAO);

    // Get the first user (testuser) to be the author
    const users = await userRepo.find();
    const author = users.length > 0 ? users[0] : null;

    let createdCount = 0;
    let approvedCount = 0;

    for (const report of sampleReports) {
      // Create alternating PENDING and APPROVED reports
      const isApproved = createdCount % 2 === 0;
      
      const newReport = reportRepo.create({
        title: report.title,
        location: {
          name: `Turin, Italy`,
          Coordinates: {
            latitude: report.latitude,
            longitude: report.longitude,
          },
        },
        author: report.anonymity ? null : author,
        anonymity: report.anonymity,
        date: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date within last 30 days
        category: report.category,
        document: {
          Description: report.description,
          Photos: [],
        },
        state: isApproved ? ReportState.IN_PROGRESS : ReportState.PENDING,
        reason: null,
        assignedOfficerId: null,
      });

      await reportRepo.save(newReport);
      createdCount++;
      if (isApproved) approvedCount++;
      
      console.log(`✅ Created report: "${report.title}" (${isApproved ? 'APPROVED' : 'PENDING'})`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} reports!`);
    console.log(`   - ${approvedCount} APPROVED (visible on map)`);
    console.log(`   - ${createdCount - approvedCount} PENDING (for officer review)`);
    
    return { total: createdCount, approved: approvedCount, pending: createdCount - approvedCount };
  } catch (error) {
    console.error("❌ Error seeding reports:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedReports()
    .then(() => {
      console.log("\n✨ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Seeding failed:", error);
      process.exit(1);
    });
}
