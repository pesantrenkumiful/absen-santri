import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setApiKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(apiKey.trim());
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    onSave('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
            <i className="fa-solid fa-microchip"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Pengaturan Google AI Studio API Key</h3>
            <p className="text-[11px] text-slate-500">Model: Google Gemini 3.8 Flash</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Custom Gemini API Key (Opsional):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Secara default, SIPONDOK telah tersambung ke backend server environment. Anda juga dapat menggunakan kunci AI Studio pribadi Anda jika diinginkan.
            </p>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition cursor-pointer"
            >
              Reset Default
            </button>
            <button
              type="submit"
              className="w-2/3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>Simpan API Key</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
