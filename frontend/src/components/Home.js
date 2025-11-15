import React, { useState, useEffect } from 'react';
import { FaPlus, FaCamera, FaSearch, FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import './Home.css';
import { fetchEntriesByDate, addEntry, deleteEntry, updateEntry, fetchFavorites, searchFoods } from '../services/api';
import AddEntryModal from './AddEntryModal';
import Notification from './Notification';

const Home = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayEntries();
  }, []);

  const loadTodayEntries = async () => {
    try {
      setLoading(true);
      const data = await fetchEntriesByDate(user.id, today);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
      showNotification('Failed to load entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (entryData) => {
    try {
      const newEntry = await addEntry({
        ...entryData,
        user_id: user.id,
        entry_date: today
      });
      setEntries([...entries, newEntry]);
      setShowAddModal(false);
      showNotification('Food entry added successfully!', 'success');
    } catch (error) {
      console.error('Error adding entry:', error);
      showNotification('Failed to add entry', 'error');
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
    setTimeout(() => setNotification(null), 3000);
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

      {/* Quick Add Button */}
      <button className="btn btn-primary btn-add-food" onClick={openAddModal}>
        <FaPlus /> Add Food
      </button>

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
