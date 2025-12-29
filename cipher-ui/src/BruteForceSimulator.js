/**
 * BruteForceSimulator
 *
 * Modal component that estimates brute-force effort for different cipher types.
 * Uses simple key-space rules (and a configurable key length for Vigenère) to
 * generate human-readable time estimates and example attack descriptions.
 */
import React, { useState, useEffect } from 'react';
import './BruteForceSimulator.css';

const BruteForceSimulator = ({ isVisible, onClose, customCipherData }) => {
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
    let keySpace;
    let cipherName = 'Custom Substitution Cipher';
    let description = 'Brute force requires trying all possible alphabet mappings';
    
    if (customCipherData && customCipherData.mapping && Object.keys(customCipherData.mapping).length > 0) {
      const mappingEntries = Object.keys(customCipherData.mapping).length;
      const mappingValues = Object.values(customCipherData.mapping);
      const uniqueMappings = new Set(mappingValues.filter(v => v && v !== '')).size;
      
      // Count non-identity mappings (where letter maps to different letter)
      const nonIdentityMappings = Object.entries(customCipherData.mapping)
        .filter(([key, value]) => key !== value).length;
      
      if (nonIdentityMappings === 0) {
        keySpace = 1; // Identity mapping - no encryption
        description = 'Identity mapping (no encryption)';
      } else if (mappingEntries === 26 && uniqueMappings === 26) {
        keySpace = 403291461126605635584000000; // Full 26!
        description = `Complete substitution: all 26 letters uniquely mapped`;
      } else {
        keySpace = Math.pow(uniqueMappings, nonIdentityMappings);
        description = `Partial substitution: ${nonIdentityMappings} letters changed, ${uniqueMappings} possible targets`;
      }
      
      cipherName = customCipherData.name || 'Custom Cipher';
    } else {
      keySpace = 1;
      cipherName = 'No Custom Cipher';
      description = 'No cipher mapping defined';
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
      cipher: cipherName,
      keySpace,
      averageAttempts,
      timeTocrack: formatTime(seconds),
      security: seconds < 31536000 ? 'Moderate' : 
               seconds < 31536000000 ? 'Strong' : 
               seconds < 31536000000000 ? 'Very Strong' : 'Extremely Strong',
      description
    });
  };

  useEffect(() => {
    if (isVisible) {
      calculateCrackTime();
    }
  }, [textLength, isVisible, customCipherData?.mapping, customCipherData?.name]);

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
            <label>Cipher Analysis:</label>
            <div className="cipher-info">
              <strong>{customCipherData?.name || 'Custom Substitution Cipher'}</strong>
              <p>Analyzing current custom cipher configuration</p>
            </div>
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