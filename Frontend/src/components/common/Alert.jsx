import React from 'react';

const Alert = ({ type = 'green', icon, children }) => (
  <div className={`alert alert-${type}`}>
    {icon && <span className="alert-icon">{icon}</span>}
    <div>{children}</div>
  </div>
);

export default Alert;
