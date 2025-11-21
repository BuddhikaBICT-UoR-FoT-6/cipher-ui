import React, { useState } from 'react';
import './CipherApp.css';

const CipherApp = () => {
  const [selectedCipher, setSelectedCipher] = useState('caesar');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [key, setKey] = useState('');
  const [shift, setShift] = useState(3);
  const [rails, setRails] = useState(3);

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

  const handleEncrypt = () => {
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
  };

  const handleDecrypt = () => {
    const cipher = cipherAlgorithms[selectedCipher];
    let result = '';
    
    switch (selectedCipher) {
      case 'caesar':
        result = cipher.decrypt(inputText, parseInt(shift));
        break;
      case 'rot13':
      case 'atbash':
        result = cipher.encode(inputText); // Self-inverse
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
  };

  return (
    <div className="cipher-app">
      <h1>Cipher Algorithms</h1>
      
      <div className="cipher-selector">
        <label>Select Cipher:</label>
        <select value={selectedCipher} onChange={(e) => setSelectedCipher(e.target.value)}>
          {Object.entries(cipherAlgorithms).map(([key, cipher]) => (
            <option key={key} value={key}>{cipher.name}</option>
          ))}
        </select>
      </div>

      <div className="input-section">
        <label>Input Text:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to encrypt/decrypt"
        />
      </div>

      <div className="parameters">
        {(selectedCipher === 'caesar') && (
          <div>
            <label>Shift:</label>
            <input
              type="number"
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              min="1"
              max="25"
            />
          </div>
        )}
        
        {selectedCipher === 'vigenere' && (
          <div>
            <label>Key:</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter keyword"
            />
          </div>
        )}
        
        {selectedCipher === 'railfence' && (
          <div>
            <label>Rails:</label>
            <input
              type="number"
              value={rails}
              onChange={(e) => setRails(e.target.value)}
              min="2"
              max="10"
            />
          </div>
        )}
      </div>

      <div className="buttons">
        <button onClick={handleEncrypt}>Encrypt</button>
        <button onClick={handleDecrypt}>Decrypt</button>
      </div>

      <div className="output-section">
        <label>Output:</label>
        <textarea
          value={outputText}
          readOnly
          placeholder="Result will appear here"
        />
      </div>
    </div>
  );
};

export default CipherApp;