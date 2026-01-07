
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes, Delete',
  cancelText = 'No, Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className={`p-10 flex flex-col items-center text-center ${type === 'danger' ? 'bg-red-50/30' : 'bg-amber-50/30'}`}>
          <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-8 shadow-xl ${
            type === 'danger' ? 'bg-white text-red-600 shadow-red-100' : 'bg-white text-amber-600 shadow-amber-100'
          }`}>
            <AlertTriangle size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-3">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed px-4">{message}</p>
        </div>
        
        <div className="p-10 flex gap-4 bg-white">
          <button 
            onClick={onCancel}
            className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-5 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] ${
              type === 'danger' 
                ? 'bg-red-600 shadow-red-200 hover:bg-red-700' 
                : 'bg-amber-600 shadow-amber-200 hover:bg-amber-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
