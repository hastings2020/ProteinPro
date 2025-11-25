import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import './History.css';
import { fetchEntries, deleteEntry, updateEntry } from '../services/api';
import AddEntryModal from './AddEntryModal';
import Notification from './Notification';
import { format, parseISO } from 'date-fns';

const History = ({ user }) => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchQuery, mealFilter, dateFilter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await fetchEntries(user.id);
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
      showNotification('Failed to load entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.food_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Meal type filter
    if (mealFilter !== 'all') {
      filtered = filtered.filter(entry => entry.meal_type === mealFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(entry => {
            const entryDate = new Date(entry.entry_date);
            return entryDate >= filterDate;
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(entry => new Date(entry.entry_date) >= filterDate);
          break;
        case 'month':
          filterDate.setDate(today.getDate() - 30);
          filtered = filtered.filter(entry => new Date(entry.entry_date) >= filterDate);
          break;
        default:
          break;
      }
    }

    setFilteredEntries(filtered);
  };

  const handleEditEntry = async (entryData) => {
    try {
      const updated = await updateEntry(editingEntry.id, entryData);
      setEntries(entries.map(e => e.id === editingEntry.id ? updated : e));
      setShowEditModal(false);
      setEditingEntry(null);
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

  const groupEntriesByDate = () => {
    const grouped = {};
    filteredEntries.forEach(entry => {
      const date = entry.entry_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });
    return grouped;
  };

  const groupedEntries = groupEntriesByDate();
  const dates = Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getDayTotal = (entriesForDay) => {
    return entriesForDay.reduce((sum, entry) => sum + parseFloat(entry.protein_grams || 0), 0);
  };

  return (
    <div className="page history-page">
      <div className="page-header">
        <h1 className="page-title">Food History</h1>
        <p className="page-subtitle">View and manage all your food entries</p>
      </div>

      {/* Search and Filters */}
      <div className="card filters-card">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search foods or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              className="filter-select"
              value={mealFilter}
              onChange={(e) => setMealFilter(e.target.value)}
            >
              <option value="all">All Meals</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="results-count">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="loading-text">Loading history...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="card empty-state">
          <p>No entries found matching your filters.</p>
        </div>
      ) : (
        <div className="history-list">
          {dates.map(date => (
            <div key={date} className="date-group">
              <div className="date-header">
                <h3 className="date-title">{formatDate(date)}</h3>
                <div className="date-total">
                  <span className="total-protein">{Math.round(getDayTotal(groupedEntries[date]))}g</span>
                  <span className="total-label">protein</span>
                </div>
              </div>

              <div className="entries-for-date">
                {groupedEntries[date].map(entry => (
                  <div key={entry.id} className="history-entry">
                    <div className="entry-content">
                      <div className="entry-left">
                        {entry.entry_time && (
                          <div className="entry-time">{entry.entry_time.slice(0, 5)}</div>
                        )}
                        <div className="entry-info">
                          <h4 className="entry-name">{entry.food_name}</h4>
                          <div className="entry-details">
                            {entry.serving_size && <span>{entry.serving_size}</span>}
                            {entry.meal_type && <span className="meal-badge">{entry.meal_type}</span>}
                            {entry.calories && <span>{entry.calories} cal</span>}
                          </div>
                          {entry.notes && <div className="entry-notes">{entry.notes}</div>}
                        </div>
                      </div>
                      <div className="entry-right">
                        <div className="entry-protein">
                          <div className="protein-amount">{entry.protein_grams}g</div>
                        </div>
                        <div className="entry-actions">
                          <button
                            className="btn-icon"
                            onClick={() => {
                              setEditingEntry(entry);
                              setShowEditModal(true);
                            }}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <AddEntryModal
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          onSubmit={handleEditEntry}
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

export default History;
