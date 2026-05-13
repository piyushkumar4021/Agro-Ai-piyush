/**
 * AgroAI — Database Seed Script
 * Run: node seed.js
 * Run (wipe first): node seed.js --fresh
 */

require('dotenv').config();
const mongoose  = require('mongoose');
// bcryptjs not needed here — User model pre-save hook handles password hashing

const User        = require('./models/User.model');
const Crop        = require('./models/Crop.model');
const Order       = require('./models/Order.model');
const Transaction = require('./models/Transaction.model');

const FRESH = process.argv.includes('--fresh');
const genRef = () => 'AGRO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();

// ─── Colours ──────────────────────────────────────────────────────────────────
const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, b: s => `\x1b[36m${s}\x1b[0m`, bold: s => `\x1b[1m${s}\x1b[0m` };

// ─── Demo Users ───────────────────────────────────────────────────────────────
const USERS = [
  // ── Admin ──────────────────────────────────────────────────
  {
    name: 'Admin User',
    email: 'admin@agroai.com',
    password: 'admin123',
    role: 'admin',
    phone: '9000000001',
    address: { village: 'Connaught Place', district: 'New Delhi', state: 'NCT of Delhi', pincode: '110001' },
    isVerified: true, isActive: true,
  },

  // ── Farmers ────────────────────────────────────────────────
  {
    name: 'Ramesh Kumar',
    email: 'farmer@agroai.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '9876543210',
    address: { village: 'Raikot', district: 'Ludhiana', state: 'Punjab', pincode: '141109' },
    farmDetails: { farmSize: 12, cropTypes: ['Wheat', 'Mustard', 'Corn'], farmLocation: 'Ludhiana, Punjab' },
    isVerified: true, isActive: true,
  },
  {
    name: 'Suresh Patel',
    email: 'farmer2@agroai.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '9876543220',
    address: { village: 'Nasik Road', district: 'Nasik', state: 'Gujarat', pincode: '422101' },
    farmDetails: { farmSize: 8, cropTypes: ['Tomato', 'Onion', 'Chilli'], farmLocation: 'Nasik, Gujarat' },
    isVerified: true, isActive: true,
  },
  {
    name: 'Mohan Das',
    email: 'farmer3@agroai.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '9876543230',
    address: { village: 'Sanganer', district: 'Jaipur', state: 'Rajasthan', pincode: '303902' },
    farmDetails: { farmSize: 20, cropTypes: ['Mustard', 'Bajra', 'Groundnut'], farmLocation: 'Jaipur, Rajasthan' },
    isVerified: true, isActive: true,
  },
  {
    name: 'Priya Nair',
    email: 'farmer4@agroai.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '9876543240',
    address: { village: 'Periyar Nagar', district: 'Erode', state: 'Tamil Nadu', pincode: '638004' },
    farmDetails: { farmSize: 6, cropTypes: ['Turmeric', 'Coconut', 'Banana'], farmLocation: 'Erode, Tamil Nadu' },
    isVerified: true, isActive: true,
  },
  {
    name: 'Anand Singh',
    email: 'farmer5@agroai.com',
    password: 'farmer123',
    role: 'farmer',
    phone: '9876543250',
    address: { village: 'Patna Sahib', district: 'Patna', state: 'Bihar', pincode: '800001' },
    farmDetails: { farmSize: 15, cropTypes: ['Rice', 'Maize', 'Lentil'], farmLocation: 'Patna, Bihar' },
    isVerified: true, isActive: true,
  },

  // ── Buyers ─────────────────────────────────────────────────
  {
    name: 'FreshMart India',
    email: 'buyer@agroai.com',
    password: 'buyer123',
    role: 'buyer',
    phone: '9811234567',
    address: { village: 'Rohini Sector 14', district: 'Delhi', state: 'NCT of Delhi', pincode: '110085' },
    businessDetails: { businessName: 'FreshMart India Pvt Ltd', gstNumber: '07AAACF1234A1Z5' },
    isVerified: true, isActive: true,
  },
  {
    name: 'AgriTraders Delhi',
    email: 'buyer2@agroai.com',
    password: 'buyer123',
    role: 'buyer',
    phone: '9845001122',
    address: { village: 'Banjara Hills', district: 'Hyderabad', state: 'Telangana', pincode: '500034' },
    businessDetails: { businessName: 'AgriTraders Delhi LLP', gstNumber: '36AABCA5678B1Z3' },
    isVerified: true, isActive: true,
  },
  {
    name: 'GreenBasket Co',
    email: 'buyer3@agroai.com',
    password: 'buyer123',
    role: 'buyer',
    phone: '9900112233',
    address: { village: 'MG Road', district: 'Bangalore', state: 'Karnataka', pincode: '560001' },
    businessDetails: { businessName: 'GreenBasket Co Pvt Ltd', gstNumber: '29AADCG9876C1Z2' },
    isVerified: true, isActive: true,
  },
];

// ─── Crop templates per farmer (keyed by email) ───────────────────────────────
const CROPS_BY_FARMER = {
  'farmer@agroai.com': [
    { name:'Wheat',   category:'grains',     quantity:500, pricePerUnit:2340, qualityGrade:'A', season:'Rabi',   description:'Premium Sharbati Wheat, freshly harvested. Low moisture content, excellent for flour mills.' },
    { name:'Mustard', category:'others',     quantity:120, pricePerUnit:5200, qualityGrade:'B', season:'Rabi',   description:'Yellow mustard seeds, good oil content, suitable for cold pressing.' },
    { name:'Corn',    category:'grains',     quantity:300, pricePerUnit:1890, qualityGrade:'A', season:'Kharif', description:'Sweet yellow maize, suitable for animal feed and starch processing.' },
    { name:'Barley',  category:'grains',     quantity:200, pricePerUnit:1650, qualityGrade:'B', season:'Rabi',   description:'Malting barley, low moisture, good germination rate.' },
  ],
  'farmer2@agroai.com': [
    { name:'Tomato',  category:'vegetables', quantity:200, pricePerUnit:850,  qualityGrade:'A', season:'Kharif', description:'Hybrid tomatoes, firm texture, bright red. 7–10 day shelf life.' },
    { name:'Onion',   category:'vegetables', quantity:300, pricePerUnit:1200, qualityGrade:'A', season:'Rabi',   description:'Nasik red onion, 60–80mm size, low pungency, long shelf life.' },
    { name:'Green Chilli', category:'vegetables', quantity:80, pricePerUnit:2100, qualityGrade:'B', season:'Kharif', description:'Jwala variety, medium heat, fresh harvest.' },
    { name:'Potato',  category:'vegetables', quantity:600, pricePerUnit:950,  qualityGrade:'A', season:'Rabi',   description:'Kufri Jyoti variety, washed and sorted, 40–60mm size.' },
  ],
  'farmer3@agroai.com': [
    { name:'Mustard',    category:'others',  quantity:250, pricePerUnit:5250, qualityGrade:'A', season:'Rabi',   description:'Rajasthan yellow mustard, high oil content (42%), ideal for expeller pressing.' },
    { name:'Groundnut',  category:'others',  quantity:180, pricePerUnit:6200, qualityGrade:'A', season:'Kharif', description:'Bold peanuts, no aflatoxin contamination, export quality.' },
    { name:'Bajra(Pearl Millet/Cumbu)', category:'grains', quantity:400, pricePerUnit:2100, qualityGrade:'B', season:'Kharif', description:'Pearl millet, grey variety, suitable for flour and fodder.' },
  ],
  'farmer4@agroai.com': [
    { name:'Turmeric(raw)', category:'spices', quantity:100, pricePerUnit:9800, qualityGrade:'A', season:'Kharif', description:'Erode turmeric, high curcumin content (3.5%), deep orange colour. Salem & Erode certified.' },
    { name:'Coconut',       category:'others', quantity:5000, pricePerUnit:35, qualityGrade:'A', season:'Year-round', description:'Mature coconuts, 600–700g each, good copra yield. Price per unit.' },
    { name:'Banana',        category:'fruits', quantity:300, pricePerUnit:1800, qualityGrade:'B', season:'Year-round', description:'Robusta banana, 150–175g per finger, 14–16 fingers per bunch.' },
  ],
  'farmer5@agroai.com': [
    { name:'Rice',      category:'grains',  quantity:800, pricePerUnit:3200, qualityGrade:'A', season:'Kharif', description:'Sona Masoori rice, medium grain, low glycaemic, 12% moisture.' },
    { name:'Maize',     category:'grains',  quantity:450, pricePerUnit:1950, qualityGrade:'B', season:'Kharif', description:'Yellow dent corn, suitable for poultry and starch processing.' },
    { name:'Masur Dal', category:'pulses',  quantity:180, pricePerUnit:7800, qualityGrade:'A', season:'Rabi',   description:'Red lentils, split, 99% purity, no weevil damage.' },
  ],
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log(c.bold('\n🌱  AgroAI Database Seeder\n'));

  await mongoose.connect(process.env.MONGO_URI);
  console.log(c.g('✅  MongoDB connected'));

  if (FRESH) {
    console.log(c.y('🧹  --fresh flag: wiping existing data…'));
    await Promise.all([
      User.deleteMany({}),
      Crop.deleteMany({}),
      Order.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log(c.y('   Cleared: Users, Crops, Orders, Transactions'));
  }

  // ── 1. Users ──────────────────────────────────────────────────────
  console.log(c.b('\n👤  Seeding users…'));
  const createdUsers = {};

  for (const u of USERS) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      createdUsers[u.email] = exists;
      console.log(c.y(`   skip (exists): ${u.email}`));
      continue;
    }
    const user = await User.create({ ...u });
    createdUsers[u.email] = user;
    console.log(c.g(`   created: ${u.email}  [${u.role}]`));
  }

  // ── 2. Crops ──────────────────────────────────────────────────────
  console.log(c.b('\n🌾  Seeding crops…'));
  const allCrops = [];

  for (const [farmerEmail, cropList] of Object.entries(CROPS_BY_FARMER)) {
    const farmer = createdUsers[farmerEmail];
    if (!farmer) continue;

    for (const ct of cropList) {
      const exists = await Crop.findOne({ farmer: farmer._id, name: ct.name });
      if (exists) {
        allCrops.push(exists);
        console.log(c.y(`   skip (exists): ${ct.name} — ${farmerEmail}`));
        continue;
      }
      const crop = await Crop.create({
        ...ct,
        farmer: farmer._id,
        isApproved: true,          // pre-approved for demo
        status: 'available',
        location: farmer.address,
        harvestDate:    new Date(Date.now() - 14 * 86400000),
        availableUntil: new Date(Date.now() + 60 * 86400000),
      });
      allCrops.push(crop);
      console.log(c.g(`   created: ${ct.name} — ${farmerEmail}`));
    }
  }

  // ── 3. Orders + Transactions ──────────────────────────────────────
  console.log(c.b('\n📦  Seeding orders…'));

  const buyer1 = createdUsers['buyer@agroai.com'];
  const buyer2 = createdUsers['buyer2@agroai.com'];
  const buyer3 = createdUsers['buyer3@agroai.com'];

  const getCrop = (name) => allCrops.find(c => c.name === name);

  const ORDER_TEMPLATES = [
    // ── buyer1 ──
    {
      buyer: buyer1, crop: getCrop('Wheat'), quantity: 200,
      status: 'delivered', paymentStatus: 'released',
      farmerDispatched: true, buyerReceived: true, paymentReleased: true,
      daysAgo: 20,
    },
    {
      buyer: buyer1, crop: getCrop('Rice'), quantity: 50,
      status: 'dispatched', paymentStatus: 'escrowed',
      farmerDispatched: true, buyerReceived: false, paymentReleased: false,
      daysAgo: 5,
    },
    {
      buyer: buyer1, crop: getCrop('Tomato'), quantity: 30,
      status: 'payment_done', paymentStatus: 'escrowed',
      farmerDispatched: false, buyerReceived: false, paymentReleased: false,
      daysAgo: 2,
    },
    {
      buyer: buyer1, crop: getCrop('Mustard'), quantity: 60,
      status: 'pending', paymentStatus: 'unpaid',
      farmerDispatched: false, buyerReceived: false, paymentReleased: false,
      daysAgo: 1,
    },

    // ── buyer2 ──
    {
      buyer: buyer2, crop: getCrop('Onion'), quantity: 80,
      status: 'delivered', paymentStatus: 'released',
      farmerDispatched: true, buyerReceived: true, paymentReleased: true,
      daysAgo: 30,
    },
    {
      buyer: buyer2, crop: getCrop('Groundnut'), quantity: 40,
      status: 'payment_done', paymentStatus: 'escrowed',
      farmerDispatched: false, buyerReceived: false, paymentReleased: false,
      daysAgo: 3,
    },
    {
      buyer: buyer2, crop: getCrop('Turmeric(raw)'), quantity: 10,
      status: 'delivered', paymentStatus: 'released',
      farmerDispatched: true, buyerReceived: true, paymentReleased: true,
      daysAgo: 45,
    },

    // ── buyer3 ──
    {
      buyer: buyer3, crop: getCrop('Maize'), quantity: 100,
      status: 'dispatched', paymentStatus: 'escrowed',
      farmerDispatched: true, buyerReceived: false, paymentReleased: false,
      daysAgo: 4,
    },
    {
      buyer: buyer3, crop: getCrop('Banana'), quantity: 20,
      status: 'delivered', paymentStatus: 'released',
      farmerDispatched: true, buyerReceived: true, paymentReleased: true,
      daysAgo: 15,
    },
    {
      buyer: buyer3, crop: getCrop('Masur Dal'), quantity: 25,
      status: 'pending', paymentStatus: 'unpaid',
      farmerDispatched: false, buyerReceived: false, paymentReleased: false,
      daysAgo: 0,
    },
  ];

  for (const t of ORDER_TEMPLATES) {
    if (!t.crop || !t.buyer) { console.log(c.y('   skip: crop or buyer missing')); continue; }

    const existingOrder = await Order.findOne({ buyer: t.buyer._id, crop: t.crop._id, quantity: t.quantity });
    if (existingOrder) { console.log(c.y(`   skip (exists): order ${t.crop.name} for ${t.buyer.name}`)); continue; }

    const totalAmount = t.quantity * t.crop.pricePerUnit;
    const ref         = genRef();
    const createdAt   = new Date(Date.now() - t.daysAgo * 86400000);

    const order = await Order.create({
      buyer:  t.buyer._id,
      farmer: t.crop.farmer,
      crop:   t.crop._id,
      quantity: t.quantity,
      pricePerUnit: t.crop.pricePerUnit,
      totalAmount,
      status:        t.status,
      paymentStatus: t.paymentStatus,
      farmerDispatched: t.farmerDispatched,
      buyerReceived:    t.buyerReceived,
      paymentReleased:  t.paymentReleased,
      paymentRef:    ['pending','unpaid'].includes(t.status) ? undefined : ref,
      paymentMethod: 'upi',
      paidAt:        t.status !== 'pending' ? createdAt : undefined,
      dispatchedAt:  t.farmerDispatched ? new Date(createdAt.getTime() + 86400000) : undefined,
      deliveredAt:   t.status === 'delivered' ? new Date(createdAt.getTime() + 3 * 86400000) : undefined,
      deliveryAddress: {
        name:     t.buyer.name,
        phone:    t.buyer.phone,
        village:  t.buyer.address.village,
        district: t.buyer.address.district,
        state:    t.buyer.address.state,
        pincode:  t.buyer.address.pincode,
      },
      createdAt,
    });

    // Create matching transaction for paid orders
    if (t.status !== 'pending') {
      await Transaction.create({
        order:          order._id,
        buyer:          t.buyer._id,
        farmer:         t.crop.farmer,
        amount:         totalAmount,
        type:           'payment',
        status:         'success',
        paymentMethod:  'upi',
        transactionRef: ref,
        note: t.paymentReleased
          ? 'Payment released to farmer after delivery confirmation'
          : 'Payment held in escrow',
        createdAt,
      });
    }

    console.log(c.g(`   created: ${t.crop.name} × ${t.quantity} Qtl — ${t.buyer.name} [${t.status}]`));
  }

  // ─── Summary ──────────────────────────────────────────────────────
  const counts = {
    users:        await User.countDocuments(),
    crops:        await Crop.countDocuments(),
    orders:       await Order.countDocuments(),
    transactions: await Transaction.countDocuments(),
  };

  console.log(c.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(c.bold('✅  Seeding complete!\n'));
  console.log(`   Users:        ${c.g(counts.users)}`);
  console.log(`   Crops:        ${c.g(counts.crops)}`);
  console.log(`   Orders:       ${c.g(counts.orders)}`);
  console.log(`   Transactions: ${c.g(counts.transactions)}`);

  console.log(c.bold('\n📋  Demo Login Credentials:\n'));
  console.log(`   ${c.b('Admin')}    admin@agroai.com     / admin123`);
  console.log(`   ${c.g('Farmer 1')} farmer@agroai.com    / farmer123   (Ramesh Kumar, Punjab)`);
  console.log(`   ${c.g('Farmer 2')} farmer2@agroai.com   / farmer123   (Suresh Patel, Gujarat)`);
  console.log(`   ${c.g('Farmer 3')} farmer3@agroai.com   / farmer123   (Mohan Das, Rajasthan)`);
  console.log(`   ${c.g('Farmer 4')} farmer4@agroai.com   / farmer123   (Priya Nair, Tamil Nadu)`);
  console.log(`   ${c.g('Farmer 5')} farmer5@agroai.com   / farmer123   (Anand Singh, Bihar)`);
  console.log(`   ${c.y('Buyer 1')}  buyer@agroai.com     / buyer123    (FreshMart India, Delhi)`);
  console.log(`   ${c.y('Buyer 2')}  buyer2@agroai.com    / buyer123    (AgriTraders Delhi, Hyderabad)`);
  console.log(`   ${c.y('Buyer 3')}  buyer3@agroai.com    / buyer123    (GreenBasket Co, Bangalore)`);
  console.log(c.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  await mongoose.disconnect();
  console.log(c.g('🔌  MongoDB disconnected. Done.\n'));
}

seed().catch(err => {
  console.error(c.r('\n❌  Seed failed:'), err.message);
  process.exit(1);
});