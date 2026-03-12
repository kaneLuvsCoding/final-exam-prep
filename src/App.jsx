import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentApp from './pages/StudentApp';
import QuestionsManager from './admin/QuestionsManager';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student App Route */}
        <Route path="/" element={<StudentApp />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<QuestionsManager />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
