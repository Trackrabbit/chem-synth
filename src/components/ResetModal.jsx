import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';

// ---------------------------------------------------------
// COMPONENT: ResetModal
// ---------------------------------------------------------
const ResetModal = ({ show, onClose, onConfirm, isResetting }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-red-400" /> Reset Laboratory?
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          This will permanently delete all your discovered elements and reset your cloud inventory. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={isResetting} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isResetting} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reset'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetModal;