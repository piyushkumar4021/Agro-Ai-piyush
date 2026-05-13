/**
 * Static reference data used for charts and AI prediction display cards.
 * No longer used as API fallbacks — all real data comes from MongoDB.
 */

export const STATES = [
  'Andhra Pradesh','Assam','Bihar','Gujarat','Haryana','Himachal Pradesh',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','NCT of Delhi',
  'Nagaland','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

// Used in BuyerDashboard overview "Fresh Listings" preview (static placeholders)
export const CROPS = [
  { id:1, name:'Wheat',    price:2340, qty:500, grade:'A', farmer:'Ramesh Kumar',  location:'Ludhiana, Punjab',    category:'grains'     },
  { id:2, name:'Tomato',   price:850,  qty:200, grade:'B', farmer:'Suresh Patel',  location:'Nasik, Gujarat',      category:'vegetables' },
  { id:3, name:'Rice',     price:3200, qty:800, grade:'A', farmer:'Anand Singh',   location:'Patna, Bihar',        category:'grains'     },
  { id:4, name:'Onion',    price:1200, qty:300, grade:'A', farmer:'Suresh Patel',  location:'Nasik, Gujarat',      category:'vegetables' },
  { id:5, name:'Mustard',  price:5200, qty:250, grade:'A', farmer:'Mohan Das',     location:'Jaipur, Rajasthan',   category:'others'     },
  { id:6, name:'Turmeric', price:9800, qty:100, grade:'A', farmer:'Priya Nair',    location:'Erode, Tamil Nadu',   category:'spices'     },
];

// Used in AI Predictions tabs (static demo forecast cards)
export const AI_PREDICTIONS = [
  { crop:'Wheat',   current:'₹2,340/Qtl', predicted:'₹2,620/Qtl', trend:'up',   confidence:94 },
  { crop:'Tomato',  current:'₹850/Qtl',   predicted:'₹780/Qtl',   trend:'down', confidence:87 },
  { crop:'Rice',    current:'₹3,200/Qtl', predicted:'₹3,100/Qtl', trend:'down', confidence:79 },
  { crop:'Onion',   current:'₹1,200/Qtl', predicted:'₹1,050/Qtl', trend:'down', confidence:82 },
  { crop:'Mustard', current:'₹5,200/Qtl', predicted:'₹5,600/Qtl', trend:'up',   confidence:91 },
  { crop:'Maize',   current:'₹1,950/Qtl', predicted:'₹2,100/Qtl', trend:'up',   confidence:76 },
];
