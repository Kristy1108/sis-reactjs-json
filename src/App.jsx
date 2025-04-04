import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from '../Components/LoginPage';
import Dashboard from '../Components/Dashboard';
import Students from '../Components/Students';
import Teachers from '../Components/Teachers';
import Courses from '../Components/Courses';
import GradeManagement from '../Components/GradeManagement';
import MainLayout from '../Components/MainLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<MainLayout title="Dashboard"><Dashboard /></MainLayout>} />
        <Route path="/students" element={<MainLayout title="Students"><Students /></MainLayout>} />
        <Route path="/teachers" element={<MainLayout title="Teachers"><Teachers /></MainLayout>} />
        <Route path="/courses" element={<MainLayout title="Courses"><Courses /></MainLayout>} />
        <Route path="/grade-management" element={<MainLayout title="Grade Management"><GradeManagement /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;