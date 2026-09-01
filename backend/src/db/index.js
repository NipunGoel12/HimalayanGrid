const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || "./data/hlg.sqlite";
const resolvedPath = path.resolve(process.cwd(), DB_PATH);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

// --- Guarded migration for databases created before the Explorer/gamification
// columns existed on `students` (CREATE TABLE IF NOT EXISTS won't add columns
// to an already-existing table, so we check and ALTER as needed). ---
function migrateStudentsTable() {
  const cols = db.prepare("PRAGMA table_info(students)").all().map((c) => c.name);
  const add = (name, ddl) => {
    if (!cols.includes(name)) db.exec(`ALTER TABLE students ADD COLUMN ${ddl}`);
  };
  add("xp", "xp INTEGER NOT NULL DEFAULT 0");
  add("badges", "badges TEXT NOT NULL DEFAULT '[]'");
  add("streak", "streak INTEGER NOT NULL DEFAULT 0");
  add("last_active_date", "last_active_date TEXT");
}
migrateStudentsTable();

function seedIfEmpty() {
  const studentCount = db.prepare("SELECT COUNT(*) AS c FROM students").get().c;
  if (studentCount > 0) return;

  const now = Date.now();

  db.prepare(
    `INSERT INTO students (id, name, grade, language, village, avatar, weak_topics, updated_at, version)
     VALUES (@id, @name, @grade, @language, @village, @avatar, @weak_topics, @updated_at, 1)`
  ).run({
    id: "std-001",
    name: "Tenzin Dolma",
    grade: 7,
    language: "Hindi",
    village: "Lachen, North Sikkim",
    avatar: "🏔️",
    weak_topics: JSON.stringify(["Fractions", "Water Cycle"]),
    updated_at: now,
  });

  const lessons = [
    {
      id: "lsn-fractions", subject: "Mathematics", title: "Understanding Fractions",
      language: "Hindi", grade: 7, size_mb: 4, weak_topic: "Fractions",
      new_curriculum: 0, mission_related: 0, cached: 1,
      sections: [
        { heading: "क्या है भिन्न? (What is a Fraction?)", body: "एक भिन्न किसी पूरी वस्तु के एक भाग को दर्शाती है। उदाहरण: यदि एक रोटी को 4 बराबर भागों में बाँटा जाए, तो हर भाग 1/4 (एक-चौथाई) कहलाता है।" },
        { heading: "Adding Fractions", body: "To add fractions with the same denominator, add the numerators and keep the denominator unchanged: 1/4 + 2/4 = 3/4." },
        { heading: "Mountain Example", body: "If a herder divides a yak-wool blanket into 5 equal strips and uses 2 strips for a jacket, they have used 2/5 of the blanket." },
      ],
    },
    {
      id: "lsn-watercycle", subject: "Science", title: "The Water Cycle in the Himalayas",
      language: "Hindi", grade: 7, size_mb: 6, weak_topic: "Water Cycle",
      new_curriculum: 0, mission_related: 0, cached: 1,
      sections: [
        { heading: "Glacial Melt", body: "Himalayan glaciers store frozen water that slowly melts in summer, feeding rivers such as the Teesta and the Brahmaputra." },
        { heading: "Evaporation & Condensation", body: "Sun-warmed river water evaporates, rises, cools into clouds over the peaks, and falls again as snow — closing the cycle." },
        { heading: "Why It Matters", body: "Villages downstream depend on this cycle for drinking water, irrigation, and hydropower." },
      ],
    },
    {
      id: "lsn-geography", subject: "Geography", title: "Reading a Contour Map",
      language: "English", grade: 7, size_mb: 3, weak_topic: null,
      new_curriculum: 0, mission_related: 1, cached: 1,
      sections: [
        { heading: "Contour Lines", body: "Each line on a contour map connects points of equal elevation. Closely spaced lines mean a steep slope." },
        { heading: "Practice", body: "Look at the Mountain Mission map — count how many contour lines you cross between the village and the ridge." },
      ],
    },
    {
      id: "lsn-newvideo", subject: "English", title: "Spoken English: Everyday Phrases",
      language: "English", grade: 7, size_mb: 12, weak_topic: null,
      new_curriculum: 1, mission_related: 0, cached: 0,
      sections: [{ heading: "Greetings", body: "Practice common greetings and classroom phrases used by students across the region." }],
    },
    {
      id: "lsn-hugevideo", subject: "Media", title: "Cultural Documentary: Festivals of Sikkim",
      language: "English", grade: 7, size_mb: 300, weak_topic: null,
      new_curriculum: 0, mission_related: 0, cached: 0,
      sections: [{ heading: "Note", body: "A large, low-priority video package used to demonstrate the Smart Priority Engine skipping low-value large files." }],
    },
  ];
  const insertLesson = db.prepare(
    `INSERT INTO lessons (id, subject, title, language, grade, size_mb, weak_topic, new_curriculum, mission_related, cached, sections)
     VALUES (@id, @subject, @title, @language, @grade, @size_mb, @weak_topic, @new_curriculum, @mission_related, @cached, @sections)`
  );
  lessons.forEach((l) => insertLesson.run({ ...l, sections: JSON.stringify(l.sections) }));

  const quizBank = [
    { topic: "Fractions", question: "1/4 + 2/4 = ?", options: ["2/8", "3/4", "3/8", "1/2"], correct: 1 },
    { topic: "Fractions", question: "Which fraction is larger?", options: ["1/3", "1/5", "1/8", "1/10"], correct: 0 },
    { topic: "Fractions", question: "A blanket cut into 5 strips; 2 used. Fraction used?", options: ["2/3", "3/5", "2/5", "5/2"], correct: 2 },
    { topic: "Water Cycle", question: "What feeds Himalayan rivers in summer?", options: ["Rainfall only", "Glacial melt", "Sea water", "Groundwater only"], correct: 1 },
    { topic: "Water Cycle", question: "Water vapor cools into clouds through:", options: ["Evaporation", "Condensation", "Erosion", "Precipitation only"], correct: 1 },
    { topic: "Water Cycle", question: "The water cycle is best described as:", options: ["A one-way flow", "A repeating cycle", "A random process", "A man-made system"], correct: 1 },
    { topic: "Contour Map", question: "Closely spaced contour lines mean:", options: ["A flat area", "A steep slope", "A river", "Nothing"], correct: 1 },
  ];
  const insertQ = db.prepare(
    `INSERT INTO quiz_questions (id, topic, question, options, correct_index) VALUES (?, ?, ?, ?, ?)`
  );
  quizBank.forEach((q, i) => insertQ.run(`qz-${i + 1}`, q.topic, q.question, JSON.stringify(q.options), q.correct));

  const catalog = [
    { id: "pkg-hindi-fractions", name: "Hindi Fractions — Practice Pack", subject: "Mathematics", language: "Hindi", size_mb: 4, topic: "Fractions", new_curriculum: 0, mission_related: 0 },
    { id: "pkg-mountain-mission", name: "Understand Your Mountain — Terrain Pack", subject: "Geography", language: "English", size_mb: 9, topic: null, new_curriculum: 0, mission_related: 1 },
    { id: "pkg-english-video", name: "Spoken English: Everyday Phrases", subject: "English", language: "English", size_mb: 12, topic: null, new_curriculum: 1, mission_related: 0 },
    { id: "pkg-huge-video", name: "Cultural Documentary: Festivals of Sikkim", subject: "Media", language: "English", size_mb: 300, topic: null, new_curriculum: 0, mission_related: 0 },
    { id: "pkg-watercycle-deep", name: "Water Cycle — Deep Dive", subject: "Science", language: "Hindi", size_mb: 5, topic: "Water Cycle", new_curriculum: 0, mission_related: 0 },
  ];
  const insertPkg = db.prepare(
    `INSERT INTO content_catalog (id, name, subject, language, size_mb, topic, new_curriculum, mission_related)
     VALUES (@id, @name, @subject, @language, @size_mb, @topic, @new_curriculum, @mission_related)`
  );
  catalog.forEach((p) => insertPkg.run(p));

  db.prepare(
    `INSERT INTO teacher_requests (id, teacher_name, topic, package_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run("tr-1", "Ms. Pema Bhutia", "Fractions", null, "Please prioritize Fractions for Class 7.", now);

  console.log(`[db] Seeded fresh database at ${resolvedPath}`);
}

// --- Explorer content: topics + missions. Seeded independently of the main
// seedIfEmpty() gate above so they populate even on a database that was
// created before this content model existed. ---
function seedTopicsAndMissions() {
  const topicCount = db.prepare("SELECT COUNT(*) AS c FROM topics").get().c;
  if (topicCount === 0) {
    const q = (question, options, correctIndex) => ({ question, options, correctIndex });
    const topics = [
      {
        id: "topic-everest", title: "Mount Everest", category: "mountains", region: "Nepal", subject: "Geography",
        grade: 6, difficulty: "easy", icon: "🏔️", color: "#2f6f6b", map_x: 78, map_y: 30,
        fact: "Mount Everest is the highest mountain above sea level on Earth.",
        description: "Mount Everest rises 8,849 meters above sea level on the border of Nepal and Tibet. Its Nepali name is Sagarmatha and its Tibetan name is Chomolungma, meaning 'Goddess Mother of the World'.",
        quiz: [
          q("What is Mount Everest's height above sea level?", ["About 6,000 m", "About 7,500 m", "About 8,849 m", "About 10,000 m"], 2),
          q("Everest sits on the border of Nepal and which region?", ["Sikkim", "Tibet", "Bhutan", "Ladakh"], 1),
          q("What does 'Sagarmatha' mean?", ["Snow Queen", "Forehead of the Sky", "Great Peak", "River Source"], 1),
        ],
        mission_id: "mission-mountain",
      },
      {
        id: "topic-kanchenjunga", title: "Kanchenjunga", category: "mountains", region: "Sikkim", subject: "Geography",
        grade: 6, difficulty: "easy", icon: "⛰️", color: "#2f6f6b", map_x: 68, map_y: 26,
        fact: "Kanchenjunga is the world's third-highest mountain and Sikkim's guardian peak.",
        description: "At 8,586 meters, Kanchenjunga straddles the border of Sikkim and Nepal. Local communities consider it sacred, and climbers traditionally stop just short of the true summit out of respect.",
        quiz: [
          q("Kanchenjunga is the world's ___ highest mountain.", ["First", "Second", "Third", "Fifth"], 2),
          q("Kanchenjunga lies on the border of Nepal and which Indian state?", ["Sikkim", "Ladakh", "Himachal Pradesh", "Uttarakhand"], 0),
          q("Why do many climbers stop short of the true summit?", ["It is too icy", "Out of respect for local beliefs", "It is forbidden by law", "Lack of oxygen"], 1),
        ],
        mission_id: "mission-mountain",
      },
      {
        id: "topic-ladakh-geo", title: "Ladakh's High-Altitude Desert", category: "mountains", region: "Ladakh", subject: "Geography",
        grade: 7, difficulty: "medium", icon: "🏜️", color: "#2f6f6b", map_x: 25, map_y: 18,
        fact: "Ladakh is a cold desert — high, dry, and surrounded by mountains.",
        description: "Ladakh sits in the rain shadow of the Himalayas, so very little monsoon rain reaches it. Despite the dryness, glacier-fed streams support farming villages in the valleys.",
        quiz: [
          q("Why does Ladakh get so little rain?", ["It is too cold for rain", "It sits in the Himalayan rain shadow", "It has no clouds", "It is below sea level"], 1),
          q("What kind of landscape best describes Ladakh?", ["Tropical rainforest", "Cold desert", "Swampland", "Coastal plain"], 1),
          q("What water source supports Ladakhi farming?", ["Ocean currents", "Glacier-fed streams", "Deep wells only", "Rainwater tanks"], 1),
        ],
        mission_id: "mission-mountain",
      },
      {
        id: "topic-brahmaputra", title: "Brahmaputra River", category: "rivers", region: "Arunachal Pradesh", subject: "Geography",
        grade: 6, difficulty: "easy", icon: "🌊", color: "#2a6fb0", map_x: 82, map_y: 45,
        fact: "The Brahmaputra is one of the few major rivers named after a male figure.",
        description: "Starting in Tibet, the Brahmaputra flows through Arunachal Pradesh and Assam before joining the Ganga delta. It carries huge amounts of sediment from the mountains, shaping the plains below.",
        quiz: [
          q("Where does the Brahmaputra begin?", ["Sikkim", "Tibet", "Bay of Bengal", "Ladakh"], 1),
          q("Which Indian states does it flow through?", ["Kerala and Goa", "Arunachal Pradesh and Assam", "Punjab and Haryana", "Gujarat and Rajasthan"], 1),
          q("What does the river carry that shapes the plains?", ["Salt", "Sediment", "Ice", "Oil"], 1),
        ],
        mission_id: "mission-river",
      },
      {
        id: "topic-ganga", title: "Ganga River", category: "rivers", region: "Uttarakhand", subject: "Geography",
        grade: 6, difficulty: "easy", icon: "💧", color: "#2a6fb0", map_x: 48, map_y: 42,
        fact: "The Ganga begins at Gangotri glacier, high in the Himalayas.",
        description: "The Ganga originates at the Gangotri glacier in Uttarakhand and flows over 2,500 km across northern India. Millions of people depend on it for drinking water, farming and culture.",
        quiz: [
          q("Where does the Ganga originate?", ["Gangotri glacier", "Bay of Bengal", "Kanchenjunga", "A man-made dam"], 0),
          q("Roughly how long is the Ganga's course?", ["250 km", "2,500 km", "25,000 km", "10 km"], 1),
          q("What do communities along the Ganga depend on it for?", ["Only fishing", "Drinking water, farming and culture", "Nothing important", "Electricity only"], 1),
        ],
        mission_id: "mission-river",
      },
      {
        id: "topic-glaciers", title: "Himalayan Glaciers", category: "science", region: "Himachal Pradesh", subject: "Science",
        grade: 7, difficulty: "medium", icon: "🧊", color: "#6a5acd", map_x: 40, map_y: 22,
        fact: "Himalayan glaciers store more fresh water than anywhere outside the polar ice caps.",
        description: "Glaciers form over centuries as snow compresses into ice. They slowly melt through summer, feeding the rivers that millions of people rely on downstream.",
        quiz: [
          q("How do glaciers form?", ["Rainwater freezing overnight", "Snow compressing into ice over long periods", "Rivers freezing in winter", "Volcanic activity"], 1),
          q("When do glaciers release the most meltwater?", ["Winter", "Summer", "Only during earthquakes", "Never"], 1),
          q("Why do glaciers matter to people downstream?", ["They feed rivers people depend on", "They block roads", "They cause no effect", "They only affect wildlife"], 0),
        ],
        mission_id: "mission-climate",
      },
      {
        id: "topic-mountain-formation", title: "How Mountains Form", category: "science", region: "Himalayan region", subject: "Science",
        grade: 7, difficulty: "medium", icon: "🌋", color: "#6a5acd", map_x: 55, map_y: 20,
        fact: "The Himalayas are still growing a few millimeters every year.",
        description: "The Himalayas formed when the Indian tectonic plate collided with the Eurasian plate millions of years ago, pushing the land upward. That collision hasn't stopped — the range keeps slowly rising.",
        quiz: [
          q("What formed the Himalayas?", ["A volcano", "Collision of the Indian and Eurasian plates", "A meteor impact", "Wind erosion"], 1),
          q("Are the Himalayas still changing?", ["No, they stopped long ago", "Yes, they are still slowly rising", "They are shrinking every year", "They only change during earthquakes"], 1),
          q("This kind of mountain formation is called:", ["Volcanic formation", "Tectonic collision", "Erosion formation", "Glacial formation"], 1),
        ],
        mission_id: "mission-climate",
      },
      {
        id: "topic-climate", title: "Himalayan Climate & Weather", category: "weather", region: "Himalayan region", subject: "Science",
        grade: 6, difficulty: "easy", icon: "🌦️", color: "#c98a2f", map_x: 60, map_y: 34,
        fact: "The Himalayas can have four seasons in a single day as altitude changes.",
        description: "Because the range spans huge changes in elevation, weather varies enormously — from subtropical valleys to permanently snow-capped peaks only a few kilometers away.",
        quiz: [
          q("Why does Himalayan weather vary so much over short distances?", ["Random chance", "Large changes in elevation", "It never changes", "Ocean currents"], 1),
          q("What can you find near the base of many Himalayan valleys?", ["Subtropical plants", "Coral reefs", "Deserts only", "Permanent ice"], 0),
          q("What typically exists at the highest elevations?", ["Rainforests", "Permanent snow and ice", "Sandy beaches", "Farmland"], 1),
        ],
        mission_id: "mission-climate",
      },
      {
        id: "topic-avalanches", title: "Avalanches", category: "weather", region: "Himachal Pradesh", subject: "Science",
        grade: 7, difficulty: "medium", icon: "❄️", color: "#c98a2f", map_x: 38, map_y: 28,
        fact: "Most avalanches happen on slopes between 30 and 45 degrees.",
        description: "An avalanche is a sudden slide of snow down a mountainside, often triggered by fresh snowfall, warming temperatures, or vibration. Mountain communities watch weather closely to stay safe.",
        quiz: [
          q("What is an avalanche?", ["A sudden slide of snow down a slope", "A type of glacier", "A river flood", "A kind of cloud"], 0),
          q("What can trigger an avalanche?", ["Fresh snowfall or warming temperatures", "Clear skies only", "Low altitude", "Ocean tides"], 0),
          q("On what kind of slope are avalanches most common?", ["Completely flat ground", "Slopes between 30-45 degrees", "Underwater slopes", "Sand dunes"], 1),
        ],
        mission_id: "mission-climate",
      },
      {
        id: "topic-snowleopard", title: "Snow Leopard", category: "animals", region: "Ladakh", subject: "Environment",
        grade: 6, difficulty: "easy", icon: "🐆", color: "#b0562a", map_x: 22, map_y: 22,
        fact: "Snow leopards are sometimes called 'ghosts of the mountains' because they are so rarely seen.",
        description: "Snow leopards live in the high, rocky mountains of Ladakh and beyond. Their thick fur and long tails help them survive the cold and keep balance on steep terrain. They are an endangered species.",
        quiz: [
          q("Why are snow leopards called 'ghosts of the mountains'?", ["They are rarely seen", "They are transparent", "They only come out at midnight", "They live underground"], 0),
          q("What helps a snow leopard balance on steep terrain?", ["Its long tail", "Its short legs", "Its small ears", "Its light color"], 0),
          q("What is the snow leopard's conservation status?", ["Not at risk", "Endangered", "Extinct", "Overpopulated"], 1),
        ],
        mission_id: "mission-wildlife",
      },
      {
        id: "topic-redpanda", title: "Red Panda", category: "animals", region: "Sikkim", subject: "Environment",
        grade: 6, difficulty: "easy", icon: "🐾", color: "#b0562a", map_x: 66, map_y: 30,
        fact: "The red panda is Sikkim's state animal and mostly eats bamboo.",
        description: "Red pandas live in the temperate forests of the eastern Himalayas, including Sikkim. Despite the name, they are not closely related to giant pandas — they have their own family branch.",
        quiz: [
          q("What is the red panda's main food?", ["Fish", "Bamboo", "Meat", "Fruit only"], 1),
          q("Which state considers the red panda its state animal?", ["Sikkim", "Punjab", "Kerala", "Gujarat"], 0),
          q("Are red pandas closely related to giant pandas?", ["Yes, very closely", "No, they have their own family branch", "They are the same species", "No relation to bears at all"], 1),
        ],
        mission_id: "mission-wildlife",
      },
      {
        id: "topic-monal", title: "Himalayan Monal", category: "animals", region: "Uttarakhand", subject: "Environment",
        grade: 6, difficulty: "easy", icon: "🦚", color: "#b0562a", map_x: 50, map_y: 32,
        fact: "The Himalayan monal is Uttarakhand's state bird, known for its rainbow-colored feathers.",
        description: "The male Himalayan monal has iridescent feathers that shimmer green, blue and copper in the light. It lives in high-altitude forests and grasslands across the Himalayas.",
        quiz: [
          q("What is special about the male monal's feathers?", ["They are plain brown", "They shimmer with rainbow colors", "They are transparent", "They glow at night"], 1),
          q("The Himalayan monal is the state bird of:", ["Sikkim", "Uttarakhand", "Ladakh", "Punjab"], 1),
          q("Where does the monal typically live?", ["Ocean coastlines", "High-altitude forests and grasslands", "Deserts", "Underground burrows"], 1),
        ],
        mission_id: "mission-wildlife",
      },
      {
        id: "topic-ghnp", title: "Great Himalayan National Park", category: "forests", region: "Himachal Pradesh", subject: "Environment",
        grade: 7, difficulty: "medium", icon: "🌲", color: "#3f8f5b", map_x: 36, map_y: 24,
        fact: "Great Himalayan National Park is a UNESCO World Heritage Site protecting rare alpine wildlife.",
        description: "This park protects forests and alpine meadows that are home to snow leopards, musk deer and hundreds of bird species. It became a UNESCO World Heritage Site in 2014.",
        quiz: [
          q("What international recognition does this park have?", ["UNESCO World Heritage Site", "None", "National monument only", "UN Peacekeeping zone"], 0),
          q("What kind of habitat does the park protect?", ["Coral reefs", "Forests and alpine meadows", "Deserts", "Mangroves"], 1),
          q("In what year did it become a World Heritage Site?", ["1990", "2005", "2014", "2020"], 2),
        ],
        mission_id: null,
      },
      {
        id: "topic-valleyofflowers", title: "Valley of Flowers", category: "forests", region: "Uttarakhand", subject: "Environment",
        grade: 6, difficulty: "easy", icon: "🌸", color: "#3f8f5b", map_x: 46, map_y: 26,
        fact: "The Valley of Flowers bursts into hundreds of colors each monsoon season.",
        description: "This high-altitude valley in Uttarakhand fills with wildflowers every monsoon. It's a UNESCO World Heritage Site and home to rare species found almost nowhere else.",
        quiz: [
          q("When does the Valley of Flowers bloom most?", ["Winter", "Monsoon season", "Never", "Only at night"], 1),
          q("What UNESCO status does it hold?", ["World Heritage Site", "None", "Endangered City", "Capital region"], 0),
          q("What makes some of its species notable?", ["They are common everywhere", "They are found almost nowhere else", "They are all imported", "They only grow underwater"], 1),
        ],
        mission_id: null,
      },
      {
        id: "topic-silkroute", title: "Ancient Silk Route", category: "history", region: "Ladakh", subject: "History",
        grade: 7, difficulty: "medium", icon: "🐫", color: "#8a5a2f", map_x: 20, map_y: 15,
        fact: "Trade routes through Ladakh once connected India, Tibet and Central Asia.",
        description: "For centuries, traders carried silk, salt, wool and spices along mountain routes through Ladakh, linking South Asia with Central Asia. Towns like Leh grew wealthy as trading posts.",
        quiz: [
          q("What did traders carry along these mountain routes?", ["Silk, salt, wool and spices", "Only gold", "Machinery", "Modern electronics"], 0),
          q("Which town grew wealthy as a trading post?", ["Leh", "Mumbai", "Chennai", "Kolkata"], 0),
          q("What regions did these routes connect?", ["South Asia and Central Asia", "Africa and Europe", "Australia and Asia", "North and South America"], 0),
        ],
        mission_id: "mission-history",
      },
      {
        id: "topic-rumtek", title: "Rumtek Monastery", category: "history", region: "Sikkim", subject: "History",
        grade: 7, difficulty: "medium", icon: "🏯", color: "#8a5a2f", map_x: 70, map_y: 28,
        fact: "Rumtek Monastery is one of the largest monasteries in Sikkim, rebuilt in the 1960s.",
        description: "Rumtek Monastery near Gangtok is an important center of Tibetan Buddhism. It was rebuilt in the 1960s to reflect the original monastery in Tibet, preserving centuries of religious and artistic tradition.",
        quiz: [
          q("What tradition is Rumtek Monastery an important center for?", ["Tibetan Buddhism", "Ancient trade", "Modern science", "Colonial history"], 0),
          q("When was the current monastery built?", ["1800s", "1960s", "2010s", "1500s"], 1),
          q("Near which city is Rumtek Monastery located?", ["Gangtok", "Leh", "Shimla", "Dehradun"], 0),
        ],
        mission_id: "mission-history",
      },
      {
        id: "topic-sikkimculture", title: "Sikkim's Living Culture", category: "culture", region: "Sikkim", subject: "Culture",
        grade: 6, difficulty: "easy", icon: "🎭", color: "#c04f7a", map_x: 72, map_y: 24,
        fact: "Sikkim is home to Lepcha, Bhutia and Nepali communities, each with distinct traditions.",
        description: "Sikkim's culture blends Lepcha, Bhutia and Nepali traditions — visible in its festivals, language, food and architecture. Losoong and Saga Dawa are among its most celebrated festivals.",
        quiz: [
          q("Which communities shape Sikkim's culture?", ["Lepcha, Bhutia and Nepali", "Only one single community", "Punjabi and Gujarati", "Tamil and Telugu"], 0),
          q("Name a festival celebrated in Sikkim.", ["Losoong", "Diwali only", "Christmas only", "Onam"], 0),
          q("What aspects of life reflect Sikkim's mixed culture?", ["Festivals, language, food and architecture", "Only clothing", "Nothing visible", "Only sports"], 0),
        ],
        mission_id: "mission-culture",
      },
      {
        id: "topic-hemis", title: "Hemis Festival, Ladakh", category: "culture", region: "Ladakh", subject: "Culture",
        grade: 6, difficulty: "easy", icon: "🎉", color: "#c04f7a", map_x: 24, map_y: 20,
        fact: "The Hemis Festival features colorful masked dances performed by monks.",
        description: "Held at Hemis Monastery, this festival celebrates the birth of Guru Padmasambhava with masked 'Cham' dances, music and elaborate costumes — a highlight of Ladakh's cultural calendar.",
        quiz: [
          q("What kind of dances are performed at the Hemis Festival?", ["Masked 'Cham' dances", "Ballet", "Modern hip-hop", "No dancing at all"], 0),
          q("Where is the festival held?", ["Hemis Monastery", "A stadium", "A beach", "A shopping mall"], 0),
          q("Whose birth does the festival celebrate?", ["Guru Padmasambhava", "A king", "A modern leader", "No one specific"], 0),
        ],
        mission_id: "mission-culture",
      },
      {
        id: "topic-hanle", title: "Stargazing at Hanle", category: "space", region: "Ladakh", subject: "Science",
        grade: 7, difficulty: "medium", icon: "🌌", color: "#3a3a7a", map_x: 28, map_y: 16,
        fact: "Hanle in Ladakh hosts one of the world's highest astronomical observatories.",
        description: "Hanle's high altitude, dry air and dark skies make it ideal for observing the stars. It's home to the Indian Astronomical Observatory and one of Asia's first official 'Dark Sky Reserves'.",
        quiz: [
          q("Why is Hanle good for astronomy?", ["High altitude, dry air and dark skies", "It is near a big city", "It has constant cloud cover", "It is at sea level"], 0),
          q("What is Hanle home to?", ["The Indian Astronomical Observatory", "A large airport", "A film studio", "A ski resort"], 0),
          q("What special designation has the region received?", ["A Dark Sky Reserve", "A national capital", "A trade port", "A rainforest reserve"], 0),
        ],
        mission_id: "mission-space",
      },
      {
        id: "topic-satellite", title: "How Satellites Help Mountain Communities", category: "satellites", region: "Remote villages", subject: "Satellite",
        grade: 7, difficulty: "medium", icon: "🛰️", color: "#2a5aa0", map_x: 85, map_y: 15,
        fact: "Satellites can deliver weather warnings and learning content to villages with no ground internet.",
        description: "In remote Himalayan regions, satellites can relay weather alerts, connect emergency services, and deliver learning content to local hubs — even where cables and towers can't reach.",
        quiz: [
          q("What can satellites deliver to remote villages?", ["Weather alerts and learning content", "Nothing useful", "Only television shows", "Only military data"], 0),
          q("Why are satellites useful where cables can't reach?", ["They work from space, above the terrain", "They are cheaper than everything else", "They don't need any equipment", "They only work in cities"], 0),
          q("In this project, what receives the satellite's content first?", ["A student's phone directly", "The local learning hub", "A random village", "Nothing, it goes to a satellite dish only"], 1),
        ],
        mission_id: "mission-satellite",
      },
    ];

    const insertTopic = db.prepare(
      `INSERT INTO topics (id, title, category, region, subject, grade, difficulty, icon, color, map_x, map_y, fact, description, quiz, offline_available, mission_id)
       VALUES (@id, @title, @category, @region, @subject, @grade, @difficulty, @icon, @color, @map_x, @map_y, @fact, @description, @quiz, 1, @mission_id)`
    );
    topics.forEach((t) => insertTopic.run({ ...t, quiz: JSON.stringify(t.quiz), mission_id: t.mission_id || null }));

    const missions = [
      { id: "mission-mountain", title: "Mountain Explorer", icon: "🏔️", description: "Learn about 3 Himalayan mountains.", category: "mountains", target_count: 3, xp_reward: 60, badge_id: "badge-mountain-explorer", badge_name: "Mountain Explorer", badge_icon: "🏔️" },
      { id: "mission-river", title: "River Detective", icon: "🌊", description: "Identify and learn 2 major Himalayan rivers.", category: "rivers", target_count: 2, xp_reward: 50, badge_id: "badge-river-detective", badge_name: "River Detective", badge_icon: "🌊" },
      { id: "mission-wildlife", title: "Wildlife Guardian", icon: "🐆", description: "Discover 3 Himalayan animals.", category: "animals", target_count: 3, xp_reward: 60, badge_id: "badge-wildlife-guardian", badge_name: "Wildlife Guardian", badge_icon: "🐆" },
      { id: "mission-history", title: "History Explorer", icon: "📜", description: "Discover 2 historical Himalayan places.", category: "history", target_count: 2, xp_reward: 50, badge_id: "badge-history-explorer", badge_name: "History Explorer", badge_icon: "📜" },
      { id: "mission-culture", title: "Culture Keeper", icon: "🎭", description: "Learn about 2 Himalayan cultural traditions.", category: "culture", target_count: 2, xp_reward: 50, badge_id: "badge-culture-keeper", badge_name: "Culture Keeper", badge_icon: "🎭" },
      { id: "mission-climate", title: "Climate Guardian", icon: "🧊", description: "Complete the glacier, mountain formation, climate and avalanche topics.", category: "science-weather", target_count: 4, xp_reward: 70, badge_id: "badge-climate-guardian", badge_name: "Climate Guardian", badge_icon: "🧊" },
      { id: "mission-space", title: "Stargazer", icon: "🌌", description: "Discover how the Himalayas connect to astronomy.", category: "space", target_count: 1, xp_reward: 30, badge_id: "badge-stargazer", badge_name: "Stargazer", badge_icon: "🌌" },
      { id: "mission-satellite", title: "Satellite Scientist", icon: "🛰️", description: "Learn how satellites help mountain communities.", category: "satellites", target_count: 1, xp_reward: 40, badge_id: "badge-satellite-scientist", badge_name: "Satellite Scientist", badge_icon: "🛰️" },
    ];
    const insertMission = db.prepare(
      `INSERT INTO missions (id, title, icon, description, category, target_count, xp_reward, badge_id, badge_name, badge_icon)
       VALUES (@id, @title, @icon, @description, @category, @target_count, @xp_reward, @badge_id, @badge_name, @badge_icon)`
    );
    missions.forEach((m) => insertMission.run(m));

    console.log(`[db] Seeded ${topics.length} topics and ${missions.length} missions.`);
  }
}
seedTopicsAndMissions();

seedIfEmpty();

if (require.main === module && process.argv.includes("--seed-only")) {
  console.log("[db] Seed check complete.");
  process.exit(0);
}

module.exports = db;
