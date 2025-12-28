/**
 * @fileoverview Main cipher application component with encryption/decryption functionality
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import AlgorithmInfo from './AlgorithmInfo';
import SourceCodeViewer from './SourceCodeViewer';
import CustomCipherBuilder from './CustomCipherBuilder';
import BruteForceSimulator from './BruteForceSimulator';
import RailFencePattern from './RailFencePattern';
import CryptanalysisChallenge from './CryptanalysisChallenge';
import { showToast } from './Toast';
import './CipherApp.css';

/**
 * Main cipher application component
 * @component
 * @description Provides UI for encrypting and decrypting text using various cipher algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers
 * @returns {JSX.Element} The main cipher application interface with theme support and animations
 * 
 * @example
 * // Usage in App.js
 * <CipherApp />
 */
const CipherApp = ({ user, onShowLogin }) => {
  const [selectedCipher, setSelectedCipher] = useState('caesar');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [key, setKey] = useState('');
  const [shift, setShift] = useState(3);
  const [rails, setRails] = useState(3);
  const [showCryptanalysisChallenge, setShowCryptanalysisChallenge] = useState(false);
  const [chainSteps, setChainSteps] = useState([
    { id: 'step-1', cipher: 'caesar', shift: 3, key: '', rails: 3 }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
  const [showBruteForce, setShowBruteForce] = useState(false);
  const [customCipherMapping, setCustomCipherMapping] = useState({});
  const [customCipherName, setCustomCipherName] = useState('My Custom Cipher');

  const cipherAlgorithms = {
    caesar: {
      name: 'Caesar Cipher',
      encrypt: (text, shift) => {
        return text.replace(/[a-zA-Z]/g, char => {
          const start = char <= 'Z' ? 65 : 97;
          return String.fromCharCode(((char.charCodeAt(0) - start + shift) % 26) + start);
        });
      },
      decrypt: (text, shift) => {
        return text.replace(/[a-zA-Z]/g, char => {
          const start = char <= 'Z' ? 65 : 97;
          return String.fromCharCode(((char.charCodeAt(0) - start - shift + 26) % 26) + start);
        });
      }
    },
    rot13: {
      name: 'ROT13 Cipher',
      encode: (text) => {
        return text.replace(/[a-zA-Z]/g, char => {
          const start = char <= 'Z' ? 65 : 97;
          return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
      }
    },
    atbash: {
      name: 'Atbash Cipher',
      encode: (text) => {
        return text.replace(/[a-zA-Z]/g, char => {
          const start = char <= 'Z' ? 65 : 97;
          return String.fromCharCode((25 - (char.charCodeAt(0) - start)) + start);
        });
      }
    },
    vigenere: {
      name: 'Vigenère Cipher',
      encrypt: (text, key) => {
        let result = '';
        let keyIndex = 0;
        for (let char of text) {
          if (/[a-zA-Z]/.test(char)) {
            const start = char <= 'Z' ? 65 : 97;
            const keyChar = key[keyIndex % key.length].toUpperCase();
            const shift = keyChar.charCodeAt(0) - 65;
            result += String.fromCharCode(((char.charCodeAt(0) - start + shift) % 26) + start);
            keyIndex++;
          } else {
            result += char;
          }
        }
        return result;
      },
      decrypt: (text, key) => {
        let result = '';
        let keyIndex = 0;
        for (let char of text) {
          if (/[a-zA-Z]/.test(char)) {
            const start = char <= 'Z' ? 65 : 97;
            const keyChar = key[keyIndex % key.length].toUpperCase();
            const shift = keyChar.charCodeAt(0) - 65;
            result += String.fromCharCode(((char.charCodeAt(0) - start - shift + 26) % 26) + start);
            keyIndex++;
          } else {
            result += char;
          }
        }
        return result;
      }
    },
    railfence: {
      name: 'Rail Fence Cipher',
      encrypt: (text, rails) => {
        if (rails === 1) return text;
        const fence = Array(rails).fill().map(() => []);
        let rail = 0;
        let direction = 1;
        
        for (let char of text) {
          fence[rail].push(char);
          rail += direction;
          if (rail === rails - 1 || rail === 0) direction = -direction;
        }
        
        return fence.flat().join('');
      },
      decrypt: (text, rails) => {
        if (rails === 1) return text;
        const fence = Array(rails).fill().map(() => []);
        const pattern = [];
        let rail = 0;
        let direction = 1;
        
        for (let i = 0; i < text.length; i++) {
          pattern.push(rail);
          rail += direction;
          if (rail === rails - 1 || rail === 0) direction = -direction;
        }
        
        let index = 0;
        for (let r = 0; r < rails; r++) {
          for (let i = 0; i < pattern.length; i++) {
            if (pattern[i] === r) {
              fence[r].push(text[index++]);
            }
          }
        }
        
        let result = '';
        rail = 0;
        direction = 1;
        const railIndex = Array(rails).fill(0);
        
        for (let i = 0; i < text.length; i++) {
          result += fence[rail][railIndex[rail]++];
          rail += direction;
          if (rail === rails - 1 || rail === 0) direction = -direction;
        }
        
        return result;
      }
    },
    chain: {
      name: 'Multiple Cipher Chaining'
    },
    custom: {
      name: 'Custom Cipher Builder'
    }
  };

  // Ensure chaining stays restricted to authenticated users.
  useEffect(() => {
    if (!user && selectedCipher === 'chain') {
      setSelectedCipher('caesar');
    }
  }, [user, selectedCipher]);

  // Ensure cryptanalysis modal stays restricted to authenticated users.
  useEffect(() => {
    if (!user && showCryptanalysisChallenge) {
      setShowCryptanalysisChallenge(false);
    }
  }, [user, showCryptanalysisChallenge]);

  const applyChainStep = (text, step, operation) => {
    const cipherKey = step?.cipher;

    switch (cipherKey) {
      case 'caesar': {
        const stepShift = parseInt(step.shift, 10);
        if (!Number.isFinite(stepShift) || stepShift < 1 || stepShift > 25) {
          throw new Error('Invalid Caesar shift');
        }
        return operation === 'encrypt'
          ? cipherAlgorithms.caesar.encrypt(text, stepShift)
          : cipherAlgorithms.caesar.decrypt(text, stepShift);
      }
      case 'rot13':
        return cipherAlgorithms.rot13.encode(text);
      case 'atbash':
        return cipherAlgorithms.atbash.encode(text);
      case 'vigenere': {
        const stepKey = (step.key || '').trim();
        if (!stepKey) {
          throw new Error('Missing Vigenère keyword');
        }
        return operation === 'encrypt'
          ? cipherAlgorithms.vigenere.encrypt(text, stepKey)
          : cipherAlgorithms.vigenere.decrypt(text, stepKey);
      }
      case 'railfence': {
        const stepRails = parseInt(step.rails, 10);
        if (!Number.isFinite(stepRails) || stepRails < 2 || stepRails > 10) {
          throw new Error('Invalid Rail Fence rails');
        }
        return operation === 'encrypt'
          ? cipherAlgorithms.railfence.encrypt(text, stepRails)
          : cipherAlgorithms.railfence.decrypt(text, stepRails);
      }
      default:
        throw new Error('Unsupported chain cipher');
    }
  };

  const chainEncrypt = (text) => {
    if (!user) {
      throw new Error('Authentication required');
    }
    if (!Array.isArray(chainSteps) || chainSteps.length === 0) {
      throw new Error('No chain steps');
    }

    let result = text;
    for (const step of chainSteps) {
      result = applyChainStep(result, step, 'encrypt');
    }
    return result;
  };

  const chainDecrypt = (text) => {
    if (!user) {
      throw new Error('Authentication required');
    }
    if (!Array.isArray(chainSteps) || chainSteps.length === 0) {
      throw new Error('No chain steps');
    }

    let result = text;
    for (const step of [...chainSteps].reverse()) {
      result = applyChainStep(result, step, 'decrypt');
    }
    return result;
  };

  /**
   * Encrypts input text using selected cipher algorithm
   * @async
   * @function handleEncrypt
   * @description Processes text encryption with visual feedback, animations, and parameter validation
   * @returns {Promise<void>} Promise that resolves when encryption is complete
   * @throws {Error} When invalid parameters are provided for specific ciphers
   */
  const handleEncrypt = async () => {
    try {
      if (!inputText.trim()) {
        showToast('Please enter text to encrypt', 'warning');
        return;
      }
      
      if (selectedCipher === 'vigenere' && !key.trim()) {
        showToast('Please enter a keyword for Vigenère cipher', 'warning');
        return;
      }
      
      setIsProcessing(true);
      setAnimateResult(false);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const cipher = cipherAlgorithms[selectedCipher];
      let result = '';
      
      switch (selectedCipher) {
        case 'caesar':
          if (shift < 1 || shift > 25) {
            showToast('Shift value must be between 1 and 25', 'warning');
            setIsProcessing(false);
            return;
          }
          result = cipher.encrypt(inputText, parseInt(shift));
          break;
        case 'rot13':
        case 'atbash':
          result = cipher.encode(inputText);
          break;
        case 'vigenere':
          result = cipher.encrypt(inputText, key);
          break;
        case 'railfence':
          if (rails < 2 || rails > 10) {
            showToast('Number of rails must be between 2 and 10', 'warning');
            setIsProcessing(false);
            return;
          }
          result = cipher.encrypt(inputText, parseInt(rails));
          break;
        case 'chain':
          result = chainEncrypt(inputText);
          break;
        default:
          result = inputText;
      }
      
      setOutputText(result);
      setIsProcessing(false);
      setAnimateResult(true);
      showToast(`Text encrypted using ${cipher.name}`, 'success');
    } catch (error) {
      setIsProcessing(false);
      showToast('Encryption failed. Please try again.', 'error');
    }
  };

  /**
   * Decrypts input text using selected cipher algorithm
   * @async
   * @function handleDecrypt
   * @description Processes text decryption with visual feedback, animations, and parameter validation
   * @returns {Promise<void>} Promise that resolves when decryption is complete
   * @throws {Error} When invalid parameters are provided for specific ciphers
   */
  const handleDecrypt = async () => {
    try {
      if (!inputText.trim()) {
        showToast('Please enter text to decrypt', 'warning');
        return;
      }
      
      if (selectedCipher === 'vigenere' && !key.trim()) {
        showToast('Please enter a keyword for Vigenère cipher', 'warning');
        return;
      }
      
      setIsProcessing(true);
      setAnimateResult(false);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const cipher = cipherAlgorithms[selectedCipher];
      let result = '';
      
      switch (selectedCipher) {
        case 'caesar':
          if (shift < 1 || shift > 25) {
            showToast('Shift value must be between 1 and 25', 'warning');
            setIsProcessing(false);
            return;
          }
          result = cipher.decrypt(inputText, parseInt(shift));
          break;
        case 'rot13':
        case 'atbash':
          result = cipher.encode(inputText);
          break;
        case 'vigenere':
          result = cipher.decrypt(inputText, key);
          break;
        case 'railfence':
          if (rails < 2 || rails > 10) {
            showToast('Number of rails must be between 2 and 10', 'warning');
            setIsProcessing(false);
            return;
          }
          result = cipher.decrypt(inputText, parseInt(rails));
          break;
        case 'chain':
          result = chainDecrypt(inputText);
          break;
        default:
          result = inputText;
      }
      
      setOutputText(result);
      setIsProcessing(false);
      setAnimateResult(true);
      showToast(`Text decrypted using ${cipher.name}`, 'success');
    } catch (error) {
      setIsProcessing(false);
      showToast('Decryption failed. Please try again.', 'error');
    }
  };

  /**
   * Effect hook to manage result animation timing
   * @function useEffect
   * @description Automatically removes animation class after 1 second to reset animation state
   * @param {Function} callback - Cleanup function for animation timer
   * @param {Array} dependencies - Dependencies array containing animateResult state
   */
  useEffect(() => {
    if (animateResult) {
      const timer = setTimeout(() => setAnimateResult(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animateResult]);

  const handleCipherChange = (cipher) => {
    setSelectedCipher(cipher);
  };

  const availableCipherEntries = Object.entries(cipherAlgorithms).filter(([cipherKey]) => {
    if (cipherKey === 'chain') return !!user;
    return true;
  });

  const updateChainStep = (stepId, patch) => {
    setChainSteps(prev => prev.map(s => (s.id === stepId ? { ...s, ...patch } : s)));
  };

  const addChainStep = () => {
    setChainSteps(prev => {
      if (prev.length >= 5) return prev;
      const nextIndex = prev.length + 1;
      return [...prev, { id: `step-${nextIndex}`, cipher: 'caesar', shift: 3, key: '', rails: 3 }];
    });
  };

  const removeChainStep = (stepId) => {
    setChainSteps(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(s => s.id !== stepId);
    });
  };

  return (
    <div className="cipher-app">
      <div className="header">
        <h1 className="title">🔐 Cipher Algorithms</h1>
        <p className="subtitle">Encrypt and decrypt text using classic cipher methods</p>

        {user && (
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="prompt-login-btn"
              onClick={() => setShowCryptanalysisChallenge(true)}
            >
              Cryptanalysis Challenge
            </button>
          </div>
        )}
      </div>
      
      <div className="card cipher-selector-card">
        <div className="cipher-selector">
          <label>🎯 Select Cipher Algorithm:</label>
          <div className="select-wrapper">
            <select value={selectedCipher} onChange={(e) => handleCipherChange(e.target.value)}>
              {availableCipherEntries.map(([key, cipher]) => (
                <option key={key} value={key}>{cipher.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCipher !== 'custom' && (
        <AlgorithmInfo
          selectedCipher={selectedCipher}
          chainSteps={selectedCipher === 'chain' ? chainSteps : undefined}
        />
      )}

      {selectedCipher !== 'custom' && (
        <SourceCodeViewer selectedCipher={selectedCipher} />
      )}

      {selectedCipher === 'custom' ? (
        user ? (
          <CustomCipherBuilder 
            onMappingChange={setCustomCipherMapping}
            onNameChange={setCustomCipherName}
          />
        ) : (
          <div className="card login-prompt-card">
            <div className="login-prompt">
              <h3>🔐 Authentication Required</h3>
              <p>Please login or register to access the Custom Cipher Builder feature.</p>
              <button onClick={onShowLogin} className="prompt-login-btn">
                🔑 Login / Register
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="card input-card">
            <div className="input-section">
              <label>📝 Input Text:</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your message here..."
                className="input-textarea"
              />
            </div>
          </div>

          {selectedCipher === 'chain' && (
            user ? (
              <div className="card chain-card">
                <label className="parameters-title">⛓️ Cipher Chain (applies top → bottom):</label>
                <div className="chain-steps">
                  {chainSteps.map((step, index) => (
                    <div key={step.id} className="chain-step">
                      <div className="chain-step-header">
                        <strong>Step {index + 1}</strong>
                        <button
                          type="button"
                          className="btn chain-remove-btn"
                          onClick={() => removeChainStep(step.id)}
                          disabled={chainSteps.length <= 1}
                        >
                          ✖ Remove
                        </button>
                      </div>

                      <div className="parameter-group">
                        <label>🔗 Cipher:</label>
                        <select
                          value={step.cipher}
                          onChange={(e) => updateChainStep(step.id, { cipher: e.target.value })}
                          className="parameter-input"
                        >
                          <option value="caesar">Caesar</option>
                          <option value="rot13">ROT13</option>
                          <option value="atbash">Atbash</option>
                          <option value="vigenere">Vigenère</option>
                          <option value="railfence">Rail Fence</option>
                        </select>
                      </div>

                      {step.cipher === 'caesar' && (
                        <div className="parameter-group">
                          <label>🔢 Shift:</label>
                          <input
                            type="number"
                            value={step.shift}
                            onChange={(e) => updateChainStep(step.id, { shift: e.target.value })}
                            min="1"
                            max="25"
                            className="parameter-input"
                          />
                        </div>
                      )}

                      {step.cipher === 'vigenere' && (
                        <div className="parameter-group">
                          <label>🔑 Keyword:</label>
                          <input
                            type="text"
                            value={step.key}
                            onChange={(e) => updateChainStep(step.id, { key: e.target.value })}
                            placeholder="Enter keyword"
                            className="parameter-input"
                          />
                        </div>
                      )}

                      {step.cipher === 'railfence' && (
                        <div className="parameter-group">
                          <label>🚂 Rails:</label>
                          <input
                            type="number"
                            value={step.rails}
                            onChange={(e) => updateChainStep(step.id, { rails: e.target.value })}
                            min="2"
                            max="10"
                            className="parameter-input"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="chain-actions">
                  <button
                    type="button"
                    className="btn chain-add-btn"
                    onClick={addChainStep}
                    disabled={chainSteps.length >= 5}
                  >
                    ➕ Add Step
                  </button>
                </div>
              </div>
            ) : (
              <div className="card login-prompt-card">
                <div className="login-prompt">
                  <h3>🔐 Authentication Required</h3>
                  <p>Please login or register to access Multiple Cipher Chaining.</p>
                  <button onClick={onShowLogin} className="prompt-login-btn">
                    🔑 Login / Register
                  </button>
                </div>
              </div>
            )
          )}

          {(selectedCipher === 'caesar' || selectedCipher === 'vigenere' || selectedCipher === 'railfence') && (
        <div className="card parameters-card">
          <label className="parameters-title">⚙️ Parameters:</label>
          <div className="parameters">
            {selectedCipher === 'caesar' && (
              <div className="parameter-group">
                <label>🔢 Shift Value:</label>
                <input
                  type="number"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  min="1"
                  max="25"
                  className="parameter-input"
                />
              </div>
            )}
            
            {selectedCipher === 'vigenere' && (
              <div className="parameter-group">
                <label>🔑 Keyword:</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter secret keyword"
                  className="parameter-input"
                />
              </div>
            )}
            
            {selectedCipher === 'railfence' && (
              <div className="parameter-group">
                <label>🚂 Number of Rails:</label>
                <input
                  type="number"
                  value={rails}
                  onChange={(e) => setRails(e.target.value)}
                  min="2"
                  max="10"
                  className="parameter-input"
                />
              </div>
            )}
            </div>
          </div>
          )}

          {selectedCipher === 'railfence' && inputText.trim() && (
            <div className="card railfence-visual-card">
              <label className="parameters-title">🧵 Rail Fence Zigzag Pattern:</label>
              <RailFencePattern text={inputText} rails={rails} />
            </div>
          )}

          <div className="card buttons-card">
            <div className="buttons">
              <button 
                onClick={handleEncrypt} 
                disabled={isProcessing || !inputText.trim()}
                className={`btn encrypt-btn ${isProcessing ? 'processing' : ''}`}
              >
                {isProcessing ? (
                  <><span className="spinner"></span> Processing...</>
                ) : (
                  <>🔒 Encrypt</>
                )}
              </button>
              <button 
                onClick={handleDecrypt} 
                disabled={isProcessing || !inputText.trim()}
                className={`btn decrypt-btn ${isProcessing ? 'processing' : ''}`}
              >
                {isProcessing ? (
                  <><span className="spinner"></span> Processing...</>
                ) : (
                  <>🔓 Decrypt</>
                )}
              </button>
            </div>
          </div>

          <div className={`card output-card ${animateResult ? 'animate-result' : ''}`}>
            <div className="output-section">
              <label>✨ Output Result:</label>
              <textarea
                value={outputText}
                readOnly
                placeholder="Your encrypted/decrypted text will appear here..."
                className="output-textarea"
              />
              {outputText && (
                <button 
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(outputText);
                    showToast('Text copied to clipboard!', 'success');
                  }}
                  title="Copy to clipboard"
                >
                  📋 Copy
                </button>
              )}
            </div>
          </div>
        </>
      )}
      
      {selectedCipher === 'custom' && (
        <button 
          className="floating-brute-force-btn"
          onClick={() => setShowBruteForce(true)}
          title="Analyze cipher security"
        >
          🔓
        </button>
      )}
      
      <BruteForceSimulator 
        isVisible={showBruteForce}
        onClose={() => setShowBruteForce(false)}
        customCipherData={selectedCipher === 'custom' ? { 
          name: customCipherName, 
          mapping: customCipherMapping 
        } : null}
      />

      {showCryptanalysisChallenge && (
        <CryptanalysisChallenge user={user} onClose={() => setShowCryptanalysisChallenge(false)} />
      )}
    </div>
  );
};

export default CipherApp;