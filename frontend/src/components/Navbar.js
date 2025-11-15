import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaHistory, FaCalendarAlt, FaChartBar, FaCog } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="bottom-navbar">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <FaHome className="nav-icon" />
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <FaHistory className="nav-icon" />
        <span className="nav-label">History</span>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <FaCalendarAlt className="nav-icon" />
        <span className="nav-label">Calendar</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <FaChartBar className="nav-icon" />
        <span className="nav-label">Analytics</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <FaCog className="nav-icon" />
        <span className="nav-label">Settings</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;
