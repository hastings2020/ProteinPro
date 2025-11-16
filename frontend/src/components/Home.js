import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt } from 'react-icons/fa';
import './Home.css';
import { fetchEntriesByDate, addEntry, deleteEntry, updateEntry } from '../services/api';
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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user && user.id) {
      loadTodayEntries();
    }
  }, [user]);

  const loadTodayEntries = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchEntriesByDate(user.id, today);
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
        entry_date: today
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
        errorMsg = 'Failed to add entry. Make sure the backend is running on http://localhost:5000';
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

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const totalProtein = entries.reduce((sum, entry) => sum + parseFloat(entry.protein_grams || 0), 0);
  const target = user?.daily_protein_target || 150;
  const progressPercentage = Math.min((totalProtein / target) * 100, 100);
  const remaining = Math.max(target - totalProtein, 0);

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setShowAddModal(true);
  };

  if (!user) {
    return (
      <div className="page home-page">
        <div className="loading-text">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <div className="page-header">
        <h1 className="page-title">Today's Progress</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      {/* Protein Progress Circle */}
      <div className="card protein-progress-card">
        <div className="progress-circle-container">
          <svg className="progress-circle" viewBox="0 0 200 200">
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
            <span className="stat-value">{Math.round(remaining)}g</span>
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

      {/* Today's Entries */}
      <div className="card">
        <h2 className="card-header">Today's Foods</h2>
        {loading ? (
          <div className="loading-text">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p>No entries yet today. Start tracking your protein!</p>
          </div>
        ) : (
          <div className="entries-list">
            {entries.map(entry => (
              <div key={entry.id} className="entry-item">
                <div className="entry-main">
                  <div className="entry-info">
                    <h3 className="entry-name">{entry.food_name}</h3>
                    <div className="entry-details">
                      {entry.serving_size && <span>{entry.serving_size}</span>}
                      {entry.meal_type && <span className="meal-badge">{entry.meal_type}</span>}
                      {entry.entry_time && <span>{entry.entry_time.slice(0, 5)}</span>}
                    </div>
                  </div>
                  <div className="entry-protein">
                    <div className="protein-amount">{entry.protein_grams}g</div>
                    <div className="protein-label">protein</div>
                  </div>
                </div>
                <div className="entry-actions">
                  <button className="btn-icon" onClick={() => openEditModal(entry)} title="Edit">
                    <FaEdit />
                  </button>
                  <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteEntry(entry.id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
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
