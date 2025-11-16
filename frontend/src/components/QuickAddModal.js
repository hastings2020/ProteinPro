import React, { useState } from 'react';
import { FaTimes, FaBolt } from 'react-icons/fa';
import './QuickAddModal.css';

const QuickAddModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    food_name: '',
    protein_grams: '',
    meal_type: ''
  });

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
    onSubmit({
      ...formData,
      calories: '',
      carbs: '',
      fat: '',
      serving_size: '',
      notes: ''
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal quick-add-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <FaBolt /> Quick Add
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p className="quick-add-description">
            Quickly log your protein intake with just the essentials
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Food Name *</label>
              <input
                type="text"
                name="food_name"
                className="form-input"
                value={formData.food_name}
                onChange={handleChange}
                placeholder="e.g., Chicken Breast"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Protein (grams) *</label>
              <input
                type="number"
                name="protein_grams"
                className="form-input protein-input-large"
                value={formData.protein_grams}
                onChange={handleChange}
                placeholder="0"
                step="0.1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Meal Type (Optional)</label>
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

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                <FaBolt /> Add Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
