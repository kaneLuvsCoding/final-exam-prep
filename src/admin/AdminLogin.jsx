import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'studyAdm!n26') {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      navigate('/admin');
    } else {
      setError('Invalid password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#171717] rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#077d8a]/10 text-[#077d8a] mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Admin Access</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Please enter the administrator password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#077d8a] transition-all"
                autoFocus
              />
              {error && (
                <p className="text-rose-500 text-sm mt-3 font-medium animate-shake">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#077d8a] hover:bg-[#066d79] text-white rounded-xl font-black shadow-lg shadow-[#077d8a]/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Login to Admin Panel
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-bold transition-colors"
          >
            &larr; Back to Student Hub
          </button>
        </div>
      </div>
    </div>
  );
}
