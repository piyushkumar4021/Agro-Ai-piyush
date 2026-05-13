import React, { useState } from 'react';

/**
 * DashShell — Wrapper for dashboard pages providing a slidable sidebar.
 * 
 * Usage:
 *   <DashShell sidebar={<Sidebar ... />}>
 *     <div className="dash-main"> ... </div>
 *   </DashShell>
 */
export default function DashShell({ sidebar, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dash-shell">
      {/* Sidebar toggle button — always visible on left edge */}
      <button
        className={`sidebar-toggle${open ? ' shifted' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      >
        {open ? '◀' : '▶'}
      </button>

      {/* Backdrop — closes sidebar on click */}
      <div
        className={`sidebar-backdrop${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar with open/close class */}
      <div className={`dash-sidebar${open ? ' sidebar-open' : ''}`}>
        {sidebar}
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
