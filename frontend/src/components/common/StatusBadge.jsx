import React from 'react';

const StatusBadge = ({ status = 'active' }) => {
  const normalized = String(status).toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  if (normalized === 'active' || normalized === 'present' || normalized === 'good' || normalized === 'resolved') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized === 'inactive' || normalized === 'absent' || normalized === 'at_risk' || normalized === 'unresolved') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (normalized === 'pending' || normalized === 'late' || normalized === 'needs_attention') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized === 'leave') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
