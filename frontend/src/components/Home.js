import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt, FaCopy, FaCalendar, FaStar, FaRegStar } from 'react-icons/fa';
import './Home.css';
import { fetchEntriesByDate, addEntry, deleteEntry, updateEntry, addFavorite } from '../services/api';
import AddEntryModal from './AddEntryModal';
import QuickAddModal from './QuickAddModal';
import Notification from './Notification';

const Home = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCopyMenu, setShowCopyMenu] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      loadEntries();
    }
  }, [user, selectedDate]);

  const loadEntries = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchEntriesByDate(user.id, selectedDate);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
      const errorMsg = error.message.includes('Network Error') || error.code === 'ERR_NETWORK'
        ? 'Cannot connect to backend. Please start the backend server: cd backend && npm run dev'
        : 'Failed to load entries. Make sure the backend is running.';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (entryData) => {
    if (!user || !user.id) {
      showNotification('User not loaded yet. Please wait...', 'error');
      return;
    }

    try {
      const newEntry = await addEntry({
        ...entryData,
        user_id: user.id,
        entry_date: selectedDate,
        quantity: entryData.quantity || 1
      });
      setEntries([...entries, newEntry]);
      setShowAddModal(false);
      setShowQuickAdd(false);
      showNotification('Food entry added successfully!', 'success');
    } catch (error) {
      console.error('Error adding entry:', error);
      let errorMsg = 'Failed to add entry';

      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to backend. Start backend with: cd backend && npm run dev';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else {
        errorMsg = 'Failed to add entry. Make sure the backend is running on http://localhost:5001';
      }

      showNotification(errorMsg, 'error');
    }
  };

  const handleEditEntry = async (entryData) => {
    try {
      const updated = await updateEntry(editingEntry.id, entryData);
      setEntries(entries.map(e => e.id === editingEntry.id ? updated : e));
      setEditingEntry(null);
      setShowAddModal(false);
      showNotification('Entry updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating entry:', error);
      showNotification('Failed to update entry', 'error');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteEntry(entryId);
      setEntries(entries.filter(e => e.id !== entryId));
      showNotification('Entry deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification('Failed to delete entry', 'error');
    }
  };

  const handleUpdateQuantity = async (entry, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const updated = await updateEntry(entry.id, {
        ...entry,
        quantity: newQuantity,
        protein_grams: (entry.protein_grams / (entry.quantity || 1)) * newQuantity,
        calories: entry.calories ? (entry.calories / (entry.quantity || 1)) * newQuantity : null,
        carbs: entry.carbs ? (entry.carbs / (entry.quantity || 1)) * newQuantity : null,
        fat: entry.fat ? (entry.fat / (entry.quantity || 1)) * newQuantity : null,
      });
      setEntries(entries.map(e => e.id === entry.id ? updated : e));
      showNotification('Quantity updated!', 'success');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification('Failed to update quantity', 'error');
    }
  };

  const handleCopyEntry = async (entry, targetDate) => {
    try {
      const newEntry = await addEntry({
        ...entry,
        user_id: user.id,
        entry_date: targetDate,
        id: undefined
      });
      if (targetDate === selectedDate) {
        setEntries([...entries, newEntry]);
      }
      showNotification(`Entry copied to ${targetDate}!`, 'success');
      setShowCopyMenu(false);
    } catch (error) {
      console.error('Error copying entry:', error);
      showNotification('Failed to copy entry', 'error');
    }
  };

  const handleAddToFavorites = async (entry) => {
    try {
      await addFavorite({
        user_id: user.id,
        food_name: entry.food_name,
        protein_grams: entry.protein_grams / (entry.quantity || 1), // Store per-serving amount
        calories: entry.calories ? entry.calories / (entry.quantity || 1) : null,
        serving_size: entry.serving_size
      });
      showNotification('Added to favorites!', 'success');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      showNotification('Failed to add to favorites', 'error');
    }
  };

  const getCopyOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return [
      { label: 'Today', date: today.toISOString().split('T')[0] },
      { label: 'Yesterday', date: yesterday.toISOString().split('T')[0] },
      { label: 'Last Week', date: lastWeek.toISOString().split('T')[0] }
    ];
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setShowAddModal(true);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  if (!user) {
    return (
      <div className="page home-page">
        <div className="loading-text">Loading user data...</div>
      </div>
    );
  }

  const target = user.daily_protein_target || 150;
  const totalProtein = entries.reduce((sum, entry) => sum + (parseFloat(entry.protein_grams) || 0), 0);
  const remaining = target - totalProtein;
  const progressPercentage = Math.min((totalProtein / target) * 100, 100);

  // Goal status indicator
  const getGoalStatus = () => {
    const percentage = (totalProtein / target) * 100;
    if (percentage >= 100) return { emoji: '🎉', color: '#4caf50', text: 'Goal Achieved!' };
    if (percentage >= 80) return { emoji: '💪', color: '#ff9800', text: 'Almost There!' };
    if (percentage >= 50) return { emoji: '👍', color: '#2196f3', text: 'Making Progress!' };
    return { emoji: '🚀', color: '#9e9e9e', text: 'Keep Going!' };
  };

  const goalStatus = getGoalStatus();

  return (
    <div className="page home-page">
      <h1 className="page-title">Daily Protein Tracker</h1>

      {/* Date Selector */}
      <div className="date-selector">
        <FaCalendar />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="date-input"
        />
        <span className="date-label">
          {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
        </span>
      </div>

      {/* Progress Circle with Goal Status */}
      <div className="progress-card">
        <div className="goal-status-banner" style={{ backgroundColor: goalStatus.color }}>
          <span className="goal-emoji">{goalStatus.emoji}</span>
          <span className="goal-text">{goalStatus.text}</span>
        </div>

        <div className="progress-circle">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              className="progress-circle-bg"
              cx="100"
              cy="100"
              r="85"
            />
            <circle
              className="progress-circle-fill"
              cx="100"
              cy="100"
              r="85"
              strokeDasharray={`${progressPercentage * 5.34} 534`}
              strokeDashoffset="0"
              style={{ stroke: goalStatus.color }}
            />
          </svg>
          <div className="progress-text">
            <div className="progress-amount">{Math.round(totalProtein)}g</div>
            <div className="progress-target">of {target}g</div>
            <div className="progress-percentage">{Math.round(progressPercentage)}%</div>
          </div>
        </div>

        <div className="progress-stats">
          <div className="stat">
            <span className="stat-label">Remaining</span>
            <span className="stat-value" style={{ color: remaining < 0 ? goalStatus.color : '#666' }}>
              {Math.abs(Math.round(remaining))}g {remaining < 0 ? 'over' : ''}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Entries</span>
            <span className="stat-value">{entries.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Calories</span>
            <span className="stat-value">{entries.reduce((sum, e) => sum + (e.calories || 0), 0)}</span>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="add-buttons">
        <button className="btn btn-success btn-quick-add" onClick={() => setShowQuickAdd(true)}>
          <FaBolt /> Quick Add
        </button>
        <button className="btn btn-primary btn-add-food" onClick={openAddModal}>
          <FaPlus /> Full Entry
        </button>
      </div>

      {/* Today's Entries - Compact View */}
      <div className="card">
        <h2 className="card-header">
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Foods" : `Foods for ${selectedDate}`}
        </h2>
        {loading ? (
          <div className="loading-text">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p>No entries yet for this date. Start tracking your protein!</p>
          </div>
        ) : (
          <div className="entries-list compact">
            {entries.map(entry => (
              <div key={entry.id} className="entry-item-compact">
                <div className="entry-left">
                  <h3 className="entry-name-compact">{entry.food_name}</h3>
                  <div className="entry-meta">
                    {entry.serving_size && <span className="serving-badge">{entry.serving_size}</span>}
                    {entry.meal_type && <span className="meal-badge-small">{entry.meal_type}</span>}
                  </div>
                </div>

                <div className="entry-middle">
                  <div className="quantity-control">
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(entry, (entry.quantity || 1) - 1)}
                    >
                      -
                    </button>
                    <span className="qty-display">x {entry.quantity || 1}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(entry, (entry.quantity || 1) + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="entry-right">
                  <div className="protein-compact">{Math.round(entry.protein_grams)}g</div>
                  <div className="entry-actions-inline">
                    <button
                      className="btn-icon-tiny"
                      onClick={() => handleAddToFavorites(entry)}
                      title="Add to favorites"
                    >
                      <FaStar />
                    </button>
                    <button
                      className="btn-icon-tiny"
                      onClick={() => {
                        setEditingEntry(entry);
                        setShowCopyMenu(entry.id);
                      }}
                      title="Copy to..."
                    >
                      <FaCopy />
                    </button>
                    <button
                      className="btn-icon-tiny"
                      onClick={() => openEditModal(entry)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-icon-tiny btn-danger"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Copy Menu */}
                {showCopyMenu === entry.id && (
                  <div className="copy-menu">
                    <div className="copy-menu-header">Copy to:</div>
                    {getCopyOptions().map(option => (
                      <button
                        key={option.date}
                        className="copy-option"
                        onClick={() => handleCopyEntry(entry, option.date)}
                      >
                        {option.label} ({option.date})
                      </button>
                    ))}
                    <button
                      className="copy-option copy-cancel"
                      onClick={() => setShowCopyMenu(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSubmit={handleAddEntry}
        />
      )}

      {/* Add/Edit Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
          onSubmit={editingEntry ? handleEditEntry : handleAddEntry}
          editingEntry={editingEntry}
          user={user}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Home;
