// Categories students can label in the Field Camera, with built-in words in
// several languages so labelling works fully OFFLINE. Any other language can be
// typed in (e.g. "Ladakhi", "Japanese") and is translated by the AI when online.

export const CATEGORIES = [
  { id: "person",   icon: "🧑", color: "#F472B6" },
  { id: "tree",     icon: "🌳", color: "#22C55E" },
  { id: "plant",    icon: "🌿", color: "#4ADE80" },
  { id: "flower",   icon: "🌸", color: "#FB7185" },
  { id: "mountain", icon: "🏔️", color: "#94A3B8" },
  { id: "snow",     icon: "❄️", color: "#7DD3FC" },
  { id: "river",    icon: "🏞️", color: "#38BDF8" },
  { id: "sky",      icon: "🌤️", color: "#60A5FA" },
  { id: "cloud",    icon: "☁️", color: "#CBD5E1" },
  { id: "house",    icon: "🏠", color: "#F59E0B" },
  { id: "road",     icon: "🛣️", color: "#A8A29E" },
  { id: "bridge",   icon: "🌉", color: "#FB923C" },
  { id: "field",    icon: "🌾", color: "#EAB308" },
  { id: "animal",   icon: "🐐", color: "#C084FC" },
  { id: "vehicle",  icon: "🚗", color: "#F87171" },
  { id: "rock",     icon: "🪨", color: "#78716C" },
  { id: "other",    icon: "📍", color: "#38BDF8" },
];

// speech = BCP-47 tag for the browser's text-to-speech voice.
export const LANGUAGES = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "ne", name: "Nepali", native: "नेपाली", speech: "ne-NP" },
  { code: "bn", name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "ur", name: "Urdu", native: "اردو", speech: "ur-PK", rtl: true },
  { code: "bo", name: "Tibetan (Ladakhi script)", native: "བོད་ཡིག", speech: "bo", basic: true },
];

export const WORDS = {
  en: { person: "Person", tree: "Tree", plant: "Plant", flower: "Flower", mountain: "Mountain", snow: "Snow", river: "River", sky: "Sky", cloud: "Cloud", house: "House", road: "Road", bridge: "Bridge", field: "Field", animal: "Animal", vehicle: "Vehicle", rock: "Rock", other: "Other" },
  hi: { person: "व्यक्ति", tree: "पेड़", plant: "पौधा", flower: "फूल", mountain: "पहाड़", snow: "बर्फ़", river: "नदी", sky: "आसमान", cloud: "बादल", house: "घर", road: "सड़क", bridge: "पुल", field: "खेत", animal: "जानवर", vehicle: "गाड़ी", rock: "चट्टान", other: "अन्य" },
  ne: { person: "मान्छे", tree: "रूख", plant: "बिरुवा", flower: "फूल", mountain: "पहाड", snow: "हिउँ", river: "नदी", sky: "आकाश", cloud: "बादल", house: "घर", road: "सडक", bridge: "पुल", field: "खेत", animal: "जनावर", vehicle: "गाडी", rock: "चट्टान", other: "अन्य" },
  bn: { person: "মানুষ", tree: "গাছ", plant: "উদ্ভিদ", flower: "ফুল", mountain: "পাহাড়", snow: "বরফ", river: "নদী", sky: "আকাশ", cloud: "মেঘ", house: "বাড়ি", road: "রাস্তা", bridge: "সেতু", field: "মাঠ", animal: "প্রাণী", vehicle: "গাড়ি", rock: "পাথর", other: "অন্যান্য" },
  ur: { person: "شخص", tree: "درخت", plant: "پودا", flower: "پھول", mountain: "پہاڑ", snow: "برف", river: "دریا", sky: "آسمان", cloud: "بادل", house: "گھر", road: "سڑک", bridge: "پل", field: "کھیت", animal: "جانور", vehicle: "گاڑی", rock: "چٹان", other: "دیگر" },
  // Common words only — a local speaker/teacher should confirm these.
  bo: { person: "མི", tree: "ཤིང་", flower: "མེ་ཏོག", mountain: "རི", snow: "གངས", river: "ཆུ་བོ", sky: "ནམ་མཁའ", cloud: "སྤྲིན", house: "ཁང་པ", road: "ལམ", bridge: "ཟམ་པ", field: "ཞིང་", animal: "སྲོག་ཆགས", vehicle: "རླངས་འཁོར", rock: "རྡོ" },
};

export const langKey = (lang) => (lang.custom ? `custom:${lang.name.trim().toLowerCase()}` : lang.code);
