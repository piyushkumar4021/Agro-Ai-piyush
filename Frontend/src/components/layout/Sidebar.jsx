import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

// badgeCounts: { orders: 3, pending: 2 } — maps item.id to a live count
const Sidebar = ({ items, activeItem, onItemClick, profile, badgeCounts = {} }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside className="sidebar">
      {/* Profile */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar" style={profile?.avatarStyle || {}}>
          {profile?.initials || 'U'}
        </div>
        <div className="sidebar-name">{profile?.name}</div>
        <div className="sidebar-role">{profile?.role} · {profile?.location}</div>
        <div style={{ marginTop: 8 }}>
          <Badge status={profile?.badge || 'verified'}>{profile?.badgeLabel || 'Verified'}</Badge>
        </div>
      </div>

      {/* Nav Sections */}
      {items.map((section, si) => (
        <div className="sidebar-section" key={si}>
          {section.label && <div className="sidebar-section-label">{section.label}</div>}
          {section.items.map((item, ii) => {
            // Live badge count from badgeCounts prop, fallback to static item.badge
            const liveBadge = badgeCounts[item.id];
            const badge     = liveBadge != null ? liveBadge : item.badge;
            return (
              <button
                key={ii}
                className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'logout') { handleLogout(); return; }
                  if (item.href) { navigate(item.href); return; }
                  onItemClick && onItemClick(item.id);
                }}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {badge != null && badge > 0 && (
                  <span className="sidebar-badge">{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
