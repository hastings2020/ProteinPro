import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { FaCamera, FaUpload, FaSpinner } from 'react-icons/fa';
import './OCRScanner.css';

const OCRScanner = ({ onResult }) => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
        onResult(nutritionData);
      } else {
        alert('Could not detect protein information. Please enter manually or try a clearer image.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to process image. Please try again or enter manually.');
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
          <img src={image} alt="Nutrition label" />
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
          {!processing && (
            <button
              className="btn btn-secondary retry-button"
              onClick={() => {
                setImage(null);
                fileInputRef.current.value = '';
              }}
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
