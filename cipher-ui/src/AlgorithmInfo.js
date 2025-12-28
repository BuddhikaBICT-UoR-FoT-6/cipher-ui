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
 * @param {string} props.selectedCipher - Currently selected cipher algorithm key (caesar|rot13|atbash|vigenere|railfence|chain)
 * @param {Array<Object>=} props.chainSteps - Steps for cipher chaining (used only when selectedCipher is 'chain')
 * @description Shows algorithm details including complexity, security level, historical information, and key space analysis
 * @returns {JSX.Element} Algorithm information panel with animated entrance and hover effects
 * 
 * @example
 * <AlgorithmInfo selectedCipher="caesar" />
 * <AlgorithmInfo selectedCipher="vigenere" />
 */
const AlgorithmInfo = ({ selectedCipher, chainSteps }) => {
  const bitsForStep = (step) => {
    const cipher = step?.cipher;
    switch (cipher) {
      case 'caesar':
        // Shift in [1..25]
        return Math.log2(25);
      case 'rot13':
        return 0;
      case 'atbash':
        return 0;
      case 'railfence':
        // Rails in [2..10] => 9 possible keys
        return Math.log2(9);
      case 'vigenere': {
        const keyword = (step?.key || '').trim();
        const len = keyword.length;
        // If empty, treat as 1 to avoid NaN; UI should enforce keyword.
        if (len <= 0) return 0;
        return len * Math.log2(26);
      }
      default:
        return 0;
    }
  };

  const complexityForStep = (cipher) => {
    switch (cipher) {
      case 'vigenere':
      case 'railfence':
        return 2;
      case 'caesar':
      case 'rot13':
      case 'atbash':
      default:
        return 1;
    }
  };

  const computeChainMetrics = (steps) => {
    const safeSteps = Array.isArray(steps) ? steps : [];
    if (safeSteps.length === 0) {
      return {
        complexity: 'Moderate',
        security: 'Variable',
        keySpace: '0 steps'
      };
    }

    let bitsTotal = 0;
    let maxComplexity = 1;
    let hasVigenere = false;
    let vigenereLengths = [];

    for (const step of safeSteps) {
      bitsTotal += bitsForStep(step);
      maxComplexity = Math.max(maxComplexity, complexityForStep(step?.cipher));
      if (step?.cipher === 'vigenere') {
        hasVigenere = true;
        vigenereLengths.push(((step?.key || '').trim()).length);
      }
    }

    const bits = Math.max(0, bitsTotal);

    // Map estimated key space to a simple security label.
    // (Conservative heuristic, still deterministic and derived from user-selected parameters.)
    let security = 'Very Low';
    if (bits >= 20) security = 'Medium';
    else if (bits >= 10) security = 'Low-Medium';
    else if (bits >= 2) security = 'Low';

    // If any Vigenère keyword is empty, don’t overstate.
    if (hasVigenere && vigenereLengths.some(l => l <= 0)) {
      security = 'Variable';
    }

    const complexity = maxComplexity === 2 || safeSteps.length >= 2 ? 'Moderate' : 'Simple';

    const keySpace = `≈ 2^${bits.toFixed(1)} possibilities (combined)`;

    return { complexity, security, keySpace };
  };
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
  const chainMetrics = selectedCipher === 'chain' ? computeChainMetrics(chainSteps) : null;

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
    },
    chain: {
      icon: '⛓️',
      description: 'Applies multiple ciphers in sequence. Security depends on the chosen order and parameters, but chaining weak ciphers does not guarantee strong security.',
      complexity: chainMetrics?.complexity || 'Variable',
      security: chainMetrics?.security || 'Variable',
      yearInvented: 'Modern',
      keySpace: chainMetrics?.keySpace || 'Combined parameters'
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