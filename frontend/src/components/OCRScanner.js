import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { FaCamera, FaUpload, FaSpinner, FaStar, FaCheck } from 'react-icons/fa';
import './OCRScanner.css';

const OCRScanner = ({ onResult, user, onAddToFavorites }) => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [servingType, setServingType] = useState('per_serve');
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        processImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData) => {
    setProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      const nutritionData = extractNutritionInfo(text);

      if (nutritionData.protein_grams) {
        setExtractedData(nutritionData);
      } else {
        alert('Could not detect protein information. Please try a clearer image or enter manually.');
        setImage(null);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to process image. Please try again or enter manually.');
      setImage(null);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const extractNutritionInfo = (text) => {
    const data = {
      food_name: '',
      protein_grams: '',
      calories: '',
      carbs: '',
      fat: '',
      serving_size: ''
    };

    // Try to extract protein
    const proteinPatterns = [
      /protein[:\s]+(\d+\.?\d*)\s*g/i,
      /protéines[:\s]+(\d+\.?\d*)\s*g/i,
      /prot[\.:\s]+(\d+\.?\d*)\s*g/i
    ];

    for (const pattern of proteinPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.protein_grams = match[1];
        break;
      }
    }

    // Try to extract calories
    const caloriesPatterns = [
      /calories[:\s]+(\d+)/i,
      /energy[:\s]+(\d+)/i,
      /(\d+)\s*cal/i
    ];

    for (const pattern of caloriesPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.calories = match[1];
        break;
      }
    }

    // Try to extract carbs
    const carbsPatterns = [
      /carbohydrate[s]?[:\s]+(\d+\.?\d*)\s*g/i,
      /total\s+carb[s]?[:\s]+(\d+\.?\d*)\s*g/i,
      /carbs[:\s]+(\d+\.?\d*)\s*g/i
    ];

    for (const pattern of carbsPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.carbs = match[1];
        break;
      }
    }

    // Try to extract fat
    const fatPatterns = [
      /total\s+fat[:\s]+(\d+\.?\d*)\s*g/i,
      /fat[:\s]+(\d+\.?\d*)\s*g/i,
      /lipid[s]?[:\s]+(\d+\.?\d*)\s*g/i
    ];

    for (const pattern of fatPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.fat = match[1];
        break;
      }
    }

    // Try to extract serving size
    const servingPatterns = [
      /serving\s+size[:\s]+([^\n]+)/i,
      /portion[:\s]+([^\n]+)/i
    ];

    for (const pattern of servingPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.serving_size = match[1].trim().slice(0, 50);
        break;
      }
    }

    return data;
  };

  const handleServingTypeChange = (type) => {
    setServingType(type);
    // You can set default multipliers based on type if needed
    if (type === 'per_100g') {
      // If original was per serve, might need adjustment
      // For now, keep multiplier at 1
    }
  };

  const getAdjustedData = () => {
    if (!extractedData) return null;

    const multiplier = parseFloat(servingMultiplier) || 1;

    return {
      ...extractedData,
      protein_grams: (parseFloat(extractedData.protein_grams) * multiplier).toFixed(1),
      calories: extractedData.calories ? Math.round(parseFloat(extractedData.calories) * multiplier) : '',
      carbs: extractedData.carbs ? (parseFloat(extractedData.carbs) * multiplier).toFixed(1) : '',
      fat: extractedData.fat ? (parseFloat(extractedData.fat) * multiplier).toFixed(1) : '',
      serving_size: servingType === 'per_serve' ? 'Per Serving' :
                    servingType === 'per_100g' ? 'Per 100g' :
                    'Whole Package'
    };
  };

  const handleUseData = () => {
    const adjustedData = getAdjustedData();
    onResult(adjustedData);
    resetScanner();
  };

  const handleAddToFavorites = async () => {
    if (!onAddToFavorites) {
      alert('Add to favorites not available');
      return;
    }

    const adjustedData = getAdjustedData();
    try {
      await onAddToFavorites({
        user_id: user?.id || 1,
        food_name: adjustedData.food_name || 'Scanned Food',
        protein_grams: parseFloat(adjustedData.protein_grams),
        calories: adjustedData.calories ? parseFloat(adjustedData.calories) : null,
        serving_size: adjustedData.serving_size
      });
      alert('Added to favorites!');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('Failed to add to favorites');
    }
  };

  const resetScanner = () => {
    setImage(null);
    setExtractedData(null);
    setServingType('per_serve');
    setServingMultiplier(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ocr-scanner">
      {!image ? (
        <div className="upload-area">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div className="upload-prompt">
            <FaCamera className="upload-icon" />
            <h3>Scan Nutrition Label</h3>
            <p>Take a photo or upload an image of a nutrition label</p>
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaUpload /> Choose Image
            </button>
          </div>
        </div>
      ) : (
        <div className="image-preview">
          <img src={image} alt="Nutrition label" className="preview-image" />
          {processing && (
            <div className="processing-overlay">
              <FaSpinner className="spinner" />
              <p>Processing image...</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p>{progress}%</p>
            </div>
          )}
          {!processing && extractedData && (
            <div className="extracted-data">
              <h3>Extracted Nutrition Data</h3>

              <div className="serving-type-selector">
                <label className="serving-label">This nutrition info is for:</label>
                <div className="serving-options">
                  <button
                    className={'serving-option' + (servingType === 'per_serve' ? ' active' : '')}
                    onClick={() => handleServingTypeChange('per_serve')}
                  >
                    Per Serving
                  </button>
                  <button
                    className={'serving-option' + (servingType === 'per_100g' ? ' active' : '')}
                    onClick={() => handleServingTypeChange('per_100g')}
                  >
                    Per 100g
                  </button>
                  <button
                    className={'serving-option' + (servingType === 'whole' ? ' active' : '')}
                    onClick={() => handleServingTypeChange('whole')}
                  >
                    Whole Package
                  </button>
                </div>
              </div>

              <div className="multiplier-input">
                <label>Multiply values by:</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={servingMultiplier}
                  onChange={(e) => setServingMultiplier(e.target.value)}
                  className="form-input"
                />
                <span className="multiplier-hint">(e.g., 2 for double portion)</span>
              </div>

              <div className="nutrition-preview">
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein:</span>
                  <span className="nutrition-value">{getAdjustedData().protein_grams}g</span>
                </div>
                {getAdjustedData().calories && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Calories:</span>
                    <span className="nutrition-value">{getAdjustedData().calories}</span>
                  </div>
                )}
                {getAdjustedData().carbs && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Carbs:</span>
                    <span className="nutrition-value">{getAdjustedData().carbs}g</span>
                  </div>
                )}
                {getAdjustedData().fat && (
                  <div className="nutrition-item">
                    <span className="nutrition-label">Fat:</span>
                    <span className="nutrition-value">{getAdjustedData().fat}g</span>
                  </div>
                )}
              </div>

              <div className="ocr-actions">
                <button className="btn btn-success" onClick={handleUseData}>
                  <FaCheck /> Use This Data
                </button>
                <button className="btn btn-warning" onClick={handleAddToFavorites}>
                  <FaStar /> Add to Favorites
                </button>
                <button className="btn btn-secondary" onClick={resetScanner}>
                  Try Another Image
                </button>
              </div>
            </div>
          )}
          {!processing && !extractedData && (
            <button
              className="btn btn-secondary retry-button"
              onClick={resetScanner}
            >
              Try Another Image
            </button>
          )}
        </div>
      )}

      <div className="ocr-info">
        <p><strong>Tips for best results:</strong></p>
        <ul>
          <li>Ensure good lighting</li>
          <li>Keep the label flat and in focus</li>
          <li>Capture the entire nutrition facts panel</li>
          <li>Avoid glare and shadows</li>
        </ul>
        <p className="ocr-note">
          Note: OCR accuracy varies. Please review and adjust the extracted values if needed.
        </p>
      </div>
    </div>
  );
};

export default OCRScanner;
