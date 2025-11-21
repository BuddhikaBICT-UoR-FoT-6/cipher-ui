/**
 * @fileoverview Custom cipher builder component for creating user-defined substitution ciphers
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import './CustomCipherBuilder.css';

/**
 * Custom cipher builder component
 * @component
 * @description Allows users to create their own substitution ciphers by mapping each letter to another letter
 * @returns {JSX.Element} Custom cipher builder interface with alphabet mapping
 * 
 * @example
 * <CustomCipherBuilder />
 */
const CustomCipherBuilder = () => {
  /**
   * Alphabet mapping state for custom cipher
   * @type {Object}
   * @default Default alphabet mapping (A->A, B->B, etc.)
   */
  const [mapping, setMapping] = useState({});
  
  /**
   * Input text for testing the custom cipher
   * @type {string}
   */
  const [testText, setTestText] = useState('');
  
  /**
   * Output text after applying custom cipher
   * @type {string}
   */
  const [outputText, setOutputText] = useState('');
  
  /**
   * Name for the custom cipher
   * @type {string}
   */
  const [cipherName, setCipherName] = useState('My Custom Cipher');

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  /**
   * Initialize default mapping on component mount
   * @function useEffect
   */
  useEffect(() => {
    const defaultMapping = {};
    alphabet.forEach(letter => {
      defaultMapping[letter] = letter;
    });
    setMapping(defaultMapping);
  }, []);

  /**
   * Updates the mapping for a specific letter
   * @function handleMappingChange
   * @param {string} fromLetter - Original letter
   * @param {string} toLetter - Mapped letter
   */
  const handleMappingChange = (fromLetter, toLetter) => {
    setMapping(prev => ({
      ...prev,
      [fromLetter]: toLetter.toUpperCase()
    }));
  };

  /**
   * Applies the custom cipher to input text
   * @function applyCipher
   * @param {string} text - Text to encrypt/decrypt
   * @param {boolean} reverse - Whether to reverse the mapping for decryption
   * @returns {string} Processed text
   */
  const applyCipher = (text, reverse = false) => {
    let processedMapping = mapping;
    
    if (reverse) {
      processedMapping = {};
      Object.entries(mapping).forEach(([key, value]) => {
        processedMapping[value] = key;
      });
    }

    return text.toUpperCase().split('').map(char => {
      if (/[A-Z]/.test(char)) {
        return processedMapping[char] || char;
      }
      return char;
    }).join('');
  };

  /**
   * Encrypts text using custom cipher
   * @function handleEncrypt
   */
  const handleEncrypt = () => {
    const encrypted = applyCipher(testText, false);
    setOutputText(encrypted);
  };

  /**
   * Decrypts text using custom cipher
   * @function handleDecrypt
   */
  const handleDecrypt = () => {
    const decrypted = applyCipher(testText, true);
    setOutputText(decrypted);
  };

  /**
   * Randomizes the alphabet mapping
   * @function randomizeMapping
   */
  const randomizeMapping = () => {
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    const newMapping = {};
    alphabet.forEach((letter, index) => {
      newMapping[letter] = shuffled[index];
    });
    setMapping(newMapping);
  };

  /**
   * Resets mapping to default (A->A, B->B, etc.)
   * @function resetMapping
   */
  const resetMapping = () => {
    const defaultMapping = {};
    alphabet.forEach(letter => {
      defaultMapping[letter] = letter;
    });
    setMapping(defaultMapping);
  };

  /**
   * Saves the custom cipher to database
   * @function saveCipher
   */
  const saveCipher = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ciphers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: cipherName,
          mapping: mapping
        })
      });

      if (response.ok) {
        alert('Cipher saved successfully!');
      } else {
        alert('Failed to save cipher');
      }
    } catch (error) {
      alert('Error saving cipher');
    }
  };

  /**
   * Generates Java source code for the custom cipher
   * @function generateJavaCode
   * @returns {string} Java source code
   */
  const generateJavaCode = () => {
    const className = cipherName.replace(/\s+/g, '') + 'Cipher';
    
    // Create mapping arrays
    const fromLetters = Object.keys(mapping).join('');
    const toLetters = Object.values(mapping).join('');
    
    return `public class ${className} {
    
    // Custom cipher mapping: ${cipherName}
    private static final String FROM_ALPHABET = "${fromLetters}";
    private static final String TO_ALPHABET = "${toLetters}";
    
    /**
     * Encrypts text using ${cipherName}
     * @param text The input text to encrypt
     * @return Encrypted text
     */
    public static String encrypt(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char upperChar = Character.toUpperCase(c);
                int index = FROM_ALPHABET.indexOf(upperChar);
                
                if (index != -1) {
                    char mappedChar = TO_ALPHABET.charAt(index);
                    result.append(Character.isUpperCase(c) ? mappedChar : Character.toLowerCase(mappedChar));
                } else {
                    result.append(c); // Keep unmapped characters unchanged
                }
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    /**
     * Decrypts text using ${cipherName}
     * @param text The input text to decrypt
     * @return Decrypted text
     */
    public static String decrypt(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char upperChar = Character.toUpperCase(c);
                int index = TO_ALPHABET.indexOf(upperChar);
                
                if (index != -1) {
                    char mappedChar = FROM_ALPHABET.charAt(index);
                    result.append(Character.isUpperCase(c) ? mappedChar : Character.toLowerCase(mappedChar));
                } else {
                    result.append(c); // Keep unmapped characters unchanged
                }
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    /**
     * Main method for testing the cipher
     */
    public static void main(String[] args) {
        String plaintext = "Hello World";
        String encrypted = encrypt(plaintext);
        String decrypted = decrypt(encrypted);
        
        System.out.println("Original: " + plaintext);
        System.out.println("Encrypted: " + encrypted);
        System.out.println("Decrypted: " + decrypted);
    }
}`;
  };

  /**
   * Downloads the Java source code
   * @function downloadJavaCode
   */
  const downloadJavaCode = () => {
    const javaCode = generateJavaCode();
    const className = cipherName.replace(/\s+/g, '') + 'Cipher';
    
    const blob = new Blob([javaCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${className}.java`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Exports the custom cipher configuration
   * @function exportCipher
   */
  const exportCipher = () => {
    const config = {
      name: cipherName,
      mapping: mapping,
      created: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cipherName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="custom-cipher-builder">
      <div className="builder-header">
        <h2>🔧 Custom Cipher Builder</h2>
        <p>Create your own substitution cipher by mapping each letter</p>
      </div>

      <div className="cipher-name-section">
        <label>Cipher Name:</label>
        <input
          type="text"
          value={cipherName}
          onChange={(e) => setCipherName(e.target.value)}
          className="cipher-name-input"
          placeholder="Enter cipher name"
        />
      </div>

      <div className="mapping-section">
        <div className="mapping-header">
          <h3>Alphabet Mapping</h3>
          <div className="mapping-controls">
            <button onClick={randomizeMapping} className="control-btn randomize-btn">
              🎲 Randomize
            </button>
            <button onClick={resetMapping} className="control-btn reset-btn">
              🔄 Reset
            </button>
          </div>
        </div>

        <div className="alphabet-grid">
          {alphabet.map(letter => (
            <div key={letter} className="letter-mapping">
              <div className="from-letter">{letter}</div>
              <div className="arrow">→</div>
              <select
                value={mapping[letter] || letter}
                onChange={(e) => handleMappingChange(letter, e.target.value)}
                className="to-letter-select"
              >
                {alphabet.map(targetLetter => (
                  <option key={targetLetter} value={targetLetter}>
                    {targetLetter}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="test-section">
        <h3>Test Your Cipher</h3>
        <div className="test-input">
          <label>Input Text:</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test your cipher..."
            className="test-textarea"
          />
        </div>

        <div className="test-buttons">
          <button onClick={handleEncrypt} className="test-btn encrypt-btn">
            🔒 Encrypt
          </button>
          <button onClick={handleDecrypt} className="test-btn decrypt-btn">
            🔓 Decrypt
          </button>
        </div>

        <div className="test-output">
          <label>Output:</label>
          <textarea
            value={outputText}
            readOnly
            placeholder="Result will appear here..."
            className="output-textarea"
          />
        </div>
      </div>

      <div className="export-section">
        <button onClick={saveCipher} className="save-btn">
          💾 Save Cipher
        </button>
        <button onClick={downloadJavaCode} className="java-btn">
          ☕ Get Java Code
        </button>
        <button onClick={exportCipher} className="export-btn">
          📥 Export JSON
        </button>
      </div>
    </div>
  );
};

export default CustomCipherBuilder;