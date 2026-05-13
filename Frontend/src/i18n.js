import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      brand: 'AgroAI',
      tagline: 'AI-Driven Agriculture Marketplace',
      nav: { dashboard: 'Dashboard', marketplace: 'Marketplace', settings: 'Settings', logout: 'Logout' },
      dash: { overview: 'Overview', orders: 'My Orders', earnings: 'Earnings', crops: 'My Crops', ai: 'AI Insights' },
      actions: { buy: 'Buy Now', sell: 'List Crop', cancel: 'Cancel', confirm: 'Confirm', search: 'Search', export: 'Export CSV' },
      order: { placed: 'Order Placed', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled', escrow: 'In Escrow', paid: 'Paid' },
      crop: { name: 'Crop Name', price: 'Price', qty: 'Quantity', grade: 'Grade', category: 'Category', available: 'Available', sold: 'Sold' },
      common: { loading: 'Loading…', noData: 'No data', save: 'Save', delete: 'Delete', edit: 'Edit', back: 'Back' },
    },
  },
  hi: {
    translation: {
      brand: 'एग्रोAI',
      tagline: 'AI-संचालित कृषि मार्केटप्लेस',
      nav: { dashboard: 'डैशबोर्ड', marketplace: 'बाज़ार', settings: 'सेटिंग्स', logout: 'लॉगआउट' },
      dash: { overview: 'अवलोकन', orders: 'मेरे ऑर्डर', earnings: 'कमाई', crops: 'मेरी फसलें', ai: 'AI जानकारी' },
      actions: { buy: 'अभी खरीदें', sell: 'फसल सूचीबद्ध करें', cancel: 'रद्द करें', confirm: 'पुष्टि करें', search: 'खोजें', export: 'CSV डाउनलोड' },
      order: { placed: 'ऑर्डर दिया गया', dispatched: 'भेज दिया गया', delivered: 'वितरित', cancelled: 'रद्द', escrow: 'एस्क्रो में', paid: 'भुगतान हुआ' },
      crop: { name: 'फसल का नाम', price: 'मूल्य', qty: 'मात्रा', grade: 'ग्रेड', category: 'श्रेणी', available: 'उपलब्ध', sold: 'बिक गया' },
      common: { loading: 'लोड हो रहा है…', noData: 'कोई डेटा नहीं', save: 'सेव', delete: 'हटाएं', edit: 'संपादित', back: 'वापस' },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('agroai-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
