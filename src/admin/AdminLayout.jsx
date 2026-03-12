import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#045c66] text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-2xl font-black tracking-tighter">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin" 
            className="block px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium"
          >
            Dashboard
          </Link>
          <Link 
            to="/" 
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            &larr; Back to App
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center px-6 md:px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
