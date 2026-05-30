import type {
  ActivityType,
  AdventureBoss,
  AdventureChest,
  AdventureHitMetric,
  AdventureHitRequirement,
  AdventureMob,
  AdventureMobRequirement,
  AdventureRegion
} from "../db/schema";

const seedCreatedAt = "2026-01-01T00:00:00.000Z";

interface RealmSeed {
  id: string;
  title: string;
  titleEl: string;
  description: string;
  descriptionEl: string;
  story: string;
  storyEl: string;
  visualTone: string;
  unlockRequirement: string;
  unlockRequirementEl: string;
  enemyArchetypes: string[];
  enemyArchetypesEl: string[];
  eliteArchetypes: string[];
  eliteArchetypesEl: string[];
  bosses: Array<{
    slug: string;
    title: string;
    titleEl: string;
    description: string;
    descriptionEl: string;
    weakness: ActivityType;
  }>;
  chests: Array<{
    slug: string;
    title: string;
    titleEl: string;
    description: string;
    descriptionEl: string;
    unlockCount: number;
  }>;
}

interface HitTemplate {
  activitySlug?: string;
  activityType?: ActivityType;
  metric: AdventureHitMetric;
  requiredValue: number;
  label: string;
  labelEl: string;
}

const adjectives = [
  "Drowsy",
  "Restless",
  "Iron",
  "Hollow",
  "Ashen",
  "Wild",
  "Grim",
  "Ragged",
  "Stubborn",
  "Night",
  "Vowless",
  "Heavy"
];

const adjectivesEl = [
  "Νυσταγμένος",
  "Ανήσυχος",
  "Σιδερένιος",
  "Κούφιος",
  "Σταχτής",
  "Άγριος",
  "Σκοτεινός",
  "Φθαρμένος",
  "Πεισματάρης",
  "Νυχτερινός",
  "Άτακτος",
  "Βαρύς"
];

const titles = ["I", "II", "III", "Veteran", "Binder", "Strider", "Keeper", "Vanguard"];
const titlesEl = ["Α'", "Β'", "Γ'", "Βετεράνος", "Δεσμώτης", "Βηματιστής", "Φύλακας", "Προπομπός"];

export const REALM_SEEDS: RealmSeed[] = [
  {
    id: "region_gate",
    title: "Gate of First Reps",
    titleEl: "Πύλη των Πρώτων Επαναλήψεων",
    description: "The first threshold. Every honest set opens the path.",
    descriptionEl: "Το πρώτο κατώφλι. Κάθε τίμιο σετ ανοίγει δρόμο.",
    story: "A broken training gate hums with old vows and simple tests.",
    storyEl: "Μια σπασμένη πύλη προπόνησης βουίζει με παλιούς όρκους και απλές δοκιμασίες.",
    visualTone: "blue iron gate",
    unlockRequirement: "Begin the journey",
    unlockRequirementEl: "Ξεκίνα το ταξίδι",
    enemyArchetypes: [
      "Imp",
      "Slime",
      "Wisp",
      "Goblin",
      "Mote",
      "Crawler",
      "Grub",
      "Gnawer",
      "Slink",
      "Murmur",
      "Drifter",
      "Pest"
    ],
    enemyArchetypesEl: [
      "Καλικάντζαρος",
      "Γλίτσα",
      "Φλόγα",
      "Γκόμπλιν",
      "Σπίθα",
      "Σέρπερ",
      "Σκουλήκι",
      "Ροκανιστής",
      "Σκιερός",
      "Ψίθυρος",
      "Πλάνης",
      "Παράσιτο"
    ],
    eliteArchetypes: [
      "Gate Brute",
      "Oath Hound",
      "Rep Warden",
      "Iron Slink",
      "Vow Reaper",
      "Threshold Knight"
    ],
    eliteArchetypesEl: [
      "Κτήνος της Πύλης",
      "Κυνηγόσκυλο Όρκου",
      "Φύλακας Επαναλήψεων",
      "Σιδερένιος Σκιερός",
      "Θεριστής Όρκων",
      "Ιππότης του Κατωφλιού"
    ],
    bosses: [
      {
        slug: "couch-titan",
        title: "The Couch Titan",
        titleEl: "Ο Τιτάνας του Καναπέ",
        description: "A heavy guardian fed by skipped sessions.",
        descriptionEl: "Βαρύς φύλακας που τρέφεται από χαμένες προπονήσεις.",
        weakness: "strength"
      },
      {
        slug: "first-gate-sentinel",
        title: "First Gate Sentinel",
        titleEl: "Φρουρός της Πρώτης Πύλης",
        description: "A silent watcher that yields only to repeated effort.",
        descriptionEl: "Σιωπηλός φρουρός που υποχωρεί μόνο μπροστά στη σταθερή προσπάθεια.",
        weakness: "strength"
      }
    ],
    chests: [
      {
        slug: "first-cache",
        title: "First Cache",
        titleEl: "Πρώτη Κρύπτη",
        description: "A modest chest with enough shine to keep moving.",
        descriptionEl: "Ένα μικρό σεντούκι με αρκετή λάμψη για να συνεχίσεις.",
        unlockCount: 2
      },
      {
        slug: "gate-coffer",
        title: "Gate Coffer",
        titleEl: "Κιβώτιο της Πύλης",
        description: "A sealed reward for clearing the entry path.",
        descriptionEl: "Σφραγισμένη ανταμοιβή για το άνοιγμα του πρώτου μονοπατιού.",
        unlockCount: 12
      }
    ]
  },
  {
    id: "region_forest",
    title: "Forest of Form",
    titleEl: "Δάσος της Τεχνικής",
    description: "A quiet realm where control matters more than haste.",
    descriptionEl: "Ήσυχο βασίλειο όπου ο έλεγχος μετρά περισσότερο από τη βιασύνη.",
    story: "Branches bend into practice rings and punish sloppy motion.",
    storyEl: "Τα κλαδιά γίνονται κρίκοι προπόνησης και τιμωρούν την άτσαλη κίνηση.",
    visualTone: "emerald shadow forest",
    unlockRequirement: "Clear the Gate of First Reps",
    unlockRequirementEl: "Καθάρισε την Πύλη των Πρώτων Επαναλήψεων",
    enemyArchetypes: [
      "Thornling",
      "Root Imp",
      "Bark Wisp",
      "Moss Gnawer",
      "Vine Pest",
      "Fern Shade",
      "Sap Grub",
      "Form Sprite",
      "Briar Crawler",
      "Leaf Slink",
      "Hush Mote",
      "Needle Bat"
    ],
    enemyArchetypesEl: [
      "Αγκαθοπλάσμα",
      "Ριζοδαίμονας",
      "Φλοιόφλογα",
      "Βρυοροκανιστής",
      "Κληματόπαράσιτο",
      "Φτεροσκιιά",
      "Ρητινοσκώληκας",
      "Ξωτικό Τεχνικής",
      "Βατοσέρπερ",
      "Φυλλοσκιερός",
      "Σιωπηλή Σπίθα",
      "Βελονονυχτερίδα"
    ],
    eliteArchetypes: [
      "Briar Captain",
      "Form Stalker",
      "Rootbound Ogre",
      "Elder Thorn",
      "Mossback Warden",
      "Green Hollow"
    ],
    eliteArchetypesEl: [
      "Αρχηγός Βάτων",
      "Διώκτης Τεχνικής",
      "Ριζωμένο Θηρίο",
      "Γέρικο Αγκάθι",
      "Βρυόπλατος Φύλακας",
      "Πράσινο Κενό"
    ],
    bosses: [
      {
        slug: "warden-of-form",
        title: "Warden of Form",
        titleEl: "Φύλακας της Τεχνικής",
        description: "It sees every rushed rep.",
        descriptionEl: "Βλέπει κάθε βιαστική επανάληψη.",
        weakness: "strength"
      },
      {
        slug: "briar-matriarch",
        title: "Briar Matriarch",
        titleEl: "Μητριάρχης των Βάτων",
        description: "A patient queen of slow, perfect tension.",
        descriptionEl: "Υπομονετική βασίλισσα της αργής, τέλειας έντασης.",
        weakness: "timed"
      }
    ],
    chests: [
      {
        slug: "moss-lockbox",
        title: "Moss Lockbox",
        titleEl: "Βρυώδες Κουτί",
        description: "Soft outside, useful inside.",
        descriptionEl: "Μαλακό απ' έξω, χρήσιμο μέσα.",
        unlockCount: 8
      },
      {
        slug: "form-cache",
        title: "Form Cache",
        titleEl: "Κρύπτη Τεχνικής",
        description: "A reward for clean movement.",
        descriptionEl: "Ανταμοιβή για καθαρή κίνηση.",
        unlockCount: 20
      },
      {
        slug: "green-vault",
        title: "Green Vault",
        titleEl: "Πράσινο Θησαυροφυλάκιο",
        description: "The forest keeps its best prize under roots.",
        descriptionEl: "Το δάσος φυλάει το καλύτερο βραβείο κάτω από ρίζες.",
        unlockCount: 36
      }
    ]
  },
  {
    id: "region_caves",
    title: "Caves of Consistency",
    titleEl: "Σπήλαια της Συνέπειας",
    description: "Dark tunnels lit by streaks that do not break.",
    descriptionEl: "Σκοτεινές στοές φωτισμένες από σερί που δεν σπάνε.",
    story: "Echoes count days, not promises.",
    storyEl: "Οι αντίλαλοι μετρούν μέρες, όχι υποσχέσεις.",
    visualTone: "violet cave torches",
    unlockRequirement: "Reach a 3-day streak",
    unlockRequirementEl: "Φτάσε σερί 3 ημερών",
    enemyArchetypes: [
      "Echo Bat",
      "Cave Wretch",
      "Stone Mote",
      "Streak Leech",
      "Drip Shade",
      "Quartz Imp",
      "Hollow Tick",
      "Grit Grub",
      "Pale Slink",
      "Lantern Wisp",
      "Deep Gnawer",
      "Tunnel Pest"
    ],
    enemyArchetypesEl: [
      "Νυχτερίδα Αντίλαλου",
      "Σπηλαιοάθλιος",
      "Πετρόσπιθα",
      "Βδέλλα Σερί",
      "Σταλαγματιά",
      "Χαλαζοδαίμονας",
      "Κούφιο Τσιμπούρι",
      "Σκουλήκι Αντοχής",
      "Ωχρός Σκιερός",
      "Φαναρόφλογα",
      "Βαθύς Ροκανιστής",
      "Παράσιτο Σήραγγας"
    ],
    eliteArchetypes: [
      "Streak Devourer",
      "Granite Stalker",
      "Deep Lantern",
      "Quartz Brute",
      "Echo Warden",
      "Cavebound Knight"
    ],
    eliteArchetypesEl: [
      "Καταβροχθιστής Σερί",
      "Γρανιτένιος Διώκτης",
      "Βαθύ Φανάρι",
      "Χαλαζιακό Κτήνος",
      "Φύλακας Αντίλαλου",
      "Ιππότης των Σπηλαίων"
    ],
    bosses: [
      {
        slug: "the-breaker-of-days",
        title: "The Breaker of Days",
        titleEl: "Ο Θραύστης των Ημερών",
        description: "It waits where streaks usually fail.",
        descriptionEl: "Περιμένει εκεί που συνήθως σπάνε τα σερί.",
        weakness: "timed"
      },
      {
        slug: "quartz-colossus",
        title: "Quartz Colossus",
        titleEl: "Χαλαζιακός Κολοσσός",
        description: "A bright wall of stubborn repetition.",
        descriptionEl: "Λαμπερός τοίχος πεισματικής επανάληψης.",
        weakness: "strength"
      }
    ],
    chests: [
      {
        slug: "echo-box",
        title: "Echo Box",
        titleEl: "Κουτί Αντίλαλου",
        description: "Every opened latch sounds like a checked day.",
        descriptionEl: "Κάθε άνοιγμα ακούγεται σαν ολοκληρωμένη μέρα.",
        unlockCount: 10
      },
      {
        slug: "streak-vault",
        title: "Streak Vault",
        titleEl: "Θησαυροφυλάκιο Σερί",
        description: "A reward for returning when it was easier not to.",
        descriptionEl: "Ανταμοιβή για την επιστροφή όταν ήταν ευκολότερο να μην πας.",
        unlockCount: 28
      }
    ]
  },
  {
    id: "region_iron",
    title: "Iron Ridge",
    titleEl: "Σιδερένια Ράχη",
    description: "A hard ascent carved by strength and patience.",
    descriptionEl: "Σκληρή ανάβαση χαραγμένη με δύναμη και υπομονή.",
    story: "The ridge answers effort with sparks.",
    storyEl: "Η ράχη απαντά στην προσπάθεια με σπινθήρες.",
    visualTone: "red iron mountain",
    unlockRequirement: "Build balanced strength",
    unlockRequirementEl: "Χτίσε ισορροπημένη δύναμη",
    enemyArchetypes: [
      "Iron Drudge",
      "Ridge Imp",
      "Anvil Mote",
      "Rust Wisp",
      "Chain Gnawer",
      "Forge Pest",
      "Plate Slink",
      "Hammer Grub",
      "Coal Shade",
      "Bolt Bat",
      "Steel Crawler",
      "Rivet Wretch"
    ],
    enemyArchetypesEl: [
      "Σιδερένιος Μόχθος",
      "Δαίμονας Ράχης",
      "Ακμοσπίθα",
      "Σκουρόφλογα",
      "Αλυσοροκανιστής",
      "Παράσιτο Σφυρηλάτησης",
      "Πλακοσκιερός",
      "Σκουλήκι Σφυριού",
      "Καρβουνοσκιά",
      "Μπουλονονυχτερίδα",
      "Ατσαλοσέρπερ",
      "Πριτσινόαθλιος"
    ],
    eliteArchetypes: [
      "Anvil Knight",
      "Chain Captain",
      "Forge Hound",
      "Ironbound Brute",
      "Ridge Warden",
      "Hammer Saint"
    ],
    eliteArchetypesEl: [
      "Ιππότης Ακμονιού",
      "Αρχηγός Αλυσίδας",
      "Κυνηγόσκυλο Σφυρηλάτησης",
      "Σιδερόδετο Κτήνος",
      "Φύλακας Ράχης",
      "Άγιος του Σφυριού"
    ],
    bosses: [
      {
        slug: "iron-gatekeeper",
        title: "The Iron Gatekeeper",
        titleEl: "Ο Σιδερένιος Φύλακας",
        description: "A locked gate that opens only to balanced strength.",
        descriptionEl: "Κλειστή πύλη που ανοίγει μόνο με ισορροπημένη δύναμη.",
        weakness: "strength"
      },
      {
        slug: "lord-of-rivets",
        title: "Lord of Rivets",
        titleEl: "Άρχοντας των Πριτσινιών",
        description: "He fastens doubt to every heavy rep.",
        descriptionEl: "Καρφώνει την αμφιβολία σε κάθε βαριά επανάληψη.",
        weakness: "strength"
      }
    ],
    chests: [
      {
        slug: "rivet-cache",
        title: "Rivet Cache",
        titleEl: "Κρύπτη Πριτσινιών",
        description: "A practical prize hammered shut.",
        descriptionEl: "Πρακτικό βραβείο σφυρηλατημένο κλειστό.",
        unlockCount: 12
      },
      {
        slug: "iron-vault",
        title: "Iron Vault",
        titleEl: "Σιδερένιο Θησαυροφυλάκιο",
        description: "The ridge stores rewards in weight.",
        descriptionEl: "Η ράχη φυλά τις ανταμοιβές σε βάρος.",
        unlockCount: 30
      },
      {
        slug: "forge-coffer",
        title: "Forge Coffer",
        titleEl: "Κιβώτιο Σφυρηλάτησης",
        description: "Still warm from the last honest set.",
        descriptionEl: "Ακόμα ζεστό από το τελευταίο τίμιο σετ.",
        unlockCount: 44
      }
    ]
  },
  {
    id: "region_plateau",
    title: "Plateau of Discipline",
    titleEl: "Οροπέδιο της Πειθαρχίας",
    description: "Progress is earned one deliberate session at a time.",
    descriptionEl: "Η πρόοδος κερδίζεται με μία συνειδητή προπόνηση κάθε φορά.",
    story: "The air is thin, the path is plain, and excuses have nowhere to hide.",
    storyEl:
      "Ο αέρας είναι λεπτός, το μονοπάτι καθαρό και οι δικαιολογίες δεν έχουν πού να κρυφτούν.",
    visualTone: "white high plateau",
    unlockRequirement: "Defeat the Iron Ridge bosses",
    unlockRequirementEl: "Νίκησε τους αρχηγούς της Σιδερένιας Ράχης",
    enemyArchetypes: [
      "Plateau Wisp",
      "Wind Mote",
      "Thin-Air Imp",
      "Vow Pest",
      "Summit Grub",
      "Pale Gnawer",
      "Discipline Shade",
      "Step Slink",
      "Frost Bat",
      "Ridge Drifter",
      "Calm Crawler",
      "Still Wretch"
    ],
    enemyArchetypesEl: [
      "Φλόγα Οροπεδίου",
      "Ανεμόσπιθα",
      "Δαίμονας Λεπτού Αέρα",
      "Παράσιτο Όρκου",
      "Σκουλήκι Κορυφής",
      "Ωχρός Ροκανιστής",
      "Σκιά Πειθαρχίας",
      "Σκιερός Βήματος",
      "Παγονυχτερίδα",
      "Πλάνης Ράχης",
      "Ήρεμος Σέρπερ",
      "Ακίνητος Άθλιος"
    ],
    eliteArchetypes: [
      "Summit Warden",
      "Oath Ascendant",
      "White Brute",
      "Stillness Knight",
      "Thin-Air Reaper",
      "Discipline Herald"
    ],
    eliteArchetypesEl: [
      "Φύλακας Κορυφής",
      "Ανερχόμενος Όρκος",
      "Λευκό Κτήνος",
      "Ιππότης Ηρεμίας",
      "Θεριστής Λεπτού Αέρα",
      "Κήρυκας Πειθαρχίας"
    ],
    bosses: [
      {
        slug: "the-quiet-plateau",
        title: "The Quiet Plateau",
        titleEl: "Το Ήσυχο Οροπέδιο",
        description: "A boss that attacks by making nothing happen.",
        descriptionEl: "Αρχηγός που επιτίθεται κάνοντας το τίποτα να μοιάζει αρκετό.",
        weakness: "timed"
      },
      {
        slug: "discipline-king",
        title: "Discipline King",
        titleEl: "Βασιλιάς της Πειθαρχίας",
        description: "A ruler of small repeated choices.",
        descriptionEl: "Άρχοντας των μικρών επαναλαμβανόμενων επιλογών.",
        weakness: "cardio"
      }
    ],
    chests: [
      {
        slug: "summit-chest",
        title: "Summit Chest",
        titleEl: "Σεντούκι Κορυφής",
        description: "Opened by showing up again.",
        descriptionEl: "Ανοίγει όταν εμφανίζεσαι ξανά.",
        unlockCount: 15
      },
      {
        slug: "discipline-vault",
        title: "Discipline Vault",
        titleEl: "Θησαυροφυλάκιο Πειθαρχίας",
        description: "Plain, heavy, valuable.",
        descriptionEl: "Απλό, βαρύ, πολύτιμο.",
        unlockCount: 34
      }
    ]
  },
  {
    id: "region_storm",
    title: "Citadel of the Repbound",
    titleEl: "Ακρόπολη του Repbound",
    description: "The final fortress where strength, pace, and discipline converge.",
    descriptionEl: "Το τελικό οχυρό όπου δύναμη, ρυθμός και πειθαρχία συναντιούνται.",
    story: "High walls echo with every rep that brought the hero here.",
    storyEl: "Ψηλά τείχη αντηχούν κάθε επανάληψη που έφερε τον ήρωα ως εδώ.",
    visualTone: "citadel",
    unlockRequirement: "Open the Plateau discipline vault",
    unlockRequirementEl: "Άνοιξε το θησαυροφυλάκιο πειθαρχίας του Οροπεδίου",
    enemyArchetypes: [
      "Road Phantom",
      "Storm Wisp",
      "Pace Imp",
      "Rain Mote",
      "Stride Pest",
      "Thunder Grub",
      "Distance Shade",
      "Wind Gnawer",
      "Drizzle Bat",
      "Tempo Slink",
      "Cloud Crawler",
      "Mile Wretch"
    ],
    enemyArchetypesEl: [
      "Φάντασμα Δρόμου",
      "Καταιγιδοφλόγα",
      "Δαίμονας Ρυθμού",
      "Βροχοσπίθα",
      "Παράσιτο Βήματος",
      "Σκουλήκι Βροντής",
      "Σκιά Απόστασης",
      "Ανεμοροκανιστής",
      "Ψιχαλονυχτερίδα",
      "Σκιερός Τέμπο",
      "Νεφοσέρπερ",
      "Άθλιος Μιλίου"
    ],
    eliteArchetypes: [
      "Pace Reaper",
      "Storm Captain",
      "Road Warden",
      "Tempo Knight",
      "Thunder Brute",
      "Rain Herald"
    ],
    eliteArchetypesEl: [
      "Θεριστής Ρυθμού",
      "Αρχηγός Καταιγίδας",
      "Φύλακας Δρόμου",
      "Ιππότης Τέμπο",
      "Βροντερό Κτήνος",
      "Κήρυκας Βροχής"
    ],
    bosses: [
      {
        slug: "lord-of-the-long-road",
        title: "Lord of the Long Road",
        titleEl: "Άρχοντας του Μακρινού Δρόμου",
        description: "It only respects distance honestly covered.",
        descriptionEl: "Σέβεται μόνο την απόσταση που καλύφθηκε τίμια.",
        weakness: "cardio"
      },
      {
        slug: "storm-heart",
        title: "Storm Heart",
        titleEl: "Καρδιά της Καταιγίδας",
        description: "A pulse of wind, rain, and stubborn pace.",
        descriptionEl: "Παλμός από άνεμο, βροχή και πεισματικό ρυθμό.",
        weakness: "cardio"
      }
    ],
    chests: [
      {
        slug: "roadside-cache",
        title: "Roadside Cache",
        titleEl: "Κρύπτη στην Άκρη του Δρόμου",
        description: "A reward found between breaths.",
        descriptionEl: "Ανταμοιβή που βρέθηκε ανάμεσα σε ανάσες.",
        unlockCount: 10
      },
      {
        slug: "storm-coffer",
        title: "Storm Coffer",
        titleEl: "Κιβώτιο Καταιγίδας",
        description: "Crackling with distance earned.",
        descriptionEl: "Τρίζει από κερδισμένη απόσταση.",
        unlockCount: 26
      },
      {
        slug: "horizon-vault",
        title: "Horizon Vault",
        titleEl: "Θησαυροφυλάκιο Ορίζοντα",
        description: "The road hides its best reward at the far edge.",
        descriptionEl: "Ο δρόμος κρύβει την καλύτερη ανταμοιβή στην άκρη του ορίζοντα.",
        unlockCount: 42
      }
    ]
  }
];

const getHitTemplate = (realmIndex: number, enemyIndex: number): HitTemplate => {
  const template = (realmIndex + enemyIndex) % 5;
  if (template === 1) {
    return {
      activitySlug: "squats",
      metric: "reps" as const,
      requiredValue: 10 + (enemyIndex % 5) * 2,
      label: "Squats",
      labelEl: "Καθίσματα"
    };
  }
  if (template === 2) {
    return {
      activitySlug: "pull-ups",
      metric: "reps" as const,
      requiredValue: 5 + (enemyIndex % 4),
      label: "Pull-ups",
      labelEl: "Έλξεις"
    };
  }
  if (template === 3) {
    return {
      activityType: "timed" as const,
      metric: "seconds" as const,
      requiredValue: 30 + (enemyIndex % 4) * 15,
      label: "Timed Exercise",
      labelEl: "Χρονική άσκηση"
    };
  }
  if (template === 4) {
    return {
      activitySlug: "treadmill",
      activityType: "cardio" as const,
      metric: "distanceMeters" as const,
      requiredValue: 300 + (enemyIndex % 5) * 100,
      label: "Treadmill",
      labelEl: "Διάδρομος"
    };
  }
  return {
    activitySlug: "push-ups",
    metric: "reps" as const,
    requiredValue: 5 + (enemyIndex % 6) * 2,
    label: "Push-ups",
    labelEl: "Κάμψεις"
  };
};

const baseDamageFor = (metric: AdventureHitMetric, value: number) => {
  if (metric === "seconds") {
    return Math.floor(value / 10);
  }
  if (metric === "distanceMeters") {
    return Math.floor(value / 100);
  }
  return value;
};

const displayFor = (metric: AdventureHitMetric, value: number, label: string) => {
  if (metric === "distanceMeters") {
    return `${value} m ${label}`;
  }
  if (metric === "seconds") {
    return `${value} sec ${label}`;
  }
  return `${value} ${label}`;
};

const enemyName = (realm: RealmSeed, index: number) => {
  const archetypeIndex = index % realm.enemyArchetypes.length;
  const adjectiveIndex = (index * 5 + archetypeIndex) % adjectives.length;
  const titleIndex = Math.floor(index / realm.enemyArchetypes.length) % titles.length;
  const pattern = index % 4;
  if (pattern === 0) {
    return {
      en: `${adjectives[adjectiveIndex]} ${realm.enemyArchetypes[archetypeIndex]}`,
      el: `${adjectivesEl[adjectiveIndex]} ${realm.enemyArchetypesEl[archetypeIndex]}`
    };
  }
  if (pattern === 1) {
    return {
      en: `${realm.enemyArchetypes[archetypeIndex]} ${titles[titleIndex]}`,
      el: `${realm.enemyArchetypesEl[archetypeIndex]} ${titlesEl[titleIndex]}`
    };
  }
  if (pattern === 2) {
    return {
      en: `${adjectives[adjectiveIndex]} ${realm.enemyArchetypes[archetypeIndex]} ${titles[titleIndex]}`,
      el: `${adjectivesEl[adjectiveIndex]} ${realm.enemyArchetypesEl[archetypeIndex]} ${titlesEl[titleIndex]}`
    };
  }
  return {
    en: `${realm.enemyArchetypes[archetypeIndex]} Veteran`,
    el: `${realm.enemyArchetypesEl[archetypeIndex]} Βετεράνος`
  };
};

export const buildAdventureContent = () => {
  const regions: AdventureRegion[] = [];
  const mobs: AdventureMob[] = [];
  const requirements: AdventureMobRequirement[] = [];
  const hitRequirements: AdventureHitRequirement[] = [];
  const bosses: AdventureBoss[] = [];
  const chests: AdventureChest[] = [];

  REALM_SEEDS.forEach((realm, realmIndex) => {
    const primaryBossId = `boss_${realm.bosses[0]?.slug ?? realm.id}`;
    regions.push({
      id: realm.id,
      title: realm.title,
      description: realm.description,
      story: realm.story,
      visualTone: realm.visualTone,
      unlockRequirement: realm.unlockRequirement,
      status: realmIndex === 0 ? "unlocked" : "locked",
      isUnlocked: realmIndex === 0,
      progress: 0,
      bossId: primaryBossId
    });

    for (let index = 0; index < 52; index += 1) {
      const level = realmIndex * 10 + index + 1;
      const name =
        index === 0 && realm.id === "region_gate"
          ? { en: "Slime of Excuses", el: "Γλίτσα των Δικαιολογιών" }
          : enemyName(realm, index);
      const id =
        index === 0 && realm.id === "region_gate"
          ? "mob_slime_excuses"
          : `mob_${realm.id}_${index + 1}`;
      const slug =
        index === 0 && realm.id === "region_gate"
          ? "slime-of-excuses"
          : `${realm.id.replace("region_", "")}-enemy-${index + 1}`;
      const hit = getHitTemplate(realmIndex, index);
      const requiredValue = index === 0 && realm.id === "region_gate" ? 10 : hit.requiredValue;
      const maxHP = index === 0 && realm.id === "region_gate" ? 10 : 18 + level * 3;
      mobs.push({
        id,
        slug,
        title: name.en,
        titleEl: name.el,
        description: `A ${realm.visualTone} foe testing your next honest hit.`,
        descriptionEl: `Εχθρός του βασιλείου που δοκιμάζει το επόμενο τίμιο χτύπημά σου.`,
        realmId: realm.id,
        enemyType: "normal",
        level,
        maxHP,
        currentHP: maxHP,
        attackPower: 2 + realmIndex + Math.floor(index / 8),
        weakness: hit.activityType ?? (hit.metric === "seconds" ? "timed" : "strength"),
        status: realmIndex === 0 ? "available" : "locked",
        rewardXP: 12 + level,
        rewardSkillPoints: index % 20 === 0 ? 1 : 0,
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt
      });
      requirements.push({
        id: `req_${id}`,
        mobId: id,
        ...(hit.activitySlug ? { activitySlug: hit.activitySlug } : {}),
        ...(hit.activityType ? { activityType: hit.activityType } : {}),
        metric: hit.metric,
        requiredValue: maxHP,
        currentValue: 0,
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt
      });
      hitRequirements.push({
        id: `hit_${id}`,
        enemyId: id,
        ...(hit.activitySlug ? { activitySlug: hit.activitySlug } : {}),
        ...(hit.activityType ? { activityType: hit.activityType } : {}),
        metric: hit.metric,
        requiredValue,
        baseDamageValue: baseDamageFor(hit.metric, requiredValue),
        displayLabel: displayFor(hit.metric, requiredValue, hit.label),
        displayLabelEl: displayFor(hit.metric, requiredValue, hit.labelEl)
      });
    }

    realm.eliteArchetypes.forEach((elite, index) => {
      const level = realmIndex * 10 + 60 + index;
      const id = `elite_${realm.id}_${index + 1}`;
      const hit = getHitTemplate(realmIndex, index + 60);
      const maxHP = 95 + level * 4;
      mobs.push({
        id,
        slug: `${realm.id.replace("region_", "")}-elite-${index + 1}`,
        title: elite,
        titleEl: realm.eliteArchetypesEl[index] ?? elite,
        description: `An elite guardian of ${realm.title}.`,
        descriptionEl: `Ελίτ φύλακας του βασιλείου ${realm.titleEl}.`,
        realmId: realm.id,
        enemyType: "elite",
        level,
        maxHP,
        currentHP: maxHP,
        attackPower: 7 + realmIndex + index,
        weakness: hit.activityType ?? (hit.metric === "distanceMeters" ? "cardio" : "strength"),
        status: realmIndex === 0 ? "available" : "locked",
        rewardXP: 55 + level,
        rewardSkillPoints: 1,
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt
      });
      requirements.push({
        id: `req_${id}`,
        mobId: id,
        ...(hit.activitySlug ? { activitySlug: hit.activitySlug } : {}),
        ...(hit.activityType ? { activityType: hit.activityType } : {}),
        metric: hit.metric,
        requiredValue: maxHP,
        currentValue: 0,
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt
      });
      hitRequirements.push({
        id: `hit_${id}`,
        enemyId: id,
        ...(hit.activitySlug ? { activitySlug: hit.activitySlug } : {}),
        ...(hit.activityType ? { activityType: hit.activityType } : {}),
        metric: hit.metric,
        requiredValue: hit.requiredValue,
        baseDamageValue: baseDamageFor(hit.metric, hit.requiredValue),
        displayLabel: displayFor(hit.metric, hit.requiredValue, hit.label),
        displayLabelEl: displayFor(hit.metric, hit.requiredValue, hit.labelEl)
      });
    });

    realm.bosses.forEach((boss, index) => {
      const level = realmIndex * 10 + 80 + index;
      const maxHP = 180 + realmIndex * 60 + index * 50;
      bosses.push({
        id: `boss_${boss.slug}`,
        slug: boss.slug,
        title: boss.title,
        titleEl: boss.titleEl,
        description: boss.description,
        descriptionEl: boss.descriptionEl,
        regionId: realm.id,
        status: "locked",
        level,
        maxHP,
        currentHP: maxHP,
        attackPower: 12 + realmIndex * 2 + index * 3,
        weakness: boss.weakness,
        unlockRequirement: index === 0 ? "Open the first chest" : "Defeat the first boss",
        defeatRequirement: "Win this battle in the Battle View",
        defeatProgress: 0,
        defeatTarget: maxHP,
        rewardXP: 140 + realmIndex * 35 + index * 60,
        rewardSkillPoints: 1 + index,
        rewardBadgeSlug: boss.slug,
        updatedAt: seedCreatedAt
      });
      const hit = getHitTemplate(realmIndex, index + 80);
      hitRequirements.push({
        id: `hit_boss_${boss.slug}`,
        enemyId: `boss_${boss.slug}`,
        ...(hit.activitySlug ? { activitySlug: hit.activitySlug } : {}),
        ...(hit.activityType ? { activityType: hit.activityType } : {}),
        metric: hit.metric,
        requiredValue: hit.requiredValue,
        baseDamageValue: baseDamageFor(hit.metric, hit.requiredValue),
        displayLabel: displayFor(hit.metric, hit.requiredValue, hit.label),
        displayLabelEl: displayFor(hit.metric, hit.requiredValue, hit.labelEl)
      });
    });

    realm.chests.forEach((chest, index) => {
      chests.push({
        id: `chest_${realm.id}_${index + 1}`,
        slug: chest.slug,
        title: chest.title,
        titleEl: chest.titleEl,
        description: chest.description,
        descriptionEl: chest.descriptionEl,
        realmId: realm.id,
        status: "locked",
        unlockRequirement: `Defeat ${chest.unlockCount} enemies in this realm`,
        unlockRequirementEl: `Νίκησε ${chest.unlockCount} εχθρούς σε αυτό το βασίλειο`,
        unlockCount: chest.unlockCount,
        rewardXP: 35 + realmIndex * 10 + index * 15,
        rewardSkillPoints: index === realm.chests.length - 1 ? 1 : 0,
        createdAt: seedCreatedAt,
        updatedAt: seedCreatedAt
      });
    });
  });

  return { regions, mobs, requirements, hitRequirements, bosses, chests };
};
