import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt, FaCopy, FaStar, FaChevronLeft, FaChevronRight, FaFire, FaUtensils, FaBullseye } from 'react-icons/fa';
import './Home.css';
import { fetchEntriesByDate, addEntry, deleteEntry, updateEntry, addFavorite } from '../services/api';
import AddEntryModal from './AddEntryModal';
import QuickAddModal from './QuickAddModal';
import Notification from './Notification';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const Home = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showCopyFromModal, setShowCopyFromModal] = useState(false);
  const [copyFromDate, setCopyFromDate] = useState('');
  const [copyFromEntries, setCopyFromEntries] = useState([]);
  const [selectedCopyFromEntries, setSelectedCopyFromEntries] = useState([]);
  const [editingQuantity, setEditingQuantity] = useState(null);

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

  const handleOpenCopyFrom = () => {
    // Set default date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    setCopyFromDate(yesterdayStr);
    loadCopyFromEntries(yesterdayStr);
    setShowCopyFromModal(true);
  };

  const loadCopyFromEntries = async (date) => {
    try {
      const data = await fetchEntriesByDate(user.id, date);
      setCopyFromEntries(data);
      setSelectedCopyFromEntries([]);
    } catch (error) {
      console.error('Error loading entries from date:', error);
      showNotification('Failed to load entries from selected date', 'error');
    }
  };

  const handleCopyFromDateChange = (date) => {
    setCopyFromDate(date);
    loadCopyFromEntries(date);
  };

  const toggleCopyFromEntry = (entryId) => {
    setSelectedCopyFromEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleCopySelectedEntries = async () => {
    if (selectedCopyFromEntries.length === 0) {
      showNotification('Please select at least one entry to copy', 'warning');
      return;
    }

    try {
      const entriesToCopy = copyFromEntries.filter(e => selectedCopyFromEntries.includes(e.id));

      for (const entry of entriesToCopy) {
        await addEntry({
          ...entry,
          user_id: user.id,
          entry_date: selectedDate,
          id: undefined,
          created_at: undefined
        });
      }

      await loadEntries();
      setShowCopyFromModal(false);
      showNotification(`Successfully copied ${entriesToCopy.length} entries to ${selectedDate}!`, 'success');
    } catch (error) {
      console.error('Error copying entries:', error);
      showNotification('Failed to copy entries', 'error');
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

  const navigateDate = (days) => {
    // Parse the selected date correctly
    const [year, month, day] = selectedDate.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day); // month is 0-indexed

    // Add/subtract days
    currentDate.setDate(currentDate.getDate() + days);

    // Format as YYYY-MM-DD
    const newYear = currentDate.getFullYear();
    const newMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const newDay = String(currentDate.getDate()).padStart(2, '0');
    const newDate = `${newYear}-${newMonth}-${newDay}`;

    // Don't allow navigating beyond today
    const todayStr = getTodayString();
    if (newDate <= todayStr) {
      setSelectedDate(newDate);
    }
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

  // Enhanced goal status with dynamic motivational messages
  const getGoalStatus = () => {
    const percentage = (totalProtein / target) * 100;

    // Goal reached and exceeded
    if (percentage >= 120) return { emoji: '🏆', color: '#4caf50', text: 'Crushing It! Way Over Goal!' };
    if (percentage >= 110) return { emoji: '🌟', color: '#4caf50', text: 'Superstar! Exceeded Goal!' };
    if (percentage >= 100) return { emoji: '🎉', color: '#4caf50', text: 'Perfect! Goal Achieved!' };

    // Close to goal
    if (percentage >= 90) return { emoji: '💪', color: '#ff9800', text: 'So Close! Almost There!' };
    if (percentage >= 80) return { emoji: '🔥', color: '#ff9800', text: 'Great Work! Keep It Up!' };
    if (percentage >= 70) return { emoji: '👏', color: '#ff9800', text: 'Nice Progress! Nearly There!' };

    // Mid-way progress
    if (percentage >= 60) return { emoji: '💯', color: '#2196f3', text: 'Over Halfway! Doing Great!' };
    if (percentage >= 50) return { emoji: '👍', color: '#2196f3', text: 'Halfway There! Keep Going!' };
    if (percentage >= 40) return { emoji: '📈', color: '#2196f3', text: 'Making Progress!' };

    // Getting started
    if (percentage >= 25) return { emoji: '🚀', color: '#9e9e9e', text: 'Good Start! Keep It Up!' };
    if (percentage >= 10) return { emoji: '✨', color: '#9e9e9e', text: 'Great Beginning!' };

    // Just started or no progress
    return { emoji: '💪', color: '#9e9e9e', text: "Let's Get Started!" };
  };

  const goalStatus = getGoalStatus();

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (dateStr === getTodayString()) return 'Today';
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page home-page">
      {/* Date Navigation Header */}
      <div className="date-navigation-header">
        <button
          className="date-nav-button"
          onClick={() => navigateDate(-1)}
          title="Previous day"
        >
          <FaChevronLeft />
        </button>
        <div className="current-date-display">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={getTodayString()}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
              top: 0,
              left: 0
            }}
          />
          {formatDateDisplay(selectedDate)}
        </div>
        <button
          className="date-nav-button"
          onClick={() => navigateDate(1)}
          disabled={selectedDate === getTodayString()}
          title="Next day"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Progress Circle with Goal Status */}
      <div className="progress-card">
        <div className="goal-status-banner" style={{ backgroundColor: goalStatus.color }}>
          <span className="goal-emoji">{goalStatus.emoji}</span>
          <span className="goal-text">{goalStatus.text}</span>
        </div>

        <div className="progress-circle-container">
          <div className="progress-circle">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle
                className="progress-circle-bg"
                cx="110"
                cy="110"
                r="96"
              />
              <circle
                className="progress-circle-fill"
                cx="110"
                cy="110"
                r="96"
                strokeDasharray={`${progressPercentage * 6.03} 603`}
                strokeDashoffset="0"
                style={{ stroke: goalStatus.color }}
              />
            </svg>
            <div className="progress-text">
              <div className="progress-percentage">{Math.round(progressPercentage)}%</div>
              <div className="progress-amount">{Math.round(totalProtein)}g</div>
              <div className="progress-target">of {target}g</div>
            </div>
          </div>
        </div>

        <div className="progress-stats">
          <div className="stat">
            <span className="stat-icon">
              <FaBullseye />
            </span>
            <span className="stat-value" style={{ color: remaining < 0 ? goalStatus.color : 'white' }}>
              {remaining < 0 ? '+' : ''}{Math.abs(Math.round(remaining))}g
            </span>
            <span className="stat-label">{remaining < 0 ? 'Over Goal' : 'Remaining'}</span>
          </div>
          <div className="stat">
            <span className="stat-icon">
              <FaUtensils />
            </span>
            <span className="stat-value">{entries.length}</span>
            <span className="stat-label">Entries</span>
          </div>
          <div className="stat">
            <span className="stat-icon">
              <FaFire />
            </span>
            <span className="stat-value">{Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0))}</span>
            <span className="stat-label">Calories</span>
          </div>
        </div>
      </div>

      {/* 3-Pane Action Grid */}
      <div className="action-grid">
        <div className="action-pane" onClick={() => setShowQuickAdd(true)}>
          <div className="action-icon">
            <FaBolt />
          </div>
          <span className="action-label">Quick Add</span>
        </div>
        <div className="action-pane" onClick={openAddModal}>
          <div className="action-icon">
            <FaPlus />
          </div>
          <span className="action-label">Full Entry</span>
        </div>
        <div className="action-pane" onClick={handleOpenCopyFrom}>
          <div className="action-icon">
            <FaCopy />
          </div>
          <span className="action-label">Copy From</span>
        </div>
      </div>

      {/* Today's Entries - Compact View */}
      <div className="card">
        <h2 className="card-header">
          {selectedDate === getTodayString() ? "Today's Foods" : `Foods for ${selectedDate}`}
        </h2>
        {entries.length > 0 && (
          <div className="entries-hint">
            <FaCopy style={{ marginRight: '6px' }} />
            Tip: Click <strong>copy icon</strong> on any entry to repeat it on another day
          </div>
        )}
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
                    {editingQuantity === entry.id ? (
                      <input
                        type="number"
                        min="1"
                        value={entry.quantity || 1}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 1;
                          if (newQty >= 1) {
                            handleUpdateQuantity(entry, newQty);
                          }
                        }}
                        onBlur={() => setEditingQuantity(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingQuantity(null);
                          }
                        }}
                        className="qty-input"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="qty-display"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQuantity(entry.id);
                        }}
                      >
                        x {entry.quantity || 1}
                      </span>
                    )}
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
          user={user}
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

      {/* Repeat From Modal */}
      {showCopyFromModal && (
        <div className="modal-overlay" onClick={() => setShowCopyFromModal(false)}>
          <div className="modal copy-from-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Repeat Entries From...</h2>
              <button className="modal-close" onClick={() => setShowCopyFromModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="copy-from-date-selector">
                <label>Select Date:</label>
                <input
                  type="date"
                  value={copyFromDate}
                  onChange={(e) => handleCopyFromDateChange(e.target.value)}
                  max={getTodayString()}
                  className="date-input"
                />
              </div>

              {copyFromEntries.length === 0 ? (
                <div className="empty-state">
                  <p>No entries found for {copyFromDate}</p>
                </div>
              ) : (
                <>
                  <div className="copy-from-entries">
                    <div className="copy-from-header">
                      <h3>Select entries to copy to {selectedDate}:</h3>
                      <button
                        className="btn btn-link"
                        onClick={() => {
                          if (selectedCopyFromEntries.length === copyFromEntries.length) {
                            setSelectedCopyFromEntries([]);
                          } else {
                            setSelectedCopyFromEntries(copyFromEntries.map(e => e.id));
                          }
                        }}
                      >
                        {selectedCopyFromEntries.length === copyFromEntries.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    {copyFromEntries.map(entry => (
                      <div
                        key={entry.id}
                        className={`copy-from-entry ${selectedCopyFromEntries.includes(entry.id) ? 'selected' : ''}`}
                        onClick={() => toggleCopyFromEntry(entry.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCopyFromEntries.includes(entry.id)}
                          onChange={() => {}}
                          className="copy-from-checkbox"
                        />
                        <div className="copy-from-entry-details">
                          <div className="copy-from-entry-name">{entry.food_name}</div>
                          <div className="copy-from-entry-meta">
                            {entry.serving_size && <span>{entry.serving_size}</span>}
                            {entry.meal_type && <span className="meal-badge-small">{entry.meal_type}</span>}
                            {entry.quantity && entry.quantity > 1 && <span>x{entry.quantity}</span>}
                          </div>
                        </div>
                        <div className="copy-from-entry-protein">{Math.round(entry.protein_grams)}g</div>
                      </div>
                    ))}
                  </div>

                  <div className="copy-from-summary">
                    <strong>{selectedCopyFromEntries.length}</strong> entries selected
                    {selectedCopyFromEntries.length > 0 && (
                      <span> • Total: {Math.round(copyFromEntries.filter(e => selectedCopyFromEntries.includes(e.id)).reduce((sum, e) => sum + e.protein_grams, 0))}g protein</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCopyFromModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCopySelectedEntries}
                disabled={selectedCopyFromEntries.length === 0}
              >
                Copy {selectedCopyFromEntries.length > 0 ? `${selectedCopyFromEntries.length} ` : ''}Entries
              </button>
            </div>
          </div>
        </div>
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
