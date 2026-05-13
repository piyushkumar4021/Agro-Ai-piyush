import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { notificationAPI } from '../../services/api';

const NAV_LINKS = {
  farmer: [
    { path:'/farmer',     label:'📊 Dashboard' },
    { path:'/crop-add',   label:'➕ Add Crop'  },
    { path:'/marketplace',label:'🌾 Market'    },
  ],
  buyer: [
    { path:'/buyer',      label:'📊 Dashboard' },
    { path:'/marketplace',label:'🛒 Marketplace'},
  ],
  admin: [
    { path:'/admin',      label:'📊 Dashboard' },
    { path:'/marketplace',label:'🌾 Market'    },
  ],
};

const TYPE_COLORS = {
  order_placed:       '#3b82f6',
  payment_received:   '#22c55e',
  order_dispatched:   '#f59e0b',
  delivery_confirmed: '#10b981',
  payment_released:   '#8b5cf6',
  order_cancelled:    '#ef4444',
  payment_settings:   '#6366f1',
  system:             '#64748b',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  if (!user) return null;
  const links = NAV_LINKS[user.role] || [];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch unread count on mount and every 30s
  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Fetch full notifications when panel opens
  const openNotifications = async () => {
    setShowNotif(v => !v);
    setShowMenu(false);
    if (!showNotif) {
      setLoading(true);
      try {
        const res = await notificationAPI.getAll({ limit: 20 });
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="nav-brand">Agro<span>AI</span></div>

      {/* Desktop nav links — hidden on mobile via CSS */}
      <div className="nav-links">
        {links.map(l => (
          <a
            key={l.path} href={l.path}
            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
            onClick={e => { e.preventDefault(); navigate(l.path); }}
          >
            {l.label}
          </a>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {/* ── Dark Mode Toggle ── */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', padding: '6px 10px', borderRadius: 8,
            transition: 'background 0.15s',
            color: darkMode ? '#fbbf24' : '#64748b',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* ── Notification Bell ── */}
        <div ref={notifRef} style={{ position:'relative' }}>
          <button
            onClick={openNotifications}
            aria-label="Notifications"
            style={{
              position:'relative', background:'none', border:'none', cursor:'pointer',
              fontSize:'1.25rem', padding:'6px 10px', borderRadius:8,
              transition:'background 0.15s',
              color: showNotif ? '#fff' : 'rgba(255,255,255,0.7)',
              background: showNotif ? 'rgba(255,255,255,0.12)' : 'transparent',
            }}
            onMouseEnter={e => { if (!showNotif) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (!showNotif) e.currentTarget.style.background = 'transparent'; }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position:'absolute', top:2, right:4,
                background:'#ef4444', color:'#fff',
                fontSize:'0.6rem', fontWeight:800,
                minWidth:16, height:16, borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'0 4px', border:'2px solid var(--green-deep)',
                animation:'notifPop 0.3s ease',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Notification dropdown ── */}
          {showNotif && (
            <div className="notif-dropdown" style={{
              position:'absolute', right:0, top:'calc(100% + 8px)',
              background:'#fff', borderRadius:14,
              boxShadow:'0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
              width:380, maxHeight:'70vh', zIndex:1000,
              display:'flex', flexDirection:'column',
              animation:'fadeDown 0.2s ease',
            }}>
              {/* Header */}
              <div style={{
                padding:'14px 16px', borderBottom:'1px solid #f1f5f9',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#1e293b' }}>
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft:8, background:'#ef4444', color:'#fff', fontSize:'0.65rem',
                      fontWeight:700, padding:'2px 7px', borderRadius:10,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      fontSize:'0.75rem', color:'#3b82f6', fontWeight:600,
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ overflowY:'auto', maxHeight:'55vh', flex:1 }}>
                {loading ? (
                  <div style={{ padding:'2rem', textAlign:'center', color:'#94a3b8' }}>
                    <div style={{ fontSize:'1.5rem', marginBottom:8, animation:'spin 0.8s linear infinite', display:'inline-block' }}>⏳</div>
                    <div style={{ fontSize:'0.82rem' }}>Loading…</div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
                    <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🔕</div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem', color:'#64748b' }}>No notifications yet</div>
                    <div style={{ fontSize:'0.78rem', color:'#94a3b8', marginTop:4 }}>
                      You'll see updates here when orders are placed, payments received, etc.
                    </div>
                  </div>
                ) : (
                  notifications.map(n => {
                    const color = TYPE_COLORS[n.type] || '#64748b';
                    return (
                      <div
                        key={n._id}
                        onClick={() => { if (!n.read) markRead(n._id); }}
                        style={{
                          padding:'12px 16px',
                          borderBottom:'1px solid #f8fafc',
                          cursor: n.read ? 'default' : 'pointer',
                          background: n.read ? '#fff' : '#f0f9ff',
                          transition:'background 0.15s',
                          display:'flex', gap:12, alignItems:'flex-start',
                        }}
                        onMouseEnter={e => { if (!n.read) e.currentTarget.style.background='#e0f2fe'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = n.read ? '#fff' : '#f0f9ff'; }}
                      >
                        {/* Icon */}
                        <div style={{
                          width:36, height:36, borderRadius:'50%', flexShrink:0,
                          background:`${color}15`, border:`1px solid ${color}30`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'1rem',
                        }}>
                          {n.icon || '🔔'}
                        </div>

                        {/* Content */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                            <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#1e293b' }}>
                              {n.title}
                            </span>
                            {!n.read && (
                              <span style={{
                                width:7, height:7, borderRadius:'50%', background:'#3b82f6',
                                flexShrink:0,
                              }}/>
                            )}
                          </div>
                          <div style={{
                            fontSize:'0.78rem', color:'#64748b', lineHeight:1.4,
                            overflow:'hidden', textOverflow:'ellipsis',
                            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                          }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{
                              width:6, height:6, borderRadius:'50%',
                              background:color, display:'inline-block',
                            }}/>
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{
                  padding:'10px', textAlign:'center', borderTop:'1px solid #f1f5f9',
                  fontSize:'0.78rem', color:'#64748b',
                }}>
                  Showing last {notifications.length} notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User profile dropdown ── */}
        <div ref={menuRef} style={{ position:'relative' }}>
          <div
            style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}
            onClick={() => { setShowMenu(v => !v); setShowNotif(false); }}
          >
            <div className="nav-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="nav-user-info" style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
              <span style={{ fontSize:'0.82rem', fontWeight:700, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</span>
              <span style={{ fontSize:'0.7rem', color:'var(--gray-400)', textTransform:'capitalize' }}>{user.role}</span>
            </div>
            <span className="nav-user-arrow" style={{ fontSize:'0.7rem', color:'var(--gray-400)' }}>▾</span>
          </div>

          {showMenu && (
            <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', borderRadius:'var(--radius)', boxShadow:'var(--shadow-lg)', border:'1px solid var(--gray-200)', minWidth:200, zIndex:999, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--gray-100)' }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem' }}>{user.name}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>{user.email}</div>
              </div>

              {/* Mobile nav links — shown only on mobile via CSS class "mobile-menu-links" */}
              <div className="mobile-menu-links">
                {links.map(l => (
                  <div
                    key={l.path}
                    onClick={() => { navigate(l.path); setShowMenu(false); }}
                    style={{
                      padding:'10px 16px', fontSize:'0.85rem', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:8,
                      color: location.pathname === l.path ? 'var(--green-dark)' : '#374151',
                      fontWeight: location.pathname === l.path ? 700 : 500,
                      background: location.pathname === l.path ? '#f0fdf4' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = location.pathname === l.path ? '#f0fdf4' : '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = location.pathname === l.path ? '#f0fdf4' : 'transparent'}
                  >
                    {l.label}
                  </div>
                ))}
                <div style={{ borderTop:'1px solid var(--gray-100)' }} />
              </div>

              <div
                onClick={() => { navigate('/settings'); setShowMenu(false); }}
                style={{ padding:'11px 16px', fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#374151' }}
                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                ⚙️ Settings
              </div>
              <div
                onClick={handleLogout}
                style={{ padding:'11px 16px', fontSize:'0.875rem', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
                onMouseEnter={e=>e.currentTarget.style.background='#fee2e2'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                🚪 Sign Out
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes notifPop {
          0%   { transform: scale(0); }
          50%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </nav>
  );
}
