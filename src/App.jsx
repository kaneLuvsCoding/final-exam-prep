import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentApp from './pages/StudentApp';
import QuestionsManager from './admin/QuestionsManager';
import AdminLogin from './admin/AdminLogin';
import './App.css';

import TechWritingPractice from './pages/TechWritingPractice';

// Protected Route Component
const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student App Route */}
        <Route path="/:subjectSlug" element={<StudentApp />} />
        <Route path="/" element={<Navigate to="/analysis-of-algorithm" replace />} />

        {/* Practice Routes */}
        <Route path="/practice/technical-writing" element={<TechWritingPractice onBack={() => window.history.back()} />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedAdminRoute>
            <QuestionsManager />
          </ProtectedAdminRoute>
        } />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
