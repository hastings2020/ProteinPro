import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import BackendStatus from './components/BackendStatus';
import Home from './components/Home';
import History from './components/History';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import { fetchUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = 1; // Default user

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await fetchUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading ProteinPro...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <BackendStatus />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/history" element={<History user={user} />} />
            <Route path="/calendar" element={<Calendar user={user} />} />
            <Route path="/analytics" element={<Analytics user={user} />} />
            <Route path="/settings" element={<Settings user={user} updateUser={updateUserSettings} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Navbar />
      </div>
    </Router>
  );
}

export default App;
