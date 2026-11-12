import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-xl mb-3">
          <i className="fa-solid fa-circle-question"></i>
        </div>
        <h3 className="text-base font-bold text-slate-800 text-center mb-1">{title}</h3>
        <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">{message}</p>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            type="button"
            className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
