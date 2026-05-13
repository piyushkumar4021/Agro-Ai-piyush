import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { DoughnutChart, BarChart } from '../components/common/Charts';
import DashShell from '../components/layout/DashShell';

const SIDEBAR = [
  { id:'overview', icon:'📊', label:'Overview'          },
  { id:'users',    icon:'👥', label:'Users'             },
  { id:'crops',    icon:'🌾', label:'Pending Approvals' },
];

export default function AdminDashboard() {
  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ds, us, pc] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getUsers(),
          adminAPI.getPendingCrops(),
        ]);
        setStats(ds.data.stats || {});
        setUsers(us.data.users || []);
        setPending(pc.data.crops || []);
      } catch (e) {
        console.error('Admin load error', e);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const approveCrop = async (id) => {
    setApproving(id);
    try {
      await adminAPI.approveCrop(id);
      setPending(p => p.filter(c => c._id !== id));
    } finally { setApproving(null); }
  };

  const STAT_CARDS = stats ? [
    { icon:'👥', label:'Total Users',       value:(stats.totalUsers||0).toLocaleString('en-IN'),  color:'#dbeafe', iconColor:'#3b82f6' },
    { icon:'🌾', label:'Crop Listings',     value:(stats.totalCrops||0).toLocaleString('en-IN'),  color:'#d8f3dc', iconColor:'#52b788' },
    { icon:'📦', label:'Total Orders',      value:(stats.totalOrders||0).toLocaleString('en-IN'), color:'#fff3e0', iconColor:'#f4a261' },
    { icon:'💰', label:'Total GMV',         value:`₹${((stats.totalRevenue||0)/10000000).toFixed(1)}Cr`, color:'#fce7f3', iconColor:'#ec4899' },
    { icon:'⏳', label:'Pending Approvals', value:stats.pendingApprovals||pending.length, color:'#fef3c7', iconColor:'#d97706' },
    { icon:'✅', label:'Active Users',      value:(stats.activeUsers||0).toLocaleString('en-IN'),  color:'#dcfce7', iconColor:'#16a34a' },
  ] : [];

  const sidebarContent = (
    <>
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'4px 14px', marginBottom:8 }}>
        Admin Panel
      </div>
      {SIDEBAR.map(s => (
        <div key={s.id} className={`sidebar-item ${tab===s.id?'active':''}`} onClick={() => setTab(s.id)}>
          {s.icon} {s.label}
          {s.id==='crops' && pending.length > 0 && (
            <span style={{ marginLeft:'auto', background:'#dc2626', color:'#fff', borderRadius:99, padding:'1px 7px', fontSize:'0.65rem', fontWeight:700 }}>{pending.length}</span>
          )}
        </div>
      ))}
    </>
  );

  return (
    <DashShell sidebar={sidebarContent}>
      <div className="dash-main">
        <div className="dash-header">
          <div className="dash-title">⚙️ Admin Dashboard</div>
          <div className="dash-sub">AgroAI Platform Management</div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight:300 }}>
            <div style={{ textAlign:'center', color:'var(--gray-400)' }}><div style={{ fontSize:'2rem', marginBottom:8 }}>⚙️</div><div>Loading…</div></div>
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="animate-fadeUp">
                <div className="grid-3" style={{ marginBottom:'1.75rem' }}>
                  {STAT_CARDS.map(s => (
                    <div key={s.label} className="stat-card">
                      <div className="stat-icon" style={{ background:s.color, color:s.iconColor }}>{s.icon}</div>
                      <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                  ))}
                </div>

                {pending.length > 0 && (
                  <div className="alert alert-amber" style={{ marginBottom:'1.25rem' }}>
                    <span className="alert-icon">⚠️</span>
                    <div><strong>{pending.length} crop listings</strong> are waiting for your approval.</div>
                  </div>
                )}

                <div className="card" style={{ marginBottom:'1.5rem' }}>
                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid var(--gray-100)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div className="section-title" style={{ margin:0 }}>Recent Users</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('users')}>View All</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Name</th><th>Role</th><th>State</th><th>Status</th></tr></thead>
                      <tbody>
                        {users.slice(0,5).map((u,i) => (
                          <tr key={u._id||i}>
                            <td style={{ fontWeight:600 }}>{u.name}</td>
                            <td><span className={`badge ${u.role==='farmer'?'badge-green':u.role==='admin'?'badge-red':'badge-blue'}`} style={{ textTransform:'capitalize' }}>{u.role}</span></td>
                            <td style={{ color:'var(--gray-500)' }}>{u.address?.state||'—'}</td>
                            <td><span className={`badge ${u.isActive!==false?'badge-green':'badge-amber'}`}>{u.isActive!==false?'Active':'Inactive'}</span></td>
                          </tr>
                        ))}
                        {users.length===0 && <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--gray-400)', padding:'1.5rem' }}>No users yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid var(--gray-100)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div className="section-title" style={{ margin:0 }}>Pending Crop Approvals</div>
                    <button className="btn btn-secondary btn-sm" onClick={() => setTab('crops')}>View All</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Crop</th><th>Farmer</th><th>Category</th><th>Price</th><th>Action</th></tr></thead>
                      <tbody>
                        {pending.slice(0,4).map(c => (
                          <tr key={c._id}>
                            <td style={{ fontWeight:600 }}>{c.name}</td>
                            <td>{c.farmer?.name}</td>
                            <td><span className="badge badge-green" style={{ textTransform:'capitalize' }}>{c.category}</span></td>
                            <td>₹{c.pricePerUnit}/Qtl</td>
                            <td>
                              <button className="btn btn-primary btn-sm" disabled={approving===c._id} onClick={() => approveCrop(c._id)}>
                                {approving===c._id?'…':'✅ Approve'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pending.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--gray-400)', padding:'1.5rem' }}>All caught up ✅</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>👥 Users by Role</div>
                    <DoughnutChart
                      labels={['Farmers', 'Buyers', 'Admin']}
                      data={[
                        users.filter(u => u.role === 'farmer').length,
                        users.filter(u => u.role === 'buyer').length,
                        users.filter(u => u.role === 'admin').length,
                      ]}
                      colors={['#52b788', '#3b82f6', '#ef4444']}
                      height={200} />
                  </div>
                  <div className="card card-pad">
                    <div className="section-title" style={{ marginBottom: '1rem' }}>📊 Platform Stats</div>
                    <BarChart
                      labels={['Users', 'Crops', 'Orders', 'Pending']}
                      datasets={[{
                        label: 'Count',
                        data: [stats?.totalUsers || 0, stats?.totalCrops || 0, stats?.totalOrders || 0, pending.length],
                        color: 'rgba(45,106,79,0.7)',
                        borderColor: 'rgba(45,106,79,1)',
                      }]}
                      height={200} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="animate-fadeUp">
                <div className="section-title">All Users ({users.length})</div>
                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>State</th><th>Status</th></tr></thead>
                      <tbody>
                        {users.map((u,i) => (
                          <tr key={u._id||i}>
                            <td style={{ fontWeight:600 }}>{u.name}</td>
                            <td style={{ color:'var(--gray-500)', fontSize:'0.82rem' }}>{u.email||'—'}</td>
                            <td><span className={`badge ${u.role==='farmer'?'badge-green':u.role==='admin'?'badge-red':'badge-blue'}`} style={{ textTransform:'capitalize' }}>{u.role}</span></td>
                            <td style={{ color:'var(--gray-500)', fontSize:'0.82rem' }}>{u.phone||'—'}</td>
                            <td style={{ color:'var(--gray-500)' }}>{u.address?.state||'—'}</td>
                            <td><span className={`badge ${u.isActive!==false?'badge-green':'badge-amber'}`}>{u.isActive!==false?'Active':'Inactive'}</span></td>
                          </tr>
                        ))}
                        {users.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--gray-400)', padding:'2rem' }}>No users</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'crops' && (
              <div className="animate-fadeUp">
                <div className="flex-between" style={{ marginBottom:'1.25rem' }}>
                  <div className="section-title" style={{ margin:0 }}>Pending Crop Approvals ({pending.length})</div>
                </div>
                <div className="card">
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Crop</th><th>Farmer</th><th>Email</th><th>Category</th><th>Qty</th><th>Price</th><th>Action</th></tr></thead>
                      <tbody>
                        {pending.map(c => (
                          <tr key={c._id}>
                            <td style={{ fontWeight:600 }}>{c.name}</td>
                            <td>{c.farmer?.name}</td>
                            <td style={{ fontSize:'0.78rem', color:'var(--gray-500)' }}>{c.farmer?.email}</td>
                            <td><span className="badge badge-green" style={{ textTransform:'capitalize' }}>{c.category}</span></td>
                            <td>{c.quantity} Qtl</td>
                            <td>₹{c.pricePerUnit}/Qtl</td>
                            <td>
                              <button className="btn btn-primary btn-sm" disabled={approving===c._id} onClick={() => approveCrop(c._id)}>
                                {approving===c._id?'…':'✅ Approve'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {pending.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--gray-400)', padding:'2rem' }}>All crops reviewed ✅</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashShell>
  );
}
