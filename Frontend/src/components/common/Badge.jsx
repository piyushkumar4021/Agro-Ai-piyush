import React from 'react';

const variantMap = {
  green:  'badge-green',
  amber:  'badge-amber',
  red:    'badge-red',
  blue:   'badge-blue',
  gray:   'badge-gray',
  purple: 'badge-purple',
  // status aliases
  active:     'badge-green',
  delivered:  'badge-green',
  verified:   'badge-green',
  transit:    'badge-amber',
  pending:    'badge-amber',
  pendingKYC: 'badge-amber',
  processing: 'badge-blue',
  review:     'badge-blue',
  retraining: 'badge-amber',
  inactive:   'badge-gray',
};

const labelMap = {
  active:     'Active',
  delivered:  'Delivered',
  verified:   'Verified ✓',
  transit:    'In Transit',
  pending:    'Pending',
  pendingKYC: 'Pending KYC',
  processing: 'Processing',
  review:     'Under Review',
  retraining: 'Retraining',
  inactive:   'Inactive',
  farmer:     '🌾 Farmer',
  buyer:      '🏢 Buyer',
  admin:      '⚙️ Admin',
};

const Badge = ({ status, variant, children }) => {
  const cls = variantMap[status] || variantMap[variant] || 'badge-gray';
  const label = children ?? (labelMap[status] || status);
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default Badge;
