import React from 'react';

const StatCard = ({ label, value, change, changeType = 'pos', icon }) => (
  <div className="stat-card animate-fadeUp">
    {icon && <div className="stat-icon">{icon}</div>}
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {change && <div className={`stat-change ${changeType}`}>{change}</div>}
  </div>
);

export default StatCard;
