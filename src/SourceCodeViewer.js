/**
 * @fileoverview Component for displaying and managing Java source code for cipher algorithms
 * @author Cipher Project Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import './SourceCodeViewer.css';

/**
 * Source code viewer component with collapsible interface
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.selectedCipher - Currently selected cipher algorithm key
 * @description Displays Java source code for cipher algorithms with syntax highlighting, copy functionality, and expandable interface
 * @returns {JSX.Element} Collapsible source code viewer with copy-to-clipboard functionality
 * 
 * @example
 * <SourceCodeViewer selectedCipher="caesar" />
 * <SourceCodeViewer selectedCipher="vigenere" />
 */
const SourceCodeViewer = ({ selectedCipher }) => {
  /**
   * State for controlling the expanded/collapsed state of the code viewer
   * @type {boolean}
   * @default false
   */
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Java source code database for all cipher algorithms
   * @constant {Object} sourceCode
   * @description Contains complete Java implementation source code for each cipher algorithm
   * @property {string} caesar - Caesar cipher Java source code
   * @property {string} rot13 - ROT13 cipher Java source code
   * @property {string} atbash - Atbash cipher Java source code
   * @property {string} vigenere - Vigenère cipher Java source code
   * @property {string} railfence - Rail Fence cipher Java source code
   */
  const sourceCode = {
    caesar: `public class CaesarCipher {
    
    // Encrypt text using Caesar cipher with given shift
    public static String encrypt(String text, int shift) {
        StringBuilder result = new StringBuilder();
        shift = shift % 26; // Handle shifts > 26
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base + shift) % 26 + base));
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // Decrypt text using Caesar cipher with given shift
    public static String decrypt(String text, int shift) {
        return encrypt(text, -shift); // Decrypt by shifting backwards
    }
}`,
    rot13: `public class ROT13Cipher {
    
    // ROT13 cipher - special case of Caesar cipher with shift of 13
    public static String encode(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                result.append((char) ((c - base + 13) % 26 + base));
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // ROT13 is its own inverse - encoding twice returns original text
    public static String decode(String text) {
        return encode(text);
    }
}`,
    atbash: `public class AtbashCipher {
    
    // Atbash cipher - substitutes each letter with its mirror in the alphabet
    // A->Z, B->Y, C->X, etc.
    public static String encode(String text) {
        StringBuilder result = new StringBuilder();
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                if (Character.isUpperCase(c)) {
                    result.append((char) ('Z' - (c - 'A')));
                } else {
                    result.append((char) ('z' - (c - 'a')));
                }
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // Atbash is its own inverse - encoding twice returns original text
    public static String decode(String text) {
        return encode(text);
    }
}`,
    vigenere: `public class VigenereCipher {
    
    // Encrypt text using Vigenère cipher with given key
    public static String encrypt(String text, String key) {
        StringBuilder result = new StringBuilder();
        key = key.toUpperCase();
        int keyIndex = 0;
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                int shift = key.charAt(keyIndex % key.length()) - 'A';
                result.append((char) ((c - base + shift) % 26 + base));
                keyIndex++;
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
    
    // Decrypt text using Vigenère cipher with given key
    public static String decrypt(String text, String key) {
        StringBuilder result = new StringBuilder();
        key = key.toUpperCase();
        int keyIndex = 0;
        
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                char base = Character.isUpperCase(c) ? 'A' : 'a';
                int shift = key.charAt(keyIndex % key.length()) - 'A';
                result.append((char) ((c - base - shift + 26) % 26 + base));
                keyIndex++;
            } else {
                result.append(c); // Keep non-letters unchanged
            }
        }
        return result.toString();
    }
}`,
    railfence: `public class RailFenceCipher {
    
    // Encrypt text using Rail Fence cipher with given number of rails
    public static String encrypt(String text, int rails) {
        if (rails <= 1) return text;
        
        StringBuilder[] fence = new StringBuilder[rails];
        for (int i = 0; i < rails; i++) {
            fence[i] = new StringBuilder();
        }
        
        int rail = 0;
        boolean down = true;
        
        // Place characters in zigzag pattern
        for (char c : text.toCharArray()) {
            fence[rail].append(c);
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        // Concatenate all rails
        StringBuilder result = new StringBuilder();
        for (StringBuilder sb : fence) {
            result.append(sb);
        }
        return result.toString();
    }
    
    // Decrypt text using Rail Fence cipher with given number of rails
    public static String decrypt(String text, int rails) {
        if (rails <= 1) return text;
        
        // Create fence pattern to determine positions
        boolean[][] fence = new boolean[rails][text.length()];
        int rail = 0;
        boolean down = true;
        
        // Mark positions in zigzag pattern
        for (int i = 0; i < text.length(); i++) {
            fence[rail][i] = true;
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        // Fill the fence with characters from encrypted text
        int index = 0;
        char[][] result = new char[rails][text.length()];
        for (int i = 0; i < rails; i++) {
            for (int j = 0; j < text.length(); j++) {
                if (fence[i][j] && index < text.length()) {
                    result[i][j] = text.charAt(index++);
                }
            }
        }
        
        // Read characters in zigzag pattern
        StringBuilder decrypted = new StringBuilder();
        rail = 0;
        down = true;
        for (int i = 0; i < text.length(); i++) {
            decrypted.append(result[rail][i]);
            
            if (down) {
                rail++;
                if (rail == rails - 1) down = false;
            } else {
                rail--;
                if (rail == 0) down = true;
            }
        }
        
        return decrypted.toString();
    }
}`
  };

  /**
   * Copies the current cipher's source code to clipboard
   * @function handleCopyCode
   * @description Uses the Clipboard API to copy Java source code to user's clipboard
   * @returns {void}
   */
  const handleCopyCode = () => {
    navigator.clipboard.writeText(sourceCode[selectedCipher]);
  };

  return (
    <div className="source-code-viewer">
      <div className="code-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <span className="code-icon">💻</span>
          <h3>Java Source Code</h3>
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="code-content">
          <div className="code-actions">
            <button className="copy-code-btn" onClick={handleCopyCode}>
              📋 Copy Code
            </button>
          </div>
          <pre className="code-block">
            <code className="java">{sourceCode[selectedCipher]}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default SourceCodeViewer;