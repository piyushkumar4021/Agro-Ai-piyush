import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropAPI, orderAPI, mlAPI } from '../services/api';
import { AI_PREDICTIONS } from '../data/mockData';
import { ML_STATES, ML_COMMODITIES, getDistrictsForState, todayForModel } from '../data/mlData';
import { LineChart, BarChart, DoughnutChart } from '../components/common/Charts';
import DashShell from '../components/layout/DashShell';


// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { badge: 'badge-gray', label: 'Awaiting Payment', icon: '⏳' },
  payment_done: { badge: 'badge-amber', label: 'Escrowed by AgroAI — Dispatch Now', icon: '🔒' },
  dispatched: { badge: 'badge-blue', label: 'Dispatched — Awaiting Confirmation', icon: '🚛' },
  delivered: { badge: 'badge-green', label: 'Delivered — Payment Released', icon: '💰' },
  cancelled: { badge: 'badge-red', label: 'Cancelled', icon: '❌' },
  refunded: { badge: 'badge-red', label: 'Refunded', icon: '↩️' },
  // legacy
  confirmed: { badge: 'badge-blue', label: 'Confirmed', icon: '✅' },
};
const SBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || { badge: 'badge-gray', label: status, icon: '•' };
  return <span className={`badge ${c.badge}`}>{c.icon} {c.label}</span>;
};

const SIDEBAR_ITEMS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'listings', icon: '🌾', label: 'My Listings' },
  { id: 'orders', icon: '📦', label: 'Incoming Orders' },
  { id: 'earnings', icon: '💰', label: 'Earnings' },
  { id: 'ai', icon: '🤖', label: 'AI Predictions' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];



export default function FarmerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Expanded order detail
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dispatching, setDispatching] = useState({});

  // ML predictor
  const [mlState, setMlState] = useState('');
  const [mlDistrict, setMlDistrict] = useState('');
  const [mlCommodity, setMlCommodity] = useState('');
  const [mlDate, setMlDate] = useState(todayForModel());
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  // Transaction detail view
  const [txnOrder, setTxnOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, or] = await Promise.all([cropAPI.getMyCrops(), orderAPI.getFarmerOrders()]);
      setCrops(cr.data.crops || []);
      setOrders(or.data.orders || []);
    } catch (e) { console.error('Load error', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDispatch = async (orderId) => {
    setDispatching(p => ({ ...p, [orderId]: true }));
    try {
      await orderAPI.confirmDispatch(orderId);
      setActionMsg('✅ Dispatch confirmed! Buyer has been notified to confirm receipt.');
      setExpandedOrder(null);
      await load();
    } catch (e) {
      setActionMsg('❌ ' + (e.response?.data?.message || e.message));
    } finally {
      setDispatching(p => ({ ...p, [orderId]: false }));
      setTimeout(() => setActionMsg(''), 5000);
    }
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

  // Reset district when state changes in ML predictor
  const handleMlStateChange = (val) => {
    setMlState(val);
    setMlDistrict('');
  };

  const totalRevenue = orders
    .filter(o => ['delivered', 'payment_done', 'dispatched'].includes(o.status))
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  // Earnings calculations
  const totalEarned = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const inEscrow = orders.filter(o => ['payment_done', 'dispatched'].includes(o.status)).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingPayment = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalSales = orders.filter(o => o.status === 'delivered').length;
  const cancelledAmount = orders.filter(o => o.status === 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0);

  // Per-crop earnings
  const cropEarnings = {};
  orders.filter(o => o.status === 'delivered').forEach(o => {
    const name = o.crop?.name || 'Unknown';
    if (!cropEarnings[name]) cropEarnings[name] = { qty: 0, amount: 0, count: 0 };
    cropEarnings[name].qty += o.quantity || 0;
    cropEarnings[name].amount += o.totalAmount || 0;
    cropEarnings[name].count += 1;
  });

  // All transactions sorted by date
  const allTransactions = [...orders]
    .filter(o => o.status !== 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = [
    { icon: '🌾', label: 'Active Listings', value: crops.filter(c => c.status === 'available' || c.status).length, color: '#d8f3dc', iconColor: '#52b788' },
    { icon: '💰', label: 'Needs Dispatch', value: orders.filter(o => o.status === 'payment_done').length, color: '#fff3e0', iconColor: '#f4a261' },
    { icon: '🚛', label: 'Dispatched', value: orders.filter(o => o.status === 'dispatched').length, color: '#dbeafe', iconColor: '#3b82f6' },
    { icon: '✅', label: 'Completed', value: orders.filter(o => o.status === 'delivered').length, color: '#d8f3dc', iconColor: '#52b788' },
  ];

  // Compute real monthly revenue & order count (last 6 months)
  const computeFarmerMonthly = () => {
    const now = new Date();
    const months = [];
    const revenue = [];
    const orderCounts = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('en-IN', { month: 'short' }));
      const monthOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const od = new Date(o.createdAt);
        return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() && o.status !== 'cancelled';
      });
      revenue.push(monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0));
      orderCounts.push(monthOrders.length);
    }
    return { months, revenue, orderCounts };
  };
  const farmerChart = computeFarmerMonthly();

  // Per-crop revenue for bar chart
  const cropRevenue = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    const name = o.crop?.name || 'Other';
    if (!cropRevenue[name]) cropRevenue[name] = { revenue: 0, count: 0 };
    cropRevenue[name].revenue += o.totalAmount || 0;
    cropRevenue[name].count += 1;
  });
  const cropChartLabels = Object.keys(cropRevenue).sort((a, b) => cropRevenue[b].revenue - cropRevenue[a].revenue).slice(0, 6);
  const cropChartRevenue = cropChartLabels.map(l => cropRevenue[l].revenue);
  const cropChartOrders = cropChartLabels.map(l => cropRevenue[l].count);

  const aiSelectStyle = {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-sm)', color: '#fff', padding: '8px 10px', fontSize: '0.82rem', width: '100%',
  };
  const aiLabel = { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4, display: 'block' };

  const sidebarContent = (
    <>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 14px', marginBottom: 8 }}>
        Farmer Panel
      </div>
      {SIDEBAR_ITEMS.map(s => (
        <div key={s.id} className={`sidebar-item ${tab === s.id ? 'active' : ''}`}
          onClick={() => s.id === 'settings' ? navigate('/settings') : setTab(s.id)}>
          {s.icon} {s.label}
          {s.id === 'orders' && orders.filter(o => o.status === 'payment_done').length > 0 && (
            <span style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', borderRadius: 9, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>
              {orders.filter(o => o.status === 'payment_done').length}
            </span>
          )}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div className="sidebar-item" onClick={() => navigate('/crop-add')}
        style={{ background: 'var(--green-mid)', color: '#fff', marginTop: 'auto', justifyContent: 'center', fontWeight: 700 }}>
        ➕ Add Crop
      </div>
    </>
  );

  return (
    <DashShell sidebar={sidebarContent}>

      {/* Main */}
      <div className="dash-main">
        <div className="dash-header">
          <div className="dash-title">👋 Welcome, {user?.name?.split(' ')[0]}</div>
          <div className="dash-sub">{`📍 ${user?.address?.state || 'India'} · Last updated just now`}</div>
        </div>

        {actionMsg && (
          <div className={`alert ${actionMsg.startsWith('❌') ? 'alert-red' : 'alert-green'} animate-fadeIn`} style={{ margin: '0 0 1rem' }}>
            <div>{actionMsg}</div>
            <button onClick={() => setActionMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
        )}

        {loading ? (
          <div className="flex-center" style={{ minHeight: 300 }}>
            <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}><div style={{ fontSize: '2rem', marginBottom: 8 }}>🌾</div><div>Loading…</div></div>
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="animate-fadeUp">
                <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
                  {stats.map(s => (
                    <div key={s.label} className="stat-card" onClick={() => s.label === 'Needs Dispatch' && setTab('orders')}
                      style={{ cursor: s.label === 'Needs Dispatch' ? 'pointer' : 'default' }}>
                      <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>{s.icon}</div>
                      <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                  ))}
                </div>

                {/* Urgent dispatch alert */}
                {orders.filter(o => o.status === 'payment_done').length > 0 && (
                  <div style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', border: '1px solid #fed7aa', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: '2rem' }}>💰</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#92400e' }}>
                        {orders.filter(o => o.status === 'payment_done').length} order{orders.filter(o => o.status === 'payment_done').length > 1 ? 's' : ''} awaiting dispatch
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: 2 }}>
                        Buyer has paid — please dispatch the goods and confirm shipment
                      </div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setTab('orders')}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
                      View Orders →
                    </button>
                  </div>
                )}

                {/* Charts */}
                <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>📈 Revenue Trend</div>
                    <LineChart labels={farmerChart.months}
                      datasets={[{ label: 'Revenue (₹)', data: farmerChart.revenue, color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)' }]}
                      height={200} />
                  </div>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>📦 Orders Per Month</div>
                    <BarChart labels={farmerChart.months}
                      datasets={[{ label: 'Orders', data: farmerChart.orderCounts, color: 'rgba(59,130,246,0.75)', borderColor: 'rgba(59,130,246,1)' }]}
                      height={200} />
                  </div>
                </div>

                {/* Recent orders */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-title" style={{ margin: 0 }}>Recent Orders</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('orders')}>View All</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Order</th><th>Buyer</th><th>Crop</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {orders.slice(0, 4).map((o, i) => (
                          <tr key={o._id || o.id || i} style={{ cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === (o._id || o.id) ? null : (o._id || o.id))}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>#{(o._id || o.id || '').slice(-6)}</td>
                            <td>{o.buyer?.name || o.buyer}</td>
                            <td>{o.crop?.name || o.crop}</td>
                            <td style={{ fontWeight: 700 }}>{o.totalAmount ? `₹${o.totalAmount.toLocaleString('en-IN')}` : o.amount}</td>
                            <td><SBadge status={o.status} /></td>
                          </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No orders yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card card-pad">
                  <div className="section-title" style={{ marginBottom: '1rem' }}>🌾 Current vs Predicted Prices</div>
                  <BarChart labels={cropChartLabels.length > 0 ? cropChartLabels : ['No data']}
                    datasets={[
                      { label: 'Revenue (₹)', data: cropChartLabels.length > 0 ? cropChartRevenue : [0], color: 'rgba(45,106,79,0.7)', borderColor: 'rgba(45,106,79,1)' },
                      { label: 'Orders', data: cropChartLabels.length > 0 ? cropChartOrders : [0], color: 'rgba(244,162,97,0.7)', borderColor: 'rgba(244,162,97,1)' },
                    ]} height={220} />
                </div>
              </div>
            )}

            {/* ── MY LISTINGS ── */}
            {tab === 'listings' && (
              <div className="animate-fadeUp">
                <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                  <div className="section-title" style={{ margin: 0 }}>My Crop Listings ({crops.length})</div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/crop-add')}>➕ Add New Crop</button>
                </div>
                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Crop</th><th>Price</th><th>Quantity</th><th>Grade</th><th>Status</th></tr></thead>
                      <tbody>
                        {crops.map((c, i) => (
                          <tr key={c._id || c.id || i}>
                            <td style={{ fontWeight: 600 }}>{c.name || c.crop}</td>
                            <td>{c.pricePerUnit ? `₹${c.pricePerUnit}/Qtl` : c.price}</td>
                            <td>{c.quantity ? `${c.quantity} Qtl` : c.qty}</td>
                            <td><span className="badge badge-green">{c.qualityGrade || c.grade || 'B'}</span></td>
                            <td><SBadge status={c.status || 'available'} /></td>
                          </tr>
                        ))}
                        {crops.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No listings yet. <span style={{ color: 'var(--green-mid)', cursor: 'pointer' }} onClick={() => navigate('/crop-add')}>Add your first crop →</span></td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── INCOMING ORDERS ── */}
            {tab === 'orders' && (
              <div className="animate-fadeUp">
                <div className="section-title">Incoming Orders ({orders.length})</div>

                {/* Charts */}
                {orders.length > 0 && (
                  <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div className="card card-pad">
                      <div className="section-title" style={{ marginBottom: '1rem' }}>Order Status Breakdown</div>
                      <DoughnutChart
                        labels={['Awaiting Payment', 'Paid / Ready', 'Dispatched', 'Delivered', 'Cancelled']}
                        data={[
                          orders.filter(o => o.status === 'pending').length,
                          orders.filter(o => o.status === 'payment_done').length,
                          orders.filter(o => o.status === 'dispatched').length,
                          orders.filter(o => o.status === 'delivered').length,
                          orders.filter(o => o.status === 'cancelled').length,
                        ]}
                        colors={['#9ca3af', '#f59e0b', '#3b82f6', '#52b788', '#ef4444']}
                        height={200} />
                    </div>
                    <div className="card card-pad">
                      <div className="section-title" style={{ marginBottom: '1rem' }}>📈 Order Volume</div>
                      <LineChart labels={farmerChart.months} datasets={[{ label: 'Orders', data: farmerChart.orderCounts, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' }]} height={200} />
                    </div>
                  </div>
                )}

                {/* Order cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((o, i) => {
                    const oid = o._id || o.id;
                    const isExpanded = expandedOrder === oid;
                    const isPaid = o.status === 'payment_done';
                    const isDisp = o.status === 'dispatched';
                    const isDone = o.status === 'delivered';
                    const addr = o.deliveryAddress;

                    return (
                      <div key={oid || i} className="card" style={{ border: isPaid ? '2px solid #f59e0b' : '1px solid var(--gray-100)' }}>
                        {/* Order header — always visible */}
                        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }}
                          onClick={() => setExpandedOrder(isExpanded ? null : oid)}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--gray-400)' }}>#{(oid || '').slice(-6)}</span>
                              <SBadge status={o.status} />
                              {isPaid && <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>ACTION NEEDED</span>}
                            </div>
                            <div style={{ fontWeight: 700 }}>{o.crop?.name || o.crop} · {o.quantity ? `${o.quantity} Qtl` : ''}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>👤 {o.buyer?.name || o.buyer}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--green-dark)' }}>
                              {o.totalAmount ? `₹${o.totalAmount.toLocaleString('en-IN')}` : o.amount}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{o.date || (o.createdAt && new Date(o.createdAt).toLocaleDateString('en-IN'))}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>{isExpanded ? '▲ Collapse' : '▼ View Details'}</div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '1rem 1.25rem', background: 'var(--gray-50)' }}>

                            {/* Payment status timeline */}
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8, color: 'var(--gray-700)' }}>Order Timeline</div>
                              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                                {[
                                  { step: 'Order Placed', done: true, icon: '🛒' },
                                  { step: 'Payment Done', done: o.paymentStatus === 'escrowed' || o.paymentStatus === 'released' || ['payment_done', 'dispatched', 'delivered'].includes(o.status), icon: '💳' },
                                  { step: 'Dispatched', done: o.farmerDispatched || ['dispatched', 'delivered'].includes(o.status), icon: '🚛' },
                                  { step: 'Delivered', done: o.status === 'delivered', icon: '✅' },
                                  { step: 'Payment Released', done: o.paymentReleased || o.paymentStatus === 'released', icon: '💰' },
                                ].map((t, idx, arr) => (
                                  <React.Fragment key={t.step}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
                                      <div style={{
                                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem',
                                        background: t.done ? 'var(--green-dark)' : 'var(--gray-200)', color: t.done ? '#fff' : 'var(--gray-400)'
                                      }}>
                                        {t.done ? '✓' : t.icon}
                                      </div>
                                      <div style={{ fontSize: '0.63rem', marginTop: 3, textAlign: 'center', color: t.done ? 'var(--green-dark)' : 'var(--gray-400)', fontWeight: t.done ? 600 : 400 }}>
                                        {t.step}
                                      </div>
                                    </div>
                                    {idx < arr.length - 1 && (
                                      <div style={{ flex: 1, height: 2, background: t.done ? 'var(--green-dark)' : 'var(--gray-200)', marginTop: 13, minWidth: 10 }} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>

                            {/* Buyer address — only shown after payment */}
                            {(isPaid || isDisp || isDone) && addr ? (
                              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--green-dark)', fontSize: '0.85rem', marginBottom: 8 }}>
                                  📦 Buyer Delivery Address
                                  <span style={{ fontSize: '0.7rem', marginLeft: 8, background: '#bbf7d0', padding: '2px 6px', borderRadius: 4 }}>Visible after payment</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>
                                  <div style={{ fontWeight: 600 }}>{addr.name || o.buyer?.name || o.buyer}</div>
                                  <div>📞 {addr.phone || o.buyer?.phone || o.buyerPhone || '—'}</div>
                                  <div>🏠 {[addr.street, addr.village, addr.district, addr.state, addr.pincode].filter(Boolean).join(', ') || '—'}</div>
                                </div>
                              </div>
                            ) : o.status === 'pending' ? (
                              <div style={{ background: '#fef3c7', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400e' }}>
                                🔒 Buyer address will be revealed once payment is completed
                              </div>
                            ) : null}

                            {/* Payment info — Escrow status */}
                            {o.paymentRef && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                                💳 Payment Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{o.paymentRef}</span>
                                {' · '}{o.paymentMethod?.toUpperCase()}
                                {!o.paymentReleased && ['payment_done', 'dispatched'].includes(o.status) && (
                                  <span style={{ marginLeft: 8, background: '#fff3e0', color: '#92400e', borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>🔒 HELD BY AGROAI</span>
                                )}
                                {(o.paymentReleased || o.status === 'delivered') && (
                                  <span style={{ marginLeft: 8, background: '#d8f3dc', color: '#166534', borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>💰 RELEASED TO YOU</span>
                                )}
                              </div>
                            )}

                            {/* View Transaction Button */}
                            {(isPaid || isDisp || isDone) && (
                              <div style={{ marginBottom: '1rem' }}>
                                <button
                                  className="btn btn-sm"
                                  onClick={(e) => { e.stopPropagation(); setTxnOrder(txnOrder === oid ? null : oid); }}
                                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontWeight: 700 }}
                                >
                                  {txnOrder === oid ? '✕ Close' : '💳 View Transaction'}
                                </button>

                                {txnOrder === oid && (
                                  <div style={{
                                    marginTop: 12, background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 'var(--radius)',
                                    padding: '1.25rem', color: '#fff', animation: 'fadeUp 0.3s ease',
                                  }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                      💳 Transaction Details
                                      <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 4 }}>ORDER #{(oid || '').slice(-6)}</span>
                                    </div>

                                    <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Buyer Name</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{o.buyer?.name || '—'}</div>
                                      </div>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Amount</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#6ee7b7' }}>₹{o.totalAmount?.toLocaleString('en-IN') || '—'}</div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Payment Method</div>
                                        <div style={{ fontWeight: 600 }}>{(o.paymentMethod || 'UPI').toUpperCase()}</div>
                                      </div>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Payment Ref</div>
                                        <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.82rem' }}>{o.paymentRef || '—'}</div>
                                      </div>
                                    </div>

                                    {/* Buyer Payment Details (UPI / Bank) */}
                                    {o.buyer?.paymentDetails && (
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700 }}>Buyer Account Details</div>
                                        {o.buyer.paymentDetails.upiId && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: '1rem' }}>📱</span>
                                            <div>
                                              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>UPI ID</div>
                                              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{o.buyer.paymentDetails.upiId}</div>
                                            </div>
                                          </div>
                                        )}
                                        {o.buyer.paymentDetails.bankAccountNumber && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                              <span style={{ fontSize: '1rem' }}>🏦</span>
                                              <div>
                                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)' }}>Account Holder</div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.buyer.paymentDetails.bankAccountHolderName || '—'}</div>
                                              </div>
                                            </div>
                                            <div style={{ marginLeft: 28, fontSize: '0.8rem' }}>
                                              A/C: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.buyer.paymentDetails.bankAccountNumber}</span>
                                              {o.buyer.paymentDetails.bankIfscCode && <span> · IFSC: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.buyer.paymentDetails.bankIfscCode}</span></span>}
                                            </div>
                                          </div>
                                        )}
                                        {!o.buyer.paymentDetails.upiId && !o.buyer.paymentDetails.bankAccountNumber && (
                                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Buyer has not configured payment details yet</div>
                                        )}
                                      </div>
                                    )}

                                    <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Paid On</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{o.paidAt ? new Date(o.paidAt).toLocaleString('en-IN') : '—'}</div>
                                      </div>
                                      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Buyer Email</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{o.buyer?.email || '—'}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Dispatch button */}
                            {isPaid && (
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>🚛 Ready to Dispatch</div>
                                <div style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: 4 }}>
                                  Payment of <strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong> is secured in AgroAI escrow.
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: 10, fontStyle: 'italic' }}>
                                  🔒 Once the buyer confirms delivery, AgroAI will release the payment to your account.
                                </div>
                                <button
                                  className="btn btn-primary"
                                  disabled={dispatching[oid]}
                                  onClick={() => handleDispatch(oid)}
                                  style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                                  {dispatching[oid] ? '⏳ Confirming…' : '🚛 Confirm Dispatch'}
                                </button>
                              </div>
                            )}

                            {isDisp && (
                              <div className="alert alert-blue">
                                <span className="alert-icon">⏳</span>
                                <div>Goods dispatched — waiting for buyer to confirm receipt. Once confirmed, <strong>AgroAI will release ₹{o.totalAmount?.toLocaleString('en-IN')}</strong> from escrow to your account.</div>
                              </div>
                            )}

                            {isDone && (
                              <div className="alert alert-green">
                                <span className="alert-icon">💰</span>
                                <div>
                                  <strong>Payment Released by AgroAI!</strong> ₹{o.totalAmount?.toLocaleString('en-IN')} has been released from escrow to your account. The buyer confirmed receipt of goods.
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {orders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gray-400)', background: '#fff', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 8 }}>📦</div>
                      <div>No orders yet — list your crops to start selling</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── AI PREDICTIONS ── */}
            {tab === 'ai' && (
              <div className="animate-fadeUp">
                <div className="section-title">🤖 AI Price Intelligence</div>

                <div style={{ background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>🔮 Live Price Predictor</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>ML model · localhost:8000/predict-price</div>

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
                      {mlLoading ? '⏳…' : '🔮 Predict'}
                    </button>
                  </div>
                  {mlError && <div style={{ marginTop: 10, fontSize: '0.78rem', background: 'rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '7px 10px' }}>⚠️ {mlError}</div>}
                  {mlResult && (
                    <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Predicted Modal Price</div>
                      <div style={{ fontWeight: 800, fontSize: '1.8rem' }}>
                        ₹{mlResult.price != null ? Number(mlResult.price).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}<span style={{ fontSize: '0.9rem', opacity: 0.6 }}>/Qtl</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
                  <div className="section-title" style={{ marginBottom: '1rem' }}>📊 Current vs Predicted Prices</div>
                  <BarChart labels={cropChartLabels.length > 0 ? cropChartLabels : ['No data']}
                    datasets={[
                      { label: 'Revenue (₹)', data: cropChartLabels.length > 0 ? cropChartRevenue : [0], color: 'rgba(45,106,79,0.75)', borderColor: 'rgba(45,106,79,1)' },
                      { label: 'Orders', data: cropChartLabels.length > 0 ? cropChartOrders : [0], color: 'rgba(244,162,97,0.75)', borderColor: 'rgba(244,162,97,1)' },
                    ]} height={250} />
                </div>

                <div className="grid-2">
                  {AI_PREDICTIONS.map(p => (
                    <div key={p.crop} className="card card-pad">
                      <div className="flex-between">
                        <div><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.crop}</div><div style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Current: {p.current}</div></div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: p.trend === 'up' ? 'var(--green-dark)' : '#dc2626' }}>{p.trend === 'up' ? '↑' : '↓'} {p.predicted}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>Next Week</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div className="progress-wrap"><div className="progress-fill" style={{ width: `${p.confidence}%` }} /></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: 2 }}>Confidence: {p.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── EARNINGS ── */}
            {tab === 'earnings' && (
              <div className="animate-fadeUp">
                <div className="section-title">💰 Earnings & Payouts</div>

                {/* Earnings cards */}
                <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
                  {[
                    { icon: '💰', label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: '#d8f3dc', iconColor: '#52b788', sub: `${totalSales} completed sales` },
                    { icon: '🔒', label: 'In Escrow', value: `₹${inEscrow.toLocaleString('en-IN')}`, color: '#fff3e0', iconColor: '#f4a261', sub: 'Held by AgroAI' },
                    { icon: '⏳', label: 'Awaiting Payment', value: `₹${pendingPayment.toLocaleString('en-IN')}`, color: '#dbeafe', iconColor: '#3b82f6', sub: 'Buyer hasn\'t paid yet' },
                    { icon: '📊', label: 'Lifetime Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#e8daef', iconColor: '#8e44ad', sub: 'Including escrow' },
                  ].map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>{s.icon}</div>
                      <div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginTop: 2 }}>{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Escrow explainer */}
                <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.75rem', color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>🛡️ How AgroAI Escrow Works</div>
                  <div className="resp-grid-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { step: '1', icon: '🛒', title: 'Buyer Orders', desc: 'Buyer places an order for your crop' },
                      { step: '2', icon: '🔒', title: 'Payment Escrowed', desc: 'Money held safely by AgroAI' },
                      { step: '3', icon: '📦', title: 'Buyer Confirms', desc: 'Buyer confirms receipt of goods' },
                      { step: '4', icon: '💰', title: 'You Get Paid', desc: 'AgroAI releases money to you' },
                    ].map(s => (
                      <div key={s.step} style={{ textAlign: 'center' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '1.1rem' }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{s.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-Crop earnings breakdown */}
                {Object.keys(cropEarnings).length > 0 && (
                  <div className="card" style={{ marginBottom: '1.75rem' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                      <div className="section-title" style={{ margin: 0 }}>🌾 Earnings by Crop</div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Crop</th><th>Orders</th><th>Qty Sold</th><th>Total Earned</th><th>Avg/Order</th></tr></thead>
                        <tbody>
                          {Object.entries(cropEarnings).sort((a, b) => b[1].amount - a[1].amount).map(([name, data]) => (
                            <tr key={name}>
                              <td style={{ fontWeight: 700 }}>{name}</td>
                              <td>{data.count}</td>
                              <td>{data.qty} Qtl</td>
                              <td style={{ fontWeight: 700, color: 'var(--green-dark)' }}>₹{data.amount.toLocaleString('en-IN')}</td>
                              <td>₹{Math.round(data.amount / data.count).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Transaction history */}
                <div className="card">
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="section-title" style={{ margin: 0 }}>📋 Transaction History</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{allTransactions.length} transactions</div>
                      {allTransactions.length > 0 && (
                        <button className="btn btn-sm btn-secondary" onClick={() => {
                          const headers = ['Date', 'Crop', 'Buyer', 'Amount', 'Status', 'Payout'];
                          const rows = allTransactions.map(o => [
                            o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '',
                            o.crop?.name || '',
                            o.buyer?.name || '',
                            o.totalAmount || 0,
                            o.status || '',
                            o.status === 'delivered' ? 'Paid' : ['payment_done', 'dispatched'].includes(o.status) ? 'In Escrow' : o.status === 'cancelled' ? 'Cancelled' : 'Pending',
                          ]);
                          const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `AgroAI_Earnings_${new Date().toISOString().slice(0,10)}.csv`;
                          a.click(); URL.revokeObjectURL(url);
                        }} style={{ fontSize: '0.72rem' }}>
                          📥 Export CSV
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Date</th><th>Crop</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Payout</th></tr></thead>
                      <tbody>
                        {allTransactions.map((o, i) => {
                          const oid = o._id || o.id;
                          const isReleased = o.status === 'delivered';
                          const isEscrowed = ['payment_done', 'dispatched'].includes(o.status);
                          const isCancelled = o.status === 'cancelled';
                          return (
                            <tr key={oid || i}>
                              <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                              <td style={{ fontWeight: 600 }}>{o.crop?.name || '—'}</td>
                              <td>{o.buyer?.name || '—'}</td>
                              <td style={{ fontWeight: 700 }}>₹{(o.totalAmount || 0).toLocaleString('en-IN')}</td>
                              <td><SBadge status={o.status} /></td>
                              <td>
                                {isReleased && <span style={{ background: '#d8f3dc', color: '#166534', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>💰 Paid</span>}
                                {isEscrowed && <span style={{ background: '#fff3e0', color: '#92400e', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>🔒 In Escrow</span>}
                                {isCancelled && <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>✕ Cancelled</span>}
                                {!isReleased && !isEscrowed && !isCancelled && <span style={{ color: 'var(--gray-400)', fontSize: '0.72rem' }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                        {allTransactions.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>No transactions yet — earnings will appear here after your first sale</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary footer */}
                {cancelledAmount > 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--gray-400)', display: 'flex', gap: 16 }}>
                    <span>❌ Cancelled orders total: ₹{cancelledAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashShell>
  );
}