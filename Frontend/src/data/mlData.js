// ML model supported values
export const ML_STATES = [
  'Rajasthan','Uttar Pradesh','Madhya Pradesh','Assam','Gujarat',
  'Tamil Nadu','Haryana','Kerala','Punjab','Odisha','Uttarakhand',
  'West Bengal','Andhra Pradesh','Tripura','Telangana','Himachal Pradesh',
  'Manipur','Jammu and Kashmir','NCT of Delhi','Nagaland','Bihar',
];

export const ML_DISTRICTS = [
  'Jodhpur','Saharanpur','Badwani','Nagaon','Prayagraj','Shivpuri','Khandwa',
  'Sibsagar','Kamrup','Barpeta','Dhemaji','Sonitpur','Patan','Dharmapuri',
  'Salem','Vellore','Thanjavur','Pudukkottai','Nagapattinam','Karur','Mewat',
  'Tenkasi','Palwal','Kannur','Palakad','Fazilka','Rayagada','Faridkot',
  'Kapurthala','Moga','Patiala','Jaipur','Udhamsinghnagar','Hooghly',
  'Medinipur(E)','Chittor','Panipat','Pathankot','Gurdaspur','Coimbatore',
  'Jaisalmer','Pratapgarh','Puruliya','Unokoti','Sepahijala','Ludhiana',
  'Adilabad','Khammam','Kottayam','Medak','Thiruvannamalai','Karimnagar',
  'Bhiwani','Nellore','Nanital','Haridwar','Mahendragarh-Narnaul','Sundergarh',
  'Jalandhar','Hanumangarh','Ganganagar','Amritsar','Hoshiarpur','Ropar (Rupnagar)',
  'Boudh','Sambalpur','Dhenkanal','Sangrur','Junagarh','Bhatinda','Rajkot',
  'Morbi','North Tripura','Mandi','Aligarh','Barabanki','Bahraich','Fatehpur',
  'Ferozpur','Sambhal','Vadodara(Baroda)','Ambala','Thiruvananthapuram',
  'Yamuna Nagar','Fatehabad','Rewari','Rohtak','Wayanad','Ernakulam',
  'Kozhikode(Calicut)','Alappuzha','Thirssur','Bulandshahar','Hathras',
  'Mayurbhanja','Balrampur','Shravasti','Sounth 24 Parganas','Bikaner',
  'Kangra','Darjeeling','Banaskanth','Anand','Mehsana','Valsad','Erode',
  'Una','Jhargram','Namakkal','Thiruchirappalli','Ariyalur','Navsari',
  'Cuttack','Jind','Raebarelli','Ghazipur','Shamli','Khiri (Lakhimpur)',
  'Agra','Bareilly','Badaun','Amroha','Bhadrak','Cuddalore','Kancheepuram',
  'Krishnagiri','Madurai','The Nilgiris','Perambalur','Ramanathapuram',
  'Sivaganga','Theni','Thirunelveli','Thiruvarur','Tuticorin','Villupuram',
  'Virudhunagar','Nagercoil (Kannyiakumari)','Chengalpattu','Kallakuruchi',
  'Ranipet','Thirupathur','Thirupur','Jaipur Rural','Kasargod','Kurukshetra',
  'Imphal East','Bargarh','Khowai','Chamba','Jammu','Kullu','Jalore',
  'Dehradoon','Mohali','Sabarkantha','Sonipat','Faridabad','Gurgaon','Hissar',
  'Ganjam','Amreli','Delhi','Mau(Maunathbhanjan)','Kollam','Idukki',
  'Panchkula','Tsemenyu','Wokha','Surendranagar','Churu',
  'Bhadradri Kothagudem','Surat','Tarntaran','Kohima','Gomati','Kaithal',
  'Chittorgarh','Maharajganj','Etawah','Jagatsinghpur','Sant Kabir Nagar',
  'East Godavari','Samastipur','Bolangir','Hamirpur','Mahbubnagar','Narmada',
  'Kachchh','Gir Somnath','Murshidabad','Jodhpur Rural','Kalahandi','Guntur',
  'Malappuram','Dungarpur','Deeg','Nayagarh','Rohtas','Dindigul',
  'Pathanamthitta','Ahmedabad','Karnal','Sitapur','Annamayya','Rajsamand',
  'Dahod','Beawar','Jhunjhunu','Anantapur','Sirsa',
];

export const ML_COMMODITIES = [
  'Beetroot','Bottle gourd','Cabbage','Cucumbar(Kheera)','Ginger(Green)',
  'Pumpkin','Field Pea','Green Chilli','Lemon','Kinnow','Sponge gourd',
  'Potato','White Pumpkin','Spinach','Banana','Peas Wet',
  'Green Gram Dal(Moong Dal)','Turmeric(raw)','Mustard Oil','Bitter gourd',
  'Capsicum','Cauliflower','French Beans(Frasbean)','Onion','Brinjal',
  'Castor Seed','Cummin Seed(Jeera)','Arhar(Tur/Red Gram)(Whole)',
  'Coriander(Leaves)','Cowpea(Veg)','Onion Green','Garlic','Chikoos(Sapota)',
  'Papaya','Beans','Thondekai','Green Avare(W)','Indian Beans(Seam)','Carrot',
  'Banana - Green','Drumstick','Yam(Ratalu)','Colacasia','Cluster beans',
  'Ashgourd','Tapioca','Mango(Raw-Ripe)','Chow Chow','Maize','Guava',
  'Paddy(Common)','Coconut Seed','Black pepper','Cowpea(Lobia/Karamani)',
  'Kabuli Chana(Chickpeas-White)','Amaranthus','Bengal Gram(Gram)(Whole)',
  'Black Gram(Urd Beans)(Whole)','Tomato','Apple','Pineapple','Pomegranate',
  'Squash(Chappal Kadoo)','Mint(Pudina)','Rice','Betal Leaves','Water Melon',
  'Raddish','Bhindi(Ladies Finger)','Coconut','Sweet Potato','Wheat',
  'Masur Dal','Fish','Cotton','Snakeguard','Mousambi(Sweet Lime)','Grapes',
  'Orange','Groundnut','Corriander seed','Bajra(Pearl Millet/Cumbu)',
  'Ridgeguard(Tori)','Lime','Paddy(Basmati)','Rubber',
  'Elephant Yam(Suran)/Amorphophallus','Duster Beans','Long Melon(Kakri)',
  'Ber(Zizyphus/Borehannu)','Mustard','Methi(Leaves)','Pointed gourd(Parval)',
  'Knool Khol','Tender Coconut','Amla(Nelli Kai)','Custard Apple(Sharifa)',
  'Turnip','Green Gram(Moong)(Whole)','Sweet Corn','Papaya(Raw)','Green Peas',
  'Mashrooms','Tamarind Fruit','Marigold(Calcutta)','Jack Fruit','Soyabean',
  'Karbuja(Musk Melon)','Coconut Oil','Black Gram Dal(Urd Dal)',
  'Little gourd(Kundru)','Sesamum(Sesame,Gingelly,Til)','Dry Chillies',
  'Wheat Atta','Maida Atta','Beaten Rice','Arecanut(Betelnut/Supari)','Coffee',
  'Gur(Jaggery)','Ginger(Dry)','Guar Seed(Cluster Beans Seed)','Tinda',
  'Chili Red','Cardamoms','Jute','Round gourd','Lentil(Masur)(Whole)',
  'Arhar Dal(Tur Dal)','Guar','Groundnut(Split)','Kulthi(Horse Gram)',
  'Jowar(Sorghum)','Sugar','Copra','Rajgir','Millets','Cashewnuts',
  'Soanf','Carnation','Rose(Loose))','Jasmine',
];

// ── State → District mapping ──────────────────────────────────────────────
// Maps each ML state to its respective districts from the ML_DISTRICTS list.
export const STATE_DISTRICT_MAP = {
  'Rajasthan': [
    'Jodhpur','Jaipur','Jaisalmer','Bikaner','Hanumangarh','Ganganagar',
    'Pratapgarh','Jaipur Rural','Jalore','Churu','Chittorgarh','Dungarpur',
    'Deeg','Beawar','Jhunjhunu','Rajsamand','Jodhpur Rural',
  ],
  'Uttar Pradesh': [
    'Saharanpur','Prayagraj','Aligarh','Barabanki','Bahraich','Fatehpur',
    'Sambhal','Bulandshahar','Hathras','Balrampur','Shravasti','Raebarelli',
    'Ghazipur','Shamli','Khiri (Lakhimpur)','Agra','Bareilly','Badaun',
    'Amroha','Maharajganj','Etawah','Sant Kabir Nagar','Sitapur',
    'Mau(Maunathbhanjan)',
  ],
  'Madhya Pradesh': [
    'Badwani','Shivpuri','Khandwa',
  ],
  'Assam': [
    'Nagaon','Sibsagar','Kamrup','Barpeta','Dhemaji','Sonitpur',
  ],
  'Gujarat': [
    'Patan','Junagarh','Rajkot','Morbi','Vadodara(Baroda)','Banaskanth',
    'Anand','Mehsana','Valsad','Navsari','Sabarkantha','Amreli',
    'Surendranagar','Surat','Narmada','Kachchh','Gir Somnath','Ahmedabad',
    'Dahod',
  ],
  'Tamil Nadu': [
    'Dharmapuri','Salem','Vellore','Thanjavur','Pudukkottai','Nagapattinam',
    'Karur','Tenkasi','Coimbatore','Thiruvannamalai','Erode','Namakkal',
    'Thiruchirappalli','Ariyalur','Cuddalore','Kancheepuram','Krishnagiri',
    'Madurai','The Nilgiris','Perambalur','Ramanathapuram','Sivaganga',
    'Theni','Thirunelveli','Thiruvarur','Tuticorin','Villupuram',
    'Virudhunagar','Nagercoil (Kannyiakumari)','Chengalpattu','Kallakuruchi',
    'Ranipet','Thirupathur','Thirupur','Dindigul',
  ],
  'Haryana': [
    'Mewat','Palwal','Panipat','Bhiwani','Mahendragarh-Narnaul','Ambala',
    'Yamuna Nagar','Fatehabad','Rewari','Rohtak','Jind','Sonipat',
    'Faridabad','Gurgaon','Hissar','Kurukshetra','Kaithal','Karnal',
    'Panchkula','Sirsa',
  ],
  'Kerala': [
    'Kannur','Palakad','Kottayam','Thiruvananthapuram','Wayanad','Ernakulam',
    'Kozhikode(Calicut)','Alappuzha','Thirssur','Kasargod','Kollam','Idukki',
    'Malappuram','Pathanamthitta',
  ],
  'Punjab': [
    'Fazilka','Faridkot','Kapurthala','Moga','Patiala','Ludhiana',
    'Jalandhar','Amritsar','Hoshiarpur','Ropar (Rupnagar)','Sangrur',
    'Bhatinda','Ferozpur','Pathankot','Gurdaspur','Mohali','Tarntaran',
  ],
  'Odisha': [
    'Rayagada','Sundergarh','Boudh','Sambalpur','Dhenkanal','Mayurbhanja',
    'Cuttack','Bhadrak','Ganjam','Bargarh','Jagatsinghpur','Bolangir',
    'Kalahandi','Nayagarh',
  ],
  'Uttarakhand': [
    'Udhamsinghnagar','Nanital','Haridwar','Dehradoon',
  ],
  'West Bengal': [
    'Hooghly','Medinipur(E)','Puruliya','Sounth 24 Parganas','Darjeeling',
    'Jhargram','Murshidabad',
  ],
  'Andhra Pradesh': [
    'Chittor','Nellore','East Godavari','Guntur','Annamayya','Anantapur',
  ],
  'Tripura': [
    'Unokoti','Sepahijala','North Tripura','Khowai','Gomati',
  ],
  'Telangana': [
    'Adilabad','Khammam','Medak','Karimnagar','Bhadradri Kothagudem',
    'Mahbubnagar',
  ],
  'Himachal Pradesh': [
    'Mandi','Kangra','Una','Chamba','Kullu','Hamirpur',
  ],
  'Manipur': [
    'Imphal East',
  ],
  'Jammu and Kashmir': [
    'Jammu',
  ],
  'NCT of Delhi': [
    'Delhi',
  ],
  'Nagaland': [
    'Tsemenyu','Wokha','Kohima',
  ],
  'Bihar': [
    'Samastipur','Rohtas',
  ],
};

// ── All Indian states (for Registration / Settings) ───────────────────────
export const ALL_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu and Kashmir','NCT of Delhi',
];

// ── Comprehensive State → District mapping for all Indian states ──────────
export const ALL_STATE_DISTRICT_MAP = {
  ...STATE_DISTRICT_MAP,
  'Arunachal Pradesh': ['Tawang','West Kameng','East Kameng','Papum Pare','Kurung Kumey','Lower Subansiri','Upper Subansiri','West Siang','East Siang','Upper Siang','Changlang','Tirap','Lohit','Namsai','Anjaw','Dibang Valley','Lower Dibang Valley','Longding','Kra Daadi','Siang','Pakke Kessang','Lepa Rada','Shi Yomi','Kamle'],
  'Chhattisgarh': ['Raipur','Bilaspur','Durg','Rajnandgaon','Korba','Janjgir-Champa','Raigarh','Surguja','Bastar','Jagdalpur','Dhamtari','Mahasamund','Kanker','Kawardha','Koriya','Jashpur','Narayanpur','Bijapur','Dantewada','Sukma','Kondagaon','Balod','Bemetara','Baloda Bazar','Mungeli','Surajpur','Gariaband','Gaurela-Pendra-Marwahi'],
  'Goa': ['North Goa','South Goa'],
  'Jharkhand': ['Ranchi','Dhanbad','Jamshedpur','Bokaro','Deoghar','Hazaribagh','Giridih','Dumka','Palamu','Godda','Sahebganj','Pakur','Jamtara','Ramgarh','Chatra','Koderma','Khunti','Lohardaga','Gumla','Simdega','West Singhbhum','Seraikela-Kharsawan','East Singhbhum','Latehar'],
  'Karnataka': ['Bangalore','Mysore','Hubli-Dharwad','Mangalore','Belgaum','Gulbarga','Davangere','Bellary','Shimoga','Tumkur','Raichur','Bidar','Hassan','Udupi','Mandya','Chikmagalur','Kolar','Chitradurga','Bagalkot','Gadag','Haveri','Kodagu','Chamarajanagar','Koppal','Yadgir','Ramanagara','Chikkaballapur','Dakshina Kannada','Uttara Kannada','Bijapur','Bangalore Rural'],
  'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Kolhapur','Sangli','Satara','Ahmednagar','Jalgaon','Dhule','Amravati','Akola','Latur','Nanded','Beed','Parbhani','Osmanabad','Hingoli','Jalna','Buldhana','Washim','Yavatmal','Wardha','Chandrapur','Bhandara','Gondia','Gadchiroli','Ratnagiri','Sindhudurg','Raigad','Thane','Palghar'],
  'Meghalaya': ['East Khasi Hills','West Khasi Hills','Jaintia Hills','Ri-Bhoi','West Garo Hills','East Garo Hills','South Garo Hills','North Garo Hills','South West Garo Hills','South West Khasi Hills','Eastern West Khasi Hills','West Jaintia Hills','East Jaintia Hills'],
  'Mizoram': ['Aizawl','Lunglei','Champhai','Serchhip','Kolasib','Lawngtlai','Mamit','Saiha','Khawzawl','Hnahthial','Saitual'],
  'Sikkim': ['East Sikkim','West Sikkim','North Sikkim','South Sikkim','Pakyong','Soreng'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry','Karaikal','Mahe','Yanam'],
};

/**
 * Get districts for a given state from the ML dataset.
 * Used in AI predictor dropdowns and AddCropPage location.
 */
export const getDistrictsForState = (state) => {
  if (!state) return ML_DISTRICTS; // show all if no state selected
  return STATE_DISTRICT_MAP[state] || [];
};

/**
 * Get districts for a given state from the comprehensive India dataset.
 * Used in Registration and Settings pages.
 */
export const getAllDistrictsForState = (state) => {
  if (!state) return [];
  return ALL_STATE_DISTRICT_MAP[state] || [];
};

// Today's date in DD-MM-YYYY format expected by the FastAPI model
export const todayForModel = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
};