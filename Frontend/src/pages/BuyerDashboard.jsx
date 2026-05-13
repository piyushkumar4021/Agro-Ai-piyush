import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI, mlAPI, reviewAPI, invoiceAPI } from '../services/api';
import { AI_PREDICTIONS, CROPS } from '../data/mockData';
import { ML_STATES, ML_COMMODITIES, getDistrictsForState, todayForModel } from '../data/mlData';
import { LineChart, BarChart, DoughnutChart, HBarChart } from '../components/common/Charts';
import { getCropImageByName } from '../data/cropImages';
import DashShell from '../components/layout/DashShell';


const STATUS_CONFIG = {
  pending: { badge: 'badge-gray', label: 'Awaiting Payment', icon: '⏳' },
  payment_done: { badge: 'badge-amber', label: 'Escrowed by AgroAI — Awaiting Dispatch', icon: '🔒' },
  dispatched: { badge: 'badge-blue', label: 'Dispatched — Confirm Receipt', icon: '🚛' },
  delivered: { badge: 'badge-green', label: 'Delivered — Payment Released', icon: '💰' },
  cancelled: { badge: 'badge-red', label: 'Cancelled', icon: '❌' },
};
const SBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || { badge: 'badge-gray', label: status, icon: '•' };
  return <span className={`badge ${c.badge}`}>{c.icon} {c.label}</span>;
};

const SIDEBAR = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'orders', icon: '📦', label: 'My Orders' },
  { id: 'marketplace', icon: '🛒', label: 'Browse Crops' },
  { id: 'ai', icon: '🤖', label: 'AI Insights' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];
const CROP_ICONS = { grains: '🌾', vegetables: '🥦', fruits: '🍎', pulses: '🫘', spices: '🌶️', others: '🌿' };

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [confirming, setConfirming] = useState({});

  // ML predictor
  const [mlState, setMlState] = useState('');
  const [mlDistrict, setMlDistrict] = useState('');
  const [mlCommodity, setMlCommodity] = useState('');
  const [mlDate, setMlDate] = useState(todayForModel());
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  // Review state
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data.orders || []);
    } catch (e) { console.error('Load error', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConfirmReceipt = async (orderId) => {
    setConfirming(p => ({ ...p, [orderId]: true }));
    try {
      await orderAPI.confirmReceipt(orderId);
      setActionMsg('✅ Receipt confirmed! Payment has been released to the farmer.');
      setExpandedOrder(null);
      await load();
    } catch (e) {
      setActionMsg('❌ ' + (e.response?.data?.message || e.message));
    } finally {
      setConfirming(p => ({ ...p, [orderId]: false }));
      setTimeout(() => setActionMsg(''), 5000);
    }
  };

  // Submit review
  const handleSubmitReview = async (o) => {
    if (!reviewRating) return;
    setReviewSubmitting(true);
    try {
      await reviewAPI.create({
        orderId: o._id || o.id,
        rating: reviewRating,
        comment: reviewComment,
        type: 'farmer_review',
        reviewedUserId: o.farmer?._id || o.farmer,
        cropId: o.crop?._id || o.crop,
      });
      setReviewedOrders(p => new Set([...p, o._id || o.id]));
      setReviewOrder(null);
      setReviewRating(5);
      setReviewComment('');
      setActionMsg('⭐ Review submitted! Thank you for your feedback.');
    } catch (e) {
      setActionMsg('❌ ' + (e.response?.data?.message || 'Review already submitted'));
    } finally { setReviewSubmitting(false); }
  };

  const runMlPredict = async () => {
    if (!mlState || !mlDistrict || !mlCommodity) { setMlError('Select State, District and Commodity.'); return; }
    setMlError(''); setMlLoading(true);
    try {
      const data = await mlAPI.predictPrice({ State: mlState, District: mlDistrict, Commodity: mlCommodity, Arrival_Date: mlDate });
      setMlResult({ price: data?.predicted_modal_price });
    } catch { setMlError('Model server error.'); }
    finally { setMlLoading(false); }
  };

  // Reset district when state changes
  const handleMlStateChange = (val) => {
    setMlState(val);
    setMlDistrict('');
  };

  const totalSpend = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const escrowed = orders.filter(o => ['payment_done', 'dispatched'].includes(o.status)).reduce((s, o) => s + (o.totalAmount || 0), 0);

  const stats = [
    { icon: '📦', label: 'Total Orders', value: orders.length, color: '#dbeafe', iconColor: '#3b82f6' },
    { icon: '🔒', label: 'In Escrow', value: escrowed > 0 ? `₹${(escrowed / 1000).toFixed(0)}K` : '₹0', color: '#fff3e0', iconColor: '#f4a261' },
    { icon: '🚛', label: 'Awaiting Receipt', value: orders.filter(o => o.status === 'dispatched').length, color: '#e0e7ff', iconColor: '#6366f1' },
    { icon: '✅', label: 'Completed', value: orders.filter(o => o.status === 'delivered').length, color: '#d8f3dc', iconColor: '#52b788' },
  ];

  const orderStatuses = {
    pending: orders.filter(o => o.status === 'pending').length,
    payment_done: orders.filter(o => o.status === 'payment_done').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  // Compute real monthly spend data from orders (last 6 months)
  const computeMonthlyData = () => {
    const now = new Date();
    const months = [];
    const spend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('en-IN', { month: 'short' }));
      const monthOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const od = new Date(o.createdAt);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status !== 'cancelled';
      });
      spend.push(monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0));
    }
    return { months, spend };
  };
  const chartData = computeMonthlyData();

  // Per-crop spend breakdown
  const cropSpend = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const name = o.crop?.name || 'Other';
    cropSpend[name] = (cropSpend[name] || 0) + (o.totalAmount || 0);
  });
  const cropLabels = Object.keys(cropSpend).sort((a, b) => cropSpend[b] - cropSpend[a]).slice(0, 8);
  const cropPrices = cropLabels.map(l => cropSpend[l]);

  const aiSelectStyle = {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-sm)', color: '#fff', padding: '8px 10px', fontSize: '0.82rem', width: '100%',
  };
  const aiLabel = { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4, display: 'block' };

  // Shared order card renderer
  const OrderCard = ({ o, i }) => {
    const oid = o._id || o.id;
    const isExp = expandedOrder === oid;
    const isDisp = o.status === 'dispatched';
    const isDone = o.status === 'delivered';
    const isPaid = o.status === 'payment_done';

    return (
      <div key={oid || i} className="card" style={{ border: isDisp ? '2px solid #6366f1' : '1px solid var(--gray-100)' }}>
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}
          onClick={() => setExpandedOrder(isExp ? null : oid)}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--gray-400)' }}>#{(oid || '').slice(-6)}</span>
              <SBadge status={o.status} />
              {isDisp && <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>CONFIRM RECEIPT</span>}
            </div>
            <div style={{ fontWeight: 700 }}>{o.crop?.name || o.crop}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>👨‍🌾 {o.farmer?.name || o.farmer}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-dark)' }}>
              {o.totalAmount ? `₹${o.totalAmount.toLocaleString('en-IN')}` : o.amount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{o.date || (o.createdAt && new Date(o.createdAt).toLocaleDateString('en-IN'))}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>{isExp ? '▲ Collapse' : '▼ Details'}</div>
          </div>
        </div>

        {isExp && (
          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '1rem 1.25rem', background: 'var(--gray-50)' }}>
            {/* Timeline */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8, color: 'var(--gray-700)' }}>Order Timeline</div>
              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                {[
                  { step: 'Ordered', done: true },
                  { step: 'Paid (Escrow)', done: ['payment_done', 'dispatched', 'delivered'].includes(o.status) },
                  { step: 'Dispatched', done: ['dispatched', 'delivered'].includes(o.status) },
                  { step: 'You Confirmed', done: o.status === 'delivered' },
                  { step: 'Payment Released', done: o.paymentReleased || o.status === 'delivered' },
                ].map((t, idx, arr) => (
                  <React.Fragment key={t.step}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 65 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                        background: t.done ? 'var(--green-dark)' : 'var(--gray-200)', color: t.done ? '#fff' : 'var(--gray-400)'
                      }}>
                        {t.done ? '✓' : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.62rem', marginTop: 3, textAlign: 'center', color: t.done ? 'var(--green-dark)' : 'var(--gray-400)', fontWeight: t.done ? 600 : 400 }}>
                        {t.step}
                      </div>
                    </div>
                    {idx < arr.length - 1 && <div style={{ flex: 1, height: 2, background: t.done ? 'var(--green-dark)' : 'var(--gray-200)', marginTop: 12, minWidth: 8 }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Payment ref */}
            {o.paymentRef && (
              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                💳 Payment Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.paymentRef}</span>
                {o.paymentReleased && <span style={{ marginLeft: 8, background: '#d8f3dc', color: 'var(--green-dark)', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>💰 RELEASED TO FARMER</span>}
                {!o.paymentReleased && ['payment_done', 'dispatched'].includes(o.status) && <span style={{ marginLeft: 8, background: '#fff3e0', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>🔒 HELD BY AGROAI</span>}
              </div>
            )}

            {/* Waiting for dispatch */}
            {isPaid && (
              <div className="alert alert-blue">
                <span className="alert-icon">🔒</span>
                <div>Your payment of <strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong> is securely held by <strong>AgroAI</strong>. Farmer has your delivery address and will dispatch the goods soon. Payment will only be released after you confirm delivery.</div>
              </div>
            )}

            {/* Confirm receipt */}
            {isDisp && (
              <div style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #a5b4fc', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                <div style={{ fontWeight: 700, color: '#3730a3', marginBottom: 4 }}>📦 Have you received the goods?</div>
                <div style={{ fontSize: '0.82rem', color: '#4338ca', marginBottom: 12 }}>
                  The farmer has dispatched the goods. Once you confirm receipt, <strong>AgroAI will release ₹{o.totalAmount?.toLocaleString('en-IN') || o.amount}</strong> from escrow to the farmer.
                </div>
                <button className="btn btn-primary" disabled={confirming[oid]} onClick={() => handleConfirmReceipt(oid)}
                  style={{ background: '#6366f1', borderColor: '#6366f1' }}>
                  {confirming[oid] ? '⏳ Confirming…' : '✅ Yes, I Received the Goods — Release Payment'}
                </button>
              </div>
            )}

            {isDone && (
              <>
                <div className="alert alert-green">
                  <span className="alert-icon">🎉</span>
                  <div>
                    <strong>Transaction Complete!</strong> You confirmed receipt and AgroAI has released ₹{o.totalAmount?.toLocaleString('en-IN')} from escrow to the farmer. Thank you for using AgroAI!
                  </div>
                </div>

                {/* Order Timeline */}
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '14px', marginTop: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10 }}>📍 Order Timeline</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                    {[
                      { icon: '🛒', label: 'Ordered', date: o.createdAt, done: true },
                      { icon: '🔒', label: 'Escrowed', date: o.paidAt, done: !!o.paidAt },
                      { icon: '🚛', label: 'Dispatched', date: o.dispatchedAt, done: !!o.dispatchedAt },
                      { icon: '✅', label: 'Delivered', date: o.deliveredAt, done: !!o.deliveredAt },
                    ].map((s, si, arr) => (
                      <React.Fragment key={s.label}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: s.done ? 'var(--green-dark)' : 'var(--gray-200)', fontSize: '0.9rem',
                          }}>{s.done ? s.icon : '•'}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: 4, color: s.done ? 'var(--green-dark)' : 'var(--gray-400)' }}>{s.label}</div>
                          {s.date && <div style={{ fontSize: '0.6rem', color: 'var(--gray-400)' }}>{new Date(s.date).toLocaleDateString('en-IN')}</div>}
                        </div>
                        {si < arr.length - 1 && (
                          <div style={{ flex: 1, height: 2, background: s.done ? 'var(--green-dark)' : 'var(--gray-200)', marginTop: 15, minWidth: 20 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Rate this Order */}
                {!reviewedOrders.has(oid) && reviewOrder !== oid && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => { e.stopPropagation(); setReviewOrder(oid); setReviewRating(5); setReviewComment(''); }}
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', fontWeight: 700 }}
                    >⭐ Rate this Order</button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await invoiceAPI.download(oid);
                          const blob = new Blob([res.data], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        } catch { alert('Failed to generate invoice'); }
                      }}
                      style={{ fontWeight: 600 }}
                    >📄 Download Invoice</button>
                  </div>
                )}
                {reviewedOrders.has(oid) && (
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--green-dark)', fontWeight: 600 }}>✅ Review submitted — Thank you!</div>
                )}

                {/* Review Form */}
                {reviewOrder === oid && (
                  <div style={{ marginTop: 10, background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 8 }}>⭐ Rate your experience</div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setReviewRating(s)}
                          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: s <= reviewRating ? 1 : 0.3 }}>
                          ⭐
                        </button>
                      ))}
                      <span style={{ marginLeft: 8, fontSize: '0.82rem', fontWeight: 600, color: '#92400e' }}>{reviewRating}/5</span>
                    </div>
                    <textarea
                      placeholder="Share your experience with this farmer..."
                      value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid #e5e7eb', fontSize: '0.82rem', minHeight: 60, resize: 'vertical', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-primary" disabled={reviewSubmitting} onClick={() => handleSubmitReview(o)}
                        style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                        {reviewSubmitting ? '⏳ Submitting...' : '⭐ Submit Review'}
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setReviewOrder(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {o.status === 'pending' && (
              <div className="alert alert-blue">
                <span className="alert-icon">💳</span>
                <div>Payment pending. <button onClick={() => navigate('/marketplace')} style={{ color: 'var(--green-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Go to Marketplace →</button></div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px', marginBottom: 8 }}>
        Buyer Panel
      </div>
      {SIDEBAR.map(s => (
        <div key={s.id} className={`sidebar-item ${tab === s.id ? 'active' : ''}`}
          onClick={() => s.id === 'marketplace' ? navigate('/marketplace') : s.id === 'settings' ? navigate('/settings') : setTab(s.id)}>
          {s.icon} {s.label}
          {s.id === 'orders' && orders.filter(o => o.status === 'dispatched').length > 0 && (
            <span style={{ marginLeft: 'auto', background: '#6366f1', color: '#fff', borderRadius: 9, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
              {orders.filter(o => o.status === 'dispatched').length}
            </span>
          )}
        </div>
      ))}
    </>
  );

  return (
    <DashShell sidebar={sidebarContent}>

      <div className="dash-main">
        <div className="dash-header">
          <div className="dash-title">👋 Welcome, {user?.name?.split(' ')[0]}</div>
          <div className="dash-sub">{`Buyer · ${user?.address?.state || 'India'}`}</div>
        </div>

        {actionMsg && (
          <div className={`alert ${actionMsg.startsWith('❌') ? 'alert-red' : 'alert-green'} animate-fadeIn`} style={{ margin: '0 0 1rem' }}>
            <div>{actionMsg}</div>
            <button onClick={() => setActionMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {loading ? (
          <div className="flex-center" style={{ minHeight: 300 }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>🛒</div><div>Loading…</div></div>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="animate-fadeUp">
                <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
                  {stats.map(s => (
                    <div key={s.label} className="stat-card"
                      onClick={() => s.label === 'Awaiting Receipt' && setTab('orders')}
                      style={{ cursor: s.label === 'Awaiting Receipt' ? 'pointer' : 'default' }}>
                      <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>{s.icon}</div>
                      <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                  ))}
                </div>

                {/* Pending receipt alert */}
                {orders.filter(o => o.status === 'dispatched').length > 0 && (
                  <div style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', border: '1px solid #a5b4fc', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: '2rem' }}>📦</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#3730a3' }}>
                        {orders.filter(o => o.status === 'dispatched').length} shipment{orders.filter(o => o.status === 'dispatched').length > 1 ? 's' : ''} waiting for your confirmation
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#4338ca', marginTop: 2 }}>
                        Farmer has dispatched the goods — confirm receipt to release payment
                      </div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setTab('orders')}
                      style={{ background: '#6366f1', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
                      Confirm Receipt →
                    </button>
                  </div>
                )}

                {/* Charts */}
                <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>💸 Spending Trend</div>
                    <LineChart labels={chartData.months}
                      datasets={[{ label: 'Spend (₹)', data: chartData.spend, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' }]}
                      height={200} />
                  </div>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>📦 Order Status Breakdown</div>
                    <DoughnutChart
                      labels={['Pending', 'Paid', 'Dispatched', 'Delivered', 'Cancelled']}
                      data={[orderStatuses.pending || 0, orderStatuses.payment_done || 0, orderStatuses.dispatched || 0, orderStatuses.delivered || 1, orderStatuses.cancelled || 0]}
                      colors={['#9ca3af', '#f59e0b', '#6366f1', '#52b788', '#ef4444']}
                      height={200} />
                  </div>
                </div>

                <div className="ai-insight" style={{ marginBottom: '1.75rem' }}>
                  <div className="ai-insight-label">🤖 AI Buying Tip</div>
                  <div className="ai-insight-value">Best time to buy Tomatoes — prices at 3-month low</div>
                  <div className="ai-insight-sub">Seasonal dip expected for next 2 weeks · Save up to 18%</div>
                </div>

                {/* Market prices */}
                <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-title" style={{ marginBottom: '1rem' }}>💹 Current Market Prices (₹/Qtl)</div>
                  <HBarChart labels={cropLabels.length > 0 ? cropLabels : ['No orders yet']} data={cropLabels.length > 0 ? cropPrices : [0]}
                    color={['rgba(45,106,79,0.75)', 'rgba(59,130,246,0.75)', 'rgba(244,162,97,0.75)', 'rgba(239,68,68,0.75)', 'rgba(168,85,247,0.75)', 'rgba(20,184,166,0.75)', 'rgba(251,191,36,0.75)', 'rgba(99,102,241,0.75)']}
                    height={240} />
                </div>

                {/* Fresh listings preview */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-title" style={{ margin: 0 }}>🌾 Fresh Listings</div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace')}>Browse All →</button>
                  </div>
                  <div className="resp-crop-grid" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
                    {CROPS.slice(0, 6).map(c => (
                      <div key={c.id} className="crop-card" onClick={() => navigate('/marketplace')} style={{ cursor: 'pointer', overflow: 'hidden', borderRadius: 12 }}>
                        <div style={{ width: '100%', height: 110, overflow: 'hidden', position: 'relative' }}>
                          <img
                            src={getCropImageByName(c.name, c.category)}
                            alt={c.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          <span style={{
                            position: 'absolute', top: 6, right: 6,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                            color: '#fff', fontSize: '0.62rem', fontWeight: 600,
                            padding: '2px 7px', borderRadius: 99, textTransform: 'capitalize',
                          }}>{c.category}</span>
                        </div>
                        <div className="crop-card-body">
                          <div className="crop-card-name">{c.name}</div>
                          <div className="crop-card-farmer">👨‍🌾 {c.farmer}</div>
                          <div className="crop-card-price">₹{c.price}/Qtl</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders summary */}
                <div className="card">
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-title" style={{ margin: 0 }}>My Recent Orders</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('orders')}>View All</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Order</th><th>Crop</th><th>Farmer</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {orders.slice(0, 4).map((o, i) => (
                          <tr key={o._id || o.id || i} style={{ cursor: 'pointer' }} onClick={() => { setTab('orders'); setExpandedOrder(o._id || o.id); }}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>#{(o._id || o.id || '').slice(-6)}</td>
                            <td>{o.crop?.name || o.crop}</td>
                            <td>{o.farmer?.name || o.farmer}</td>
                            <td style={{ fontWeight: 700 }}>{o.totalAmount ? `₹${o.totalAmount.toLocaleString('en-IN')}` : o.amount}</td>
                            <td><SBadge status={o.status} /></td>
                          </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No orders yet — <span style={{ color: 'var(--green-mid)', cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>browse crops →</span></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── MY ORDERS ── */}
            {tab === 'orders' && (
              <div className="animate-fadeUp">
                <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                  <div className="section-title" style={{ margin: 0 }}>My Orders ({orders.length})</div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace')}>+ New Order</button>
                </div>

                {orders.length > 0 && (
                  <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div className="card card-pad">
                      <div className="section-title" style={{ marginBottom: '1rem' }}>📦 Status Breakdown</div>
                      <DoughnutChart
                        labels={['Pending', 'Paid', 'Dispatched', 'Delivered', 'Cancelled']}
                        data={[orderStatuses.pending, orderStatuses.payment_done, orderStatuses.dispatched, orderStatuses.delivered, orderStatuses.cancelled]}
                        colors={['#9ca3af', '#f59e0b', '#6366f1', '#52b788', '#ef4444']}
                        height={190} />
                    </div>
                    <div className="card card-pad">
                      <div className="section-title" style={{ marginBottom: '1rem' }}>💸 Monthly Spending</div>
                      <BarChart labels={chartData.months}
                        datasets={[{ label: 'Spend (₹)', data: chartData.spend, color: 'rgba(59,130,246,0.7)', borderColor: 'rgba(59,130,246,1)' }]}
                        height={190} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((o, i) => <OrderCard key={o._id || o.id || i} o={o} i={i} />)}
                  {orders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)', background: '#fff', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 8 }}>🛒</div>
                      <div>No orders yet — <span style={{ color: 'var(--green-mid)', cursor: 'pointer' }} onClick={() => navigate('/marketplace')}>browse crops →</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── AI INSIGHTS ── */}
            {tab === 'ai' && (
              <div className="animate-fadeUp">
                <div className="section-title">🤖 AI Market Intelligence</div>

                <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>🔮 Market Price Checker</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Check fair price before you buy · ML model at localhost:8000</div>

                  <div className="resp-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div><label style={aiLabel}>State</label>
                      <select style={aiSelectStyle} value={mlState} onChange={e => handleMlStateChange(e.target.value)}>
                        <option value="">Select State</option>
                        {ML_STATES.map(s => <option key={s} value={s} style={{ color: '#111', background: '#fff' }}>{s}</option>)}
                      </select>
                    </div>
                    <div><label style={aiLabel}>District</label>
                      <select style={aiSelectStyle} value={mlDistrict} onChange={e => setMlDistrict(e.target.value)}>
                        <option value="">Select District</option>
                        {getDistrictsForState(mlState).map(d => <option key={d} value={d} style={{ color: '#111', background: '#fff' }}>{d}</option>)}
                      </select>
                    </div>
                    <div><label style={aiLabel}>Commodity</label>
                      <select style={aiSelectStyle} value={mlCommodity} onChange={e => setMlCommodity(e.target.value)}>
                        <option value="">Select Commodity</option>
                        {ML_COMMODITIES.map(c => <option key={c} value={c} style={{ color: '#111', background: '#fff' }}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={aiLabel}>Arrival Date (DD-MM-YYYY)</label>
                      <input type="text" value={mlDate} onChange={e => setMlDate(e.target.value)} style={aiSelectStyle} />
                    </div>
                    <button onClick={runMlPredict} disabled={mlLoading}
                      style={{ background: '#fff', color: 'var(--green-dark)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 22px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      {mlLoading ? '⏳…' : '🔮 Check'}
                    </button>
                  </div>
                  {mlError && <div style={{ marginTop: 10, fontSize: '0.78rem', background: 'rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '7px 10px' }}>⚠️ {mlError}</div>}
                  {mlResult && (
                    <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Fair Market Price</div>
                      <div style={{ fontWeight: 800, fontSize: '1.8rem' }}>
                        ₹{mlResult.price != null ? Number(mlResult.price).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}<span style={{ fontSize: '0.9rem', opacity: 0.6 }}>/Qtl</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>💡 Use this to negotiate a fair deal</div>
                    </div>
                  )}
                </div>

                <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-title" style={{ marginBottom: '1rem' }}>💹 Current Market Prices</div>
                  <HBarChart labels={cropLabels.length > 0 ? cropLabels : ['No orders yet']} data={cropLabels.length > 0 ? cropPrices : [0]}
                    color={['rgba(45,106,79,0.75)', 'rgba(59,130,246,0.75)', 'rgba(244,162,97,0.75)', 'rgba(239,68,68,0.75)', 'rgba(168,85,247,0.75)', 'rgba(20,184,166,0.75)', 'rgba(251,191,36,0.75)', 'rgba(99,102,241,0.75)']}
                    height={280} />
                </div>

                <div className="alert alert-blue" style={{ marginBottom: '1.25rem' }}>
                  <span className="alert-icon">💡</span>
                  <div>Predictions based on seasonal trends and demand data. Use the price checker above for live ML predictions.</div>
                </div>
                <div className="grid-2">
                  {AI_PREDICTIONS.map(p => (
                    <div key={p.crop} className="card card-pad">
                      <div className="flex-between">
                        <div><div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.crop}</div><div style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Current: {p.current}</div></div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: p.trend === 'up' ? '#dc2626' : 'var(--green-dark)' }}>{p.trend === 'up' ? '📈 Rising' : '📉 Falling'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{p.trend === 'down' ? '💡 Good time to buy' : '⚠️ Buy before prices rise'}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div className="progress-wrap"><div className="progress-fill" style={{ width: `${p.confidence}%` }} /></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 3 }}>Confidence: {p.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashShell>
  );
}