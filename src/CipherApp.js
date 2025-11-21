import React, { useState, useEffect } from 'react';
import './CipherApp.css';

const CipherApp = () => {
  const [selectedCipher, setSelectedCipher] = useState('caesar');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [key, setKey] = useState('');
  const [shift, setShift] = useState(3);
  const [rails, setRails] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);

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
    }
  };

  const handleEncrypt = async () => {
    setIsProcessing(true);
    setAnimateResult(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const cipher = cipherAlgorithms[selectedCipher];
    let result = '';
    
    switch (selectedCipher) {
      case 'caesar':
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
        result = cipher.encrypt(inputText, parseInt(rails));
        break;
      default:
        result = inputText;
    }
    
    setOutputText(result);
    setIsProcessing(false);
    setAnimateResult(true);
  };

  const handleDecrypt = async () => {
    setIsProcessing(true);
    setAnimateResult(false);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const cipher = cipherAlgorithms[selectedCipher];
    let result = '';
    
    switch (selectedCipher) {
      case 'caesar':
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
        result = cipher.decrypt(inputText, parseInt(rails));
        break;
      default:
        result = inputText;
    }
    
    setOutputText(result);
    setIsProcessing(false);
    setAnimateResult(true);
  };

  useEffect(() => {
    if (animateResult) {
      const timer = setTimeout(() => setAnimateResult(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animateResult]);

  return (
    <div className="cipher-app">
      <div className="header">
        <h1 className="title">🔐 Cipher Algorithms</h1>
        <p className="subtitle">Encrypt and decrypt text using classic cipher methods</p>
      </div>
      
      <div className="card cipher-selector-card">
        <div className="cipher-selector">
          <label>🎯 Select Cipher Algorithm:</label>
          <div className="select-wrapper">
            <select value={selectedCipher} onChange={(e) => setSelectedCipher(e.target.value)}>
              {Object.entries(cipherAlgorithms).map(([key, cipher]) => (
                <option key={key} value={key}>{cipher.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              onClick={() => navigator.clipboard.writeText(outputText)}
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CipherApp;