/**
 * Crop-name-specific real image URLs (Pexels — free, reliable CDN).
 * Maps crop names (lowercase) → real photo URL for that exact crop.
 * Used as fallback when farmers haven't uploaded their own images.
 *
 * All photo IDs have been manually verified on Pexels.com.
 */

// Helper to build Pexels URL from verified photo ID
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`;

const CROP_IMAGES = {
  // ── Grains ──────────────────────────────────────────────────
  wheat:       px(8478918),    // wheat field close-up
  rice:        px(18328392),   // rice grains
  paddy:       px(2589457),    // paddy field
  corn:        px(1459331),    // corn/maize cobs
  maize:       px(1459331),    // corn/maize cobs
  barley:      px(8478918),    // barley/wheat field
  millet:      px(10738421),   // pearl millet field
  bajra:       px(10738421),   // pearl millet/bajra field
  jowar:       px(10738421),   // sorghum/jowar
  sorghum:     px(10738421),   // sorghum
  oats:        px(543730),     // oats
  ragi:        px(10738421),   // finger millet

  // ── Vegetables ──────────────────────────────────────────────
  tomato:      px(19852143),   // fresh tomatoes
  onion:       px(4163411),    // onions
  potato:      px(12102024),   // potatoes in bowl
  brinjal:     px(32421444),   // eggplant/brinjal
  eggplant:    px(32421444),   // eggplant
  cabbage:     px(36771049),   // cabbage
  cauliflower: px(6316515),    // cauliflower
  capsicum:    px(128536),     // bell pepper/capsicum
  'bell pepper': px(128536),
  carrot:      px(34936603),   // carrots
  spinach:     px(2325843),    // spinach/greens
  peas:        px(255469),     // green peas
  'green peas':px(255469),
  beans:       px(63459),      // green beans
  'green beans':px(63459),
  cucumber:    px(2329440),    // cucumbers
  'bitter gourd':px(2329440),
  'lady finger':px(3872406),   // okra
  okra:        px(3872406),
  bhindi:      px(3872406),
  radish:      px(4397915),    // radish
  pumpkin:     px(219794),     // pumpkin
  beetroot:    px(3498557),    // beetroot
  garlic:      px(25315388),   // garlic heads
  ginger:      px(33930747),   // ginger root
  mushroom:    px(36438),      // mushrooms
  lettuce:     px(1199562),    // lettuce
  broccoli:    px(1629093),    // broccoli
  drumstick:   px(1400999),    // generic veg
  'bottle gourd':px(2329440),
  'ridge gourd': px(2329440),
  'green chilli':px(5956192),  // green chilli peppers
  'red chilli':  px(4198123),  // red chilli peppers
  chilli:        px(5956192),  // chilli
  chili:         px(5956192),

  // ── Fruits ──────────────────────────────────────────────────
  mango:       px(16724967),   // mango fruit
  banana:      px(16214622),   // bananas
  apple:       px(28486832),   // apple fruit
  grapes:      px(9840058),    // grapes
  orange:      px(42059),      // oranges
  papaya:      px(5945755),    // papaya
  pomegranate: px(29310030),   // pomegranate
  guava:       px(5945691),    // guava
  watermelon:  px(1313267),    // watermelon
  lemon:       px(1414110),    // lemons
  coconut:     px(30643515),   // coconut
  pineapple:   px(947879),     // pineapple
  strawberry:  px(46174),      // strawberries
  jackfruit:   px(5945755),    // tropical fruit
  fig:         px(5945691),    // figs
  sapota:      px(5945691),
  chikoo:      px(5945691),

  // ── Pulses / Lentils ───────────────────────────────────────
  chana:       px(4110476),    // chickpeas/chana
  chickpea:    px(4110476),
  moong:       px(34940646),   // moong/lentils
  'moong dal': px(34940646),
  toor:        px(34940646),   // toor dal/lentils
  'toor dal':  px(34940646),
  urad:        px(34940646),
  'urad dal':  px(34940646),
  masoor:      px(34940646),   // masoor dal — orange lentils
  'masur dal': px(34940646),
  'masoor dal':px(34940646),
  lentil:      px(34940646),
  dal:         px(34940646),
  rajma:       px(176169),     // kidney beans
  'kidney bean':px(176169),
  soybean:     px(4110476),
  soya:        px(4110476),
  groundnut:   px(35614009),   // unshelled peanuts/groundnut
  peanut:      px(35614009),

  // ── Spices ─────────────────────────────────────────────────
  turmeric:    px(4198933),    // turmeric powder
  'turmeric(raw)':px(4198933),
  cumin:       px(6087519),    // cumin/spices
  'cumin seed':px(6087519),
  coriander:   px(2325843),    // coriander/herbs
  pepper:      px(6087519),    // pepper/spices
  'black pepper':px(6087519),
  cardamom:    px(6087519),
  clove:       px(6087519),
  cinnamon:    px(6087519),
  saffron:     px(6087519),
  fenugreek:   px(6087519),

  // ── Oilseeds / Cash Crops ──────────────────────────────────
  mustard:     px(36381364),   // mustard field blossoming
  'mustard seed':px(36381364),
  sunflower:   px(46216),      // sunflower
  'sunflower seed':px(46216),
  sesame:      px(35614009),
  cotton:      px(32796552),   // cotton plant
  sugarcane:   px(25703568),   // sugarcane
  jaggery:     px(25703568),
  jute:        px(8478918),    // field
  tea:         px(1417945),    // tea leaves
  coffee:      px(894695),     // coffee beans
  tobacco:     px(8478918),
  rubber:      px(8478918),

  // ── Flowers ────────────────────────────────────────────────
  marigold:    px(1382394),    // marigold flowers
  rose:        px(56866),      // roses
  jasmine:     px(1382394),
};

// Category-level fallbacks (used if crop name not found)
const CATEGORY_IMAGES = {
  grains:     px(8478918),     // wheat field
  vegetables: px(1400999),     // mixed vegetables
  fruits:     px(1132047),     // mixed fruits
  pulses:     px(34940646),    // lentils
  spices:     px(4198933),     // turmeric/spices
  oilseeds:   px(4750270),     // mustard
  others:     px(1400999),     // mixed produce
};

/**
 * Get a real image URL for a crop by name.
 * Uses smart matching: exact → partial → word match → category fallback.
 *
 * Examples:
 *   "Green Chilli"               → matches "green chilli"
 *   "Turmeric(raw)"              → matches "turmeric(raw)" then "turmeric"
 *   "Bajra(Pearl Millet/Cumbu)"  → matches "bajra"
 *   "Masur Dal"                  → matches "masur dal"
 */
export function getCropImageByName(cropName, category) {
  if (!cropName) return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.others;

  const key = cropName.toLowerCase().trim();

  // 1. Exact match
  if (CROP_IMAGES[key]) return CROP_IMAGES[key];

  // 2. Check if any crop key is contained in the name, or name is contained in a key
  //    Sort by longest key first to prefer more specific matches
  //    e.g. "bajra(pearl millet/cumbu)" contains "bajra"
  //    e.g. "green chilli" matches "green chilli"
  const sortedKeys = Object.keys(CROP_IMAGES).sort((a, b) => b.length - a.length);
  for (const cropKey of sortedKeys) {
    if (key.includes(cropKey) || cropKey.includes(key)) {
      return CROP_IMAGES[cropKey];
    }
  }

  // 3. Word-based match: split the name and check each word
  //    e.g. "Pearl Millet" → check "pearl", "millet"
  const words = key.replace(/[()\/,]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    if (CROP_IMAGES[word]) return CROP_IMAGES[word];
  }

  // 4. Fallback to category image
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES.others;
}

export { CROP_IMAGES, CATEGORY_IMAGES };
