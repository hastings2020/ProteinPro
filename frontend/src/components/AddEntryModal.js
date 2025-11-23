import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaCamera, FaStar } from 'react-icons/fa';
import './AddEntryModal.css';
import api, { searchFoods, fetchFavorites } from '../services/api';
import OCRScanner from './OCRScanner';

const AddEntryModal = ({ onClose, onSubmit, editingEntry, user }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    food_name: '',
    protein_grams: '',
    calories: '',
    carbs: '',
    fat: '',
    serving_size: '',
    meal_type: '',
    entry_date: '',
    notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        food_name: editingEntry.food_name || '',
        protein_grams: editingEntry.protein_grams || '',
        calories: editingEntry.calories || '',
        carbs: editingEntry.carbs || '',
        fat: editingEntry.fat || '',
        serving_size: editingEntry.serving_size || '',
        meal_type: editingEntry.meal_type || '',
        entry_date: editingEntry.entry_date || '',
        notes: editingEntry.notes || ''
      });
    }
    loadFavorites();
  }, [editingEntry]);

  const loadFavorites = async () => {
    try {
      const data = await fetchFavorites(user.id);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.food_name || !formData.protein_grams) {
      alert('Please enter food name and protein amount');
      return;
    }
    onSubmit(formData);
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setSearchError('');
      const results = await searchFoods(query);

      if (results && results.length > 0) {
        setSearchResults(results);
        setSearchError('');
      } else {
        setSearchResults([]);
        setSearchError('No foods found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching foods:', error);
      setSearchResults([]);

      if (error.response && error.response.status === 403) {
        setSearchError('USDA API key limit reached. Use DEMO_KEY for limited searches or get your free API key at fdc.nal.usda.gov');
      } else if (error.message.includes('Network Error')) {
        setSearchError('Cannot connect to backend. Make sure the server is running on http://localhost:5001');
      } else {
        setSearchError('Failed to search foods. Backend may not be running or USDA API issue. Try manual entry instead.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for auto-search (debounce)
    if (query.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearch(query);
      }, 500); // Wait 500ms after user stops typing
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setSearchError('');
    }
  };

  const selectFood = (food) => {
    const servingText = food.servingSize ? food.servingSize + (food.servingUnit || 'g') : (food.serving_size || '100g');
    setFormData({
      ...formData,
      food_name: food.description || food.food_name,
      protein_grams: Math.round(food.protein || food.protein_grams),
      calories: Math.round(food.calories || 0),
      carbs: food.carbs ? Math.round(food.carbs) : '',
      fat: food.fat ? Math.round(food.fat) : '',
      serving_size: servingText
    });
    setActiveTab('manual');
  };

  const addSearchResultToFavorites = async (food, e) => {
    e.stopPropagation(); // Prevent selecting the food
    try {
      const servingText = food.servingSize ? food.servingSize + (food.servingUnit || 'g') : '100g';
      await api.post('/favorites', {
        user_id: user.id,
        food_name: food.description,
        protein_grams: Math.round(food.protein),
        calories: Math.round(food.calories || 0),
        serving_size: servingText
      });
      alert('Added to favorites!');
      loadFavorites(); // Reload favorites list
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Failed to add to favorites');
    }
  };

  const handleOCRAddToFavorites = async (favoriteData) => {
    try {
      await api.post('/favorites', favoriteData);
      loadFavorites(); // Reload favorites list
    } catch (error) {
      throw error;
    }
  };

  const handleOCRResult = (result) => {
    setFormData({
      ...formData,
      food_name: result.food_name || '',
      protein_grams: result.protein_grams || '',
      calories: result.calories || '',
      carbs: result.carbs || '',
      fat: result.fat || '',
      serving_size: result.serving_size || ''
    });
    setActiveTab('manual');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal add-entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editingEntry ? 'Edit Entry' : 'Add Food Entry'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={'tab-button' + (activeTab === 'manual' ? ' active' : '')}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry
          </button>
          <button
            className={'tab-button' + (activeTab === 'search' ? ' active' : '')}
            onClick={() => setActiveTab('search')}
          >
            <FaSearch /> Search Foods
          </button>
          <button
            className={'tab-button' + (activeTab === 'scan' ? ' active' : '')}
            onClick={() => setActiveTab('scan')}
          >
            <FaCamera /> Scan Label
          </button>
          <button
            className={'tab-button' + (activeTab === 'favorites' ? ' active' : '')}
            onClick={() => setActiveTab('favorites')}
          >
            <FaStar /> Favorites
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Food Name *</label>
                <input
                  type="text"
                  name="food_name"
                  className="form-input"
                  value={formData.food_name}
                  onChange={handleChange}
                  placeholder="e.g., Grilled Chicken Breast"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Protein (g) *</label>
                  <input
                    type="number"
                    name="protein_grams"
                    className="form-input"
                    value={formData.protein_grams}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Calories</label>
                  <input
                    type="number"
                    name="calories"
                    className="form-input"
                    value={formData.calories}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Carbs (g)</label>
                  <input
                    type="number"
                    name="carbs"
                    className="form-input"
                    value={formData.carbs}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fat (g)</label>
                  <input
                    type="number"
                    name="fat"
                    className="form-input"
                    value={formData.fat}
                    onChange={handleChange}
                    placeholder="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serving Size</label>
                <input
                  type="text"
                  name="serving_size"
                  className="form-input"
                  value={formData.serving_size}
                  onChange={handleChange}
                  placeholder="e.g., 100g, 1 cup, 1 scoop"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select
                  name="meal_type"
                  className="form-select"
                  value={formData.meal_type}
                  onChange={handleChange}
                >
                  <option value="">Select meal type</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'search' && (
            <div className="search-tab">
              <div className="search-bar">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Start typing to search (e.g., chicken breast, Greek yogurt)..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searching && <span className="searching-indicator">Searching...</span>}
              </div>

              {searchError && (
                <div className="search-error">
                  {searchError}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((food, index) => (
                    <div key={index} className="search-result-item" onClick={() => selectFood(food)}>
                      <div className="result-content">
                        <div className="result-name">{food.description}</div>
                        <div className="result-nutrients">
                          <span className="nutrient-badge protein">{Math.round(food.protein)}g protein</span>
                          <span className="nutrient-badge">{Math.round(food.calories)} cal</span>
                          <span className="nutrient-badge">{Math.round(food.carbs || 0)}g carbs</span>
                          <span className="nutrient-badge">{Math.round(food.fat || 0)}g fat</span>
                        </div>
                      </div>
                      <button
                        className="btn-add-to-favorites"
                        onClick={(e) => addSearchResultToFavorites(food, e)}
                        title="Add to favorites"
                      >
                        <FaStar />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!searching && searchResults.length === 0 && !searchError && searchQuery && (
                <div className="empty-state">No results found. Try a different search term or use manual entry.</div>
              )}

              {!searchQuery && (
                <div className="search-hint">
                  <p><strong>Tip:</strong> Search the USDA FoodData Central database with 300,000+ foods!</p>
                  <p>Try: "chicken breast", "Greek yogurt", "whey protein", etc.</p>
                  <p style={{ fontSize: '12px', marginTop: '12px', color: '#999' }}>
                    Note: Requires backend server running. See README for setup instructions.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scan' && (
            <OCRScanner
              onResult={handleOCRResult}
              user={user}
              onAddToFavorites={handleOCRAddToFavorites}
            />
          )}

          {activeTab === 'favorites' && (
            <div className="favorites-tab">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <p>No favorite foods yet. Add entries and mark them as favorites!</p>
                </div>
              ) : (
                <div className="favorites-list">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="favorite-item" onClick={() => selectFood(fav)}>
                      <div className="favorite-name">
                        <FaStar className="star-icon" />
                        {fav.food_name}
                      </div>
                      <div className="favorite-nutrients">
                        <span className="nutrient-badge protein">{fav.protein_grams}g protein</span>
                        {fav.calories && <span className="nutrient-badge">{fav.calories} cal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEntryModal;
