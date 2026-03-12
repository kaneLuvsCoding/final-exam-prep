import React from 'react';
import QuestionsManager from './QuestionsManager';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Admin Panel</h2>
        <p className="text-slate-600">
          Manage your study materials here. Changes made below will reflect in the Student App once it is configured to read from Supabase.
        </p>
      </div>
      
      {/* Questions CRUD Manager */}
      <QuestionsManager />
      
    </div>
  );
}
