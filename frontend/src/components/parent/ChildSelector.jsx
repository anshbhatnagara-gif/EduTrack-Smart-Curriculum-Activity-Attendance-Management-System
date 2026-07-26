import React, { useEffect, useState, useCallback } from 'react';
import { getMyChildrenApi } from '../../api/user.api';
import { UserCheck } from 'lucide-react';

const ChildSelector = ({ selectedChildId, onSelectChild }) => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyChildrenApi();
      if (res.success) {
        const list = res.data || [];
        setChildren(list);
        if (list.length > 0 && !selectedChildId && onSelectChild) {
          onSelectChild(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, onSelectChild]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  if (loading) {
    return <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl"></div>;
  }

  if (children.length === 0) {
    return <div className="text-xs text-slate-500 italic">No linked children found.</div>;
  }

  const selectedChild = children.find((c) => String(c.student_id) === String(selectedChildId)) || children[0];

  return (
    <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
        <UserCheck className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Child</p>
        <select
          value={selectedChild?.student_id || ''}
          onChange={(e) => {
            const found = children.find((c) => String(c.student_id) === String(e.target.value));
            if (found && onSelectChild) onSelectChild(found);
          }}
          className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer w-full"
        >
          {children.map((c) => (
            <option key={c.student_id} value={c.student_id}>
              {c.full_name} ({c.admission_number || `Roll: ${c.roll_number}`})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ChildSelector;
