import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropAPI, orderAPI, mlAPI, paymentAPI } from '../services/api';
import { ML_STATES, ML_COMMODITIES, getDistrictsForState, todayForModel } from '../data/mlData';
import { getCropImageByName, CATEGORY_IMAGES } from '../data/cropImages';

const ICONS = { grains: '🌾', vegetables: '🥦', fruits: '🍎', pulses: '🫘', spices: '🌶️', others: '🌿' };
const CATS = ['all', 'grains', 'vegetables', 'fruits', 'pulses', 'spices', 'others'];

// Backend base URL for uploaded images
const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

// Use crop-name-specific images from shared utility
const FALLBACK_IMAGES = CATEGORY_IMAGES;

/**
 * Resolves the first available image URL for a crop.
 * Uploaded images come from multer as paths like "uploads/crops/xyz.jpg"
 */
function getCropImageUrl(crop) {
  if (crop.images && crop.images.length > 0) {
    const raw = crop.images[0];
    // If already a full URL, use as-is
    if (raw.startsWith('http')) return raw;
    // Otherwise prefix with backend base (normalize backslashes)
    return `${API_BASE}/${raw.replace(/\\/g, '/')}`;
  }
  return null;
}

/** Card / modal image with real photo or crop-name-specific fallback */
function CropImage({ crop, size = 'card' }) {
  const [errored, setErrored] = useState(false);
  const uploaded = getCropImageUrl(crop);
  // Use crop-name-specific image (e.g. real wheat photo for "Wheat")
  const fallback = getCropImageByName(crop.name, crop.category);
  const src = (!errored && uploaded) ? uploaded : fallback;

  const cardStyle = {
    width: '100%',
    height: size === 'card' ? 160 : 80,
    objectFit: 'cover',
    borderRadius: size === 'card' ? '12px 12px 0 0' : 10,
    display: 'block',
  };

  return (
    <img
      src={src}
      alt={crop.name || 'Crop'}
      style={cardStyle}
      onError={() => setErrored(true)}
    />
  );
}

// ── Step tracker ───────────────────────────────────────────────────────────────
const STEPS = ['Order Details', 'Payment', 'Confirmation'];
function StepBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem',
              background: i < step ? 'var(--green-dark)' : i === step ? 'var(--green-mid)' : 'var(--gray-200)',
              color: i <= step ? '#fff' : 'var(--gray-400)',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '0.68rem', marginTop: 4, color: i <= step ? 'var(--green-dark)' : 'var(--gray-400)', fontWeight: i === step ? 700 : 400 }}>
              {s}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 2, height: 2, background: i < step ? 'var(--green-dark)' : 'var(--gray-200)', marginBottom: 20 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 12;

  // Modal state machine: null | 'order' | 'payment' | 'success'
  const [modal, setModal] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [qty, setQty] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [payMethod, setPayMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');

  // AI price check
  const [mlState, setMlState] = useState('');
  const [mlDistrict, setMlDistrict] = useState('');
  const [mlCommodity, setMlCommodity] = useState('');
  const [mlDate, setMlDate] = useState(todayForModel());
  const [mlPrice, setMlPrice] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: LIMIT };
        if (cat !== 'all') params.category = cat;
        if (search) params.search = search;
        const res = await cropAPI.getAll(params);
        setCrops(res.data.crops || []);
        setTotalCount(res.data.total || 0);
        setTotalPages(Math.max(1, Math.ceil((res.data.total || 0) / LIMIT)));
      } catch { setCrops([]); setTotalCount(0); setTotalPages(1); }
      finally { setLoading(false); }
    };
    load();
  }, [cat, search, page]);

  // Reset page when filters change
  const handleCatChange = (c) => { setCat(c); setPage(1); };
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };

  const openOrder = (c) => {
    setSelectedCrop(c);
    setQty('');
    setMlPrice(null); setMlError('');
    const cm = ML_COMMODITIES.find(m => m.toLowerCase() === (c.name || '').toLowerCase()) || '';
    setMlCommodity(cm);
    const cs = ML_STATES.find(s => (c.location?.state || '').toLowerCase().includes(s.toLowerCase())) || '';
    setMlState(cs);
    setMlDistrict('');
    setModal('order');
  };

  const handleMlStateChange = (val) => {
    setMlState(val);
    setMlDistrict('');
  };

  const fetchMlPrice = async () => {
    if (!mlState || !mlDistrict || !mlCommodity) { setMlError('Select State, District and Commodity.'); return; }
    setMlError(''); setMlLoading(true);
    try {
      const data = await mlAPI.predictPrice({ State: mlState, District: mlDistrict, Commodity: mlCommodity, Arrival_Date: mlDate });
      setMlPrice({ price: data?.predicted_modal_price });
    } catch { setMlError('Model server unavailable.'); }
    finally { setMlLoading(false); }
  };

  const proceedToPayment = async () => {
    if (!qty || Number(qty) <= 0) return;
    setPlacing(true);
    try {
      const res = await orderAPI.place({
        cropId: selectedCrop._id,
        quantity: Number(qty),
        deliveryAddress: {
          name: user?.name,
          phone: user?.phone,
          village: user?.address?.village,
          district: user?.address?.district,
          state: user?.address?.state,
          pincode: user?.address?.pincode,
        },
      });
      setPlacedOrder(res.data.order);
      setModal('payment');
    } catch (e) {
      setAlertMsg('Order failed: ' + (e.response?.data?.message || e.message));
    } finally { setPlacing(false); }
  };

  // Load Razorpay SDK dynamically
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const makePayment = async () => {
    setPaying(true);
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) { setAlertMsg('Failed to load Razorpay SDK. Check your internet connection.'); setPaying(false); return; }

      // 2. Create Razorpay order on backend
      const res = await paymentAPI.createOrder(placedOrder._id, { paymentMethod: payMethod });
      const { razorpayOrder, keyId, order: orderInfo } = res.data;

      // 3. Open Razorpay checkout modal
      const options = {
        key: keyId || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'AgroAI Marketplace',
        description: `${orderInfo.cropName} · ${orderInfo.quantity} Qtl`,
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#2d6a4f' },
        method: {
          upi: payMethod === 'upi',
          card: payMethod === 'card',
          netbanking: payMethod === 'netbanking',
          wallet: false,
          paylater: false,
        },
        handler: async function (response) {
          // 4. Verify payment on backend
          try {
            const verifyRes = await paymentAPI.verifyPayment(placedOrder._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPayResult({ ref: verifyRes.data.paymentRef });
            setModal('success');
          } catch (err) {
            setAlertMsg('Payment verification failed: ' + (err.response?.data?.message || err.message));
          }
          setPaying(false);
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setAlertMsg('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setPaying(false);
      });
      rzp.open();
    } catch (e) {
      setAlertMsg('Payment failed: ' + (e.response?.data?.message || e.message));
      setPaying(false);
    }
  };

  const closeModal = () => {
    setModal(null); setSelectedCrop(null); setPlacedOrder(null); setPayResult(null);
    setQty(''); setUpiId(''); setCardNo(''); setCardExp(''); setCardCvv('');
  };

  const total = selectedCrop && qty ? Number(qty) * (selectedCrop.pricePerUnit || selectedCrop.price) : 0;

  // Shared styles for the payment modal
  const overlaySelect = {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-sm)', color: '#fff', padding: '7px 9px', fontSize: '0.78rem', width: '100%',
  };
  const overlayLbl = { fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)', marginBottom: 3, display: 'block' };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--gray-50)' }}>
      {/* ── Header ── */}
      <div className="mp-header" style={{ background: 'linear-gradient(135deg, var(--green-deep), var(--green-dark))', padding: '2.5rem 2rem', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 6 }}>🌾 Crop Marketplace</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {totalCount} verified listings · Secure escrow payments
          </p>
          <div className="mp-filters" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: '0.9rem', background: 'rgba(255,255,255,0.12)', color: '#fff', outline: 'none' }}
              placeholder="🔍 Search crops…" value={search} onChange={handleSearchChange}
            />
            {CATS.map(c => (
              <button key={c} onClick={() => handleCatChange(c)}
                style={{
                  padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize',
                  background: cat === c ? '#fff' : 'rgba(255,255,255,0.12)',
                  color: cat === c ? 'var(--green-dark)' : 'rgba(255,255,255,0.7)'
                }}>
                {ICONS[c] || '🔍'} {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)', padding: '0.75rem 2rem' }}>
        <div className="mp-howitworks" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['🛒', 'Place Order', 'Select crop & quantity'],
            ['💳', 'Secure Payment', 'Money held in escrow'],
            ['🚛', 'Farmer Dispatches', 'Seller ships to your address'],
            ['✅', 'Confirm Receipt', 'Payment released to farmer'],
          ].map(([icon, title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: '1.3rem' }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {alertMsg && (
          <div className="alert alert-red animate-fadeIn" style={{ marginBottom: '1.5rem' }}>
            <span className="alert-icon">❌</span><div>{alertMsg}</div>
            <button onClick={() => setAlertMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
        )}

        {loading ? (
          <div className="flex-center" style={{ minHeight: 300 }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>🌾</div><div>Loading crops…</div></div>
          </div>
        ) : (
          <>
          <div className="mp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '1.5rem' }}>
            {crops.map((c, i) => (
              <div key={c._id || c.id || i} className="crop-card animate-fadeUp"
                style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid var(--gray-100)', background: '#fff', transition: 'transform 0.18s, box-shadow 0.18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.13)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
              >
                {/* Real crop photo */}
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <CropImage crop={c} size="card" />
                  {/* Grade badge overlay */}
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    background: c.qualityGrade === 'A' ? '#16a34a' : c.qualityGrade === 'B' ? '#ca8a04' : '#dc2626',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                    padding: '2px 9px', borderRadius: 99,
                  }}>Grade {c.qualityGrade || 'B'}</span>
                  {/* Category tag */}
                  <span style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                    color: '#fff', fontSize: '0.68rem', fontWeight: 600,
                    padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize',
                  }}>{ICONS[c.category]} {c.category}</span>
                </div>

                <div className="crop-card-body" style={{ padding: '12px 14px 14px' }}>
                  <div className="crop-card-name" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                  <div className="crop-card-farmer" style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>👨‍🌾 {c.farmer?.name || c.farmer}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 2, marginBottom: 8 }}>📍 {c.location?.state || c.location || 'India'}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="crop-card-price" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--green-dark)' }}>₹{c.pricePerUnit || c.price}<span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--gray-400)' }}>/Qtl</span></div>
                    <span style={{ background: 'var(--gray-100)', color: 'var(--gray-600)', fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>{c.quantity || c.qty} Qtl</span>
                  </div>

                  {user?.role === 'buyer' && (
                    <button className="btn btn-primary btn-full" style={{ marginTop: 2, padding: '9px', fontSize: '0.85rem', borderRadius: 10 }} onClick={() => openOrder(c)}>
                      🛒 Buy Now
                    </button>
                  )}
                </div>
              </div>
            ))}
            {crops.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--gray-400)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔍</div>
                <div>No crops found.</div>
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gray-200)',
                  background: page === 1 ? 'var(--gray-100)' : '#fff', color: page === 1 ? 'var(--gray-400)' : 'var(--gray-700)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  transition: 'all 0.15s',
                }}>
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} style={{ padding: '4px 6px', color: 'var(--gray-400)', fontSize: '0.85rem' }}>…</span>
                  ) : (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: 'none',
                        background: p === page ? 'var(--green-dark)' : 'var(--gray-100)',
                        color: p === page ? '#fff' : 'var(--gray-600)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid var(--gray-200)',
                  background: page === totalPages ? 'var(--gray-100)' : '#fff', color: page === totalPages ? 'var(--gray-400)' : 'var(--gray-700)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.82rem',
                  transition: 'all 0.15s',
                }}>
                Next →
              </button>

              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: 8 }}>
                Page {page} of {totalPages} · {totalCount} crops
              </span>
            </div>
          )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          MODAL OVERLAY
          ════════════════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget && modal !== 'success') closeModal(); }}>
          <div className="card card-pad animate-fadeUp" style={{ maxWidth: 500, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* ── STEP 1: ORDER DETAILS ── */}
            {modal === 'order' && selectedCrop && (
              <>
                <StepBar step={0} />
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>🛒 Order Details</div>

                {/* Crop summary with real image */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '1rem', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <CropImage crop={selectedCrop} size="thumb" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedCrop.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>👨‍🌾 {selectedCrop.farmer?.name || selectedCrop.farmer}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>📍 {selectedCrop.location?.state || selectedCrop.location || 'India'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--green-dark)', fontSize: '1.2rem' }}>₹{selectedCrop.pricePerUnit || selectedCrop.price}/Qtl</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Grade {selectedCrop.qualityGrade || selectedCrop.grade || 'B'}</div>
                  </div>
                </div>

                {/* AI Price Panel */}
                <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '1rem', color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>🤖 AI Fair Price Check</div>
                  <div className="mp-ai-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={overlayLbl}>State</label>
                      <select style={overlaySelect} value={mlState} onChange={e => handleMlStateChange(e.target.value)}>
                        <option value="">State</option>
                        {ML_STATES.map(s => <option key={s} value={s} style={{ color: '#111', background: '#fff' }}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={overlayLbl}>District</label>
                      <select style={overlaySelect} value={mlDistrict} onChange={e => setMlDistrict(e.target.value)}>
                        <option value="">District</option>
                        {getDistrictsForState(mlState).map(d => <option key={d} value={d} style={{ color: '#111', background: '#fff' }}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={overlayLbl}>Commodity</label>
                      <select style={overlaySelect} value={mlCommodity} onChange={e => setMlCommodity(e.target.value)}>
                        <option value="">Commodity</option>
                        {ML_COMMODITIES.map(c => <option key={c} value={c} style={{ color: '#111', background: '#fff' }}>{c}</option>)}
                      </select>
                    </div>
                    <button onClick={fetchMlPrice} disabled={mlLoading}
                      style={{ background: 'var(--green-mid)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 12px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                      {mlLoading ? '⏳' : '🔮 Check'}
                    </button>
                  </div>
                  {mlError && <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#fca5a5' }}>⚠️ {mlError}</div>}
                  {mlPrice && mlPrice.price != null && (() => {
                    const listing = selectedCrop.pricePerUnit || selectedCrop.price;
                    const diff = ((listing - mlPrice.price) / mlPrice.price * 100).toFixed(1);
                    const isHigh = listing > mlPrice.price;
                    return (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>Predicted</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{Number(mlPrice.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/Qtl</div>
                        </div>
                        <div style={{ background: isHigh ? 'rgba(239,68,68,0.25)' : 'rgba(82,183,136,0.25)', borderRadius: 'var(--radius-sm)', padding: '5px 9px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {isHigh ? `⚠️ ${diff}% above market` : `✅ ${Math.abs(diff)}% below market`}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label className="form-label">Quantity (Quintal) *</label>
                  <input className="form-input" type="number" min="1" max={selectedCrop.quantity || selectedCrop.qty || 999}
                    placeholder={`Max: ${selectedCrop.quantity || selectedCrop.qty || '—'} Qtl`}
                    value={qty} onChange={e => setQty(e.target.value)} />
                </div>

                {qty && Number(qty) > 0 && (
                  <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--green-dark)' }}>Order Summary</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>{qty} Qtl × ₹{selectedCrop.pricePerUnit || selectedCrop.price}/Qtl</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--green-dark)' }}>
                        ₹{total.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔒 Payment will be held securely by AgroAI until you confirm delivery
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} disabled={placing || !qty || Number(qty) <= 0} onClick={proceedToPayment}>
                    {placing ? '⏳ Processing…' : '→ Proceed to Payment'}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: PAYMENT ── */}
            {modal === 'payment' && placedOrder && (
              <>
                <StepBar step={1} />
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>💳 Secure Payment</div>

                {/* Amount box */}
                <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '1.25rem', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Amount to Pay (Held in Escrow)</div>
                  <div style={{ fontWeight: 800, fontSize: '2rem' }}>₹{(placedOrder.totalAmount || total).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                    {placedOrder.quantity || qty} Qtl · {selectedCrop?.name || placedOrder.crop?.name}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', padding: '5px 10px', display: 'inline-block' }}>
                    🔒 Money released to farmer only after you confirm delivery
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    🛡️ AgroAI acts as a trusted mediator — your money is safe
                  </div>
                </div>

                {/* Razorpay info */}
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#166534' }}>Secure Razorpay Checkout</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>
                    A secure Razorpay payment window will open where you can complete your payment.
                    Your payment details are never stored on our servers.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.72rem', color: 'var(--gray-400)' }}>
                    🔒 Powered by <strong style={{ color: '#072654' }}>Razorpay</strong> · PCI DSS Compliant · UPI, Cards, Net Banking
                  </div>
                </div>

                {/* Delivery address preview */}
                {user?.address && (
                  <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>📦 Delivery Address (sent to farmer on payment)</div>
                    <div style={{ color: 'var(--gray-600)' }}>{user.name} · {user.phone || '—'}</div>
                    <div style={{ color: 'var(--gray-500)' }}>
                      {[user.address.street, user.address.village, user.address.district, user.address.state, user.address.pincode].filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal('order')} disabled={paying}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} disabled={paying} onClick={makePayment}>
                    {paying ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        Opening Razorpay…
                      </span>
                    ) : `🔒 Pay ₹${(placedOrder.totalAmount || total).toLocaleString('en-IN')} via Razorpay`}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: SUCCESS ── */}
            {modal === 'success' && (
              <>
                <StepBar step={2} />
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🎉</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>Payment Successful!</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Your money is safely held by AgroAI — it will only be released to the farmer after you confirm delivery.
                  </div>

                  <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '1.25rem', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--green-dark)', marginBottom: 8 }}>✅ What happens next</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                      {[
                        ['🧑‍🌾', 'Farmer has been notified with your delivery address'],
                        ['🚛', 'Farmer will dispatch the crops and mark them as sent'],
                        ['📦', 'Once you receive the crops, confirm receipt in your dashboard'],
                        ['💰', 'AgroAI (mediator) releases payment to the farmer after your confirmation'],
                      ].map(([icon, text]) => (
                        <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span>{icon}</span><span style={{ color: 'var(--gray-700)' }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {payResult?.ref && (
                    <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--gray-500)' }}>Transaction Reference</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em' }}>{payResult.ref}</div>
                    </div>
                  )}

                  <button className="btn btn-primary btn-full" onClick={() => { closeModal(); navigate('/buyer'); }}>
                    📦 Track in My Orders →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}