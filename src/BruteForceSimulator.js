import React, { useState, useEffect } from 'react';
import './BruteForceSimulator.css';

const BruteForceSimulator = ({ isVisible, onClose }) => {
  const [selectedCipher, setSelectedCipher] = useState('caesar');
  const [textLength, setTextLength] = useState(10);
  const [results, setResults] = useState(null);

  const cipherComplexity = {
    caesar: {
      name: 'Caesar Cipher',
      keySpace: 25,
      description: 'Only 25 possible shifts to try'
    },
    rot13: {
      name: 'ROT13',
      keySpace: 1,
      description: 'Fixed shift of 13, instantly crackable'
    },
    atbash: {
      name: 'Atbash Cipher',
      keySpace: 1,
      description: 'Fixed substitution, instantly crackable'
    },
    vigenere: {
      name: 'Vigenère Cipher',
      keySpace: (keyLength) => Math.pow(26, keyLength),
      description: 'Exponentially harder with longer keys'
    },
    railfence: {
      name: 'Rail Fence Cipher',
      keySpace: (textLen) => Math.min(textLen - 1, 20),
      description: 'Limited by text length'
    }
  };

  const calculateCrackTime = () => {
    const cipher = cipherComplexity[selectedCipher];
    let keySpace;
    
    if (selectedCipher === 'vigenere') {
      const avgKeyLength = 5;
      keySpace = cipher.keySpace(avgKeyLength);
    } else if (selectedCipher === 'railfence') {
      keySpace = cipher.keySpace(textLength);
    } else {
      keySpace = cipher.keySpace;
    }

    // Assumptions: 1M attempts per second, average case is 50% of keyspace
    const attemptsPerSecond = 1000000;
    const averageAttempts = keySpace / 2;
    const seconds = averageAttempts / attemptsPerSecond;

    const formatTime = (totalSeconds) => {
      if (totalSeconds < 1) return `${(totalSeconds * 1000).toFixed(2)} milliseconds`;
      if (totalSeconds < 60) return `${totalSeconds.toFixed(2)} seconds`;
      if (totalSeconds < 3600) return `${(totalSeconds / 60).toFixed(2)} minutes`;
      if (totalSeconds < 86400) return `${(totalSeconds / 3600).toFixed(2)} hours`;
      if (totalSeconds < 31536000) return `${(totalSeconds / 86400).toFixed(2)} days`;
      return `${(totalSeconds / 31536000).toFixed(2)} years`;
    };

    setResults({
      cipher: cipher.name,
      keySpace,
      averageAttempts,
      timeTocrack: formatTime(seconds),
      security: seconds < 1 ? 'Very Weak' : 
               seconds < 3600 ? 'Weak' : 
               seconds < 86400 ? 'Moderate' : 'Strong',
      description: cipher.description
    });
  };

  useEffect(() => {
    if (isVisible) {
      calculateCrackTime();
    }
  }, [selectedCipher, textLength, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="brute-force-overlay">
      <div className="brute-force-modal">
        <div className="brute-force-header">
          <h2>🔓 Brute Force Simulator</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="simulator-controls">
          <div className="control-group">
            <label>Cipher Type:</label>
            <select value={selectedCipher} onChange={(e) => setSelectedCipher(e.target.value)}>
              <option value="caesar">Caesar Cipher</option>
              <option value="rot13">ROT13</option>
              <option value="atbash">Atbash Cipher</option>
              <option value="vigenere">Vigenère Cipher</option>
              <option value="railfence">Rail Fence Cipher</option>
            </select>
          </div>

          <div className="control-group">
            <label>Text Length:</label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={textLength}
              onChange={(e) => setTextLength(parseInt(e.target.value))}
            />
            <span>{textLength} characters</span>
          </div>
        </div>

        {results && (
          <div className="results-section">
            <div className="result-card">
              <h3>{results.cipher}</h3>
              <div className="result-stats">
                <div className="stat">
                  <span className="label">Key Space:</span>
                  <span className="value">{results.keySpace.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="label">Average Attempts:</span>
                  <span className="value">{results.averageAttempts.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="label">Time to Crack:</span>
                  <span className="value time">{results.timeTocrack}</span>
                </div>
                <div className="stat">
                  <span className="label">Security Level:</span>
                  <span className={`security ${results.security.toLowerCase().replace(' ', '-')}`}>
                    {results.security}
                  </span>
                </div>
              </div>
              <p className="description">{results.description}</p>
            </div>

            <div className="assumptions">
              <h4>⚙️ Assumptions</h4>
              <ul>
                <li>1,000,000 attempts per second</li>
                <li>Average case: 50% of key space</li>
                <li>Vigenère uses 5-character key average</li>
                <li>No frequency analysis or advanced techniques</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BruteForceSimulator;