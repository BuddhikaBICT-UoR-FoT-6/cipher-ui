/**
 * @fileoverview Component displaying detailed information about cipher algorithms
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React from 'react';
import './AlgorithmInfo.css';

/**
 * Algorithm information display component
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.selectedCipher - Currently selected cipher algorithm key (caesar|rot13|atbash|vigenere|railfence)
 * @description Shows algorithm details including complexity, security level, historical information, and key space analysis
 * @returns {JSX.Element} Algorithm information panel with animated entrance and hover effects
 * 
 * @example
 * <AlgorithmInfo selectedCipher="caesar" />
 * <AlgorithmInfo selectedCipher="vigenere" />
 */
const AlgorithmInfo = ({ selectedCipher }) => {
  /**
   * Comprehensive algorithm information database
   * @constant {Object} algorithmDetails
   * @description Contains detailed information for each cipher including icons, descriptions, complexity ratings, security levels, historical data, and key space analysis
   * @property {Object} caesar - Caesar cipher information
   * @property {Object} rot13 - ROT13 cipher information
   * @property {Object} atbash - Atbash cipher information
   * @property {Object} vigenere - Vigenère cipher information
   * @property {Object} railfence - Rail Fence cipher information
   */
  const algorithmDetails = {
    caesar: {
      icon: '🏛️',
      description: 'Named after Julius Caesar, this cipher shifts each letter by a fixed number of positions in the alphabet.',
      complexity: 'Simple',
      security: 'Low',
      yearInvented: '~50 BC',
      keySpace: '25 possible keys'
    },
    rot13: {
      icon: '🔄',
      description: 'A special case of Caesar cipher with a shift of 13. It\'s self-inverse, meaning applying it twice returns the original text.',
      complexity: 'Simple',
      security: 'Very Low',
      yearInvented: '1980s',
      keySpace: '1 key (fixed)'
    },
    atbash: {
      icon: '🪞',
      description: 'An ancient Hebrew cipher that substitutes each letter with its mirror position in the alphabet (A↔Z, B↔Y, etc.).',
      complexity: 'Simple',
      security: 'Very Low',
      yearInvented: '~500 BC',
      keySpace: '1 key (fixed)'
    },
    vigenere: {
      icon: '🗝️',
      description: 'Uses a keyword to vary the shift for each letter, making it much stronger than simple substitution ciphers.',
      complexity: 'Moderate',
      security: 'Medium',
      yearInvented: '1553',
      keySpace: 'Depends on keyword length'
    },
    railfence: {
      icon: '🚂',
      description: 'Arranges text in a zigzag pattern across multiple rails, then reads off each rail to create the cipher.',
      complexity: 'Moderate',
      security: 'Low-Medium',
      yearInvented: 'Ancient',
      keySpace: 'Number of rails'
    }
  };

  const info = algorithmDetails[selectedCipher];
  
  if (!info) return null;

  return (
    <div className="algorithm-info">
      <div className="info-header">
        <span className="info-icon">{info.icon}</span>
        <h3>Algorithm Information</h3>
      </div>
      
      <div className="info-content">
        <p className="description">{info.description}</p>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Complexity:</span>
            <span className={`value complexity-${info.complexity.toLowerCase()}`}>
              {info.complexity}
            </span>
          </div>
          
          <div className="info-item">
            <span className="label">Security:</span>
            <span className={`value security-${info.security.toLowerCase().replace(' ', '-')}`}>
              {info.security}
            </span>
          </div>
          
          <div className="info-item">
            <span className="label">Invented:</span>
            <span className="value">{info.yearInvented}</span>
          </div>
          
          <div className="info-item">
            <span className="label">Key Space:</span>
            <span className="value">{info.keySpace}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmInfo;