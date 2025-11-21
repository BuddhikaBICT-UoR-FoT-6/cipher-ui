# CipherApp Documentation

## Overview
Main cipher application component with encryption/decryption functionality

## Project Information
- **Project:** Cipher Algorithms Implementation
- **Version:** 1.0.0
- **Author:** Cipher Project Team
- **File:** `src/CipherApp.js`

---

## Functions

<dl>
<dt><a href="#CipherApp">CipherApp()</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Provides UI for encrypting and decrypting text using various cipher algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers</p>
</dd>
<dt><a href="#handleEncrypt">handleEncrypt()</a> ⇒ <code>Promise.&lt;void&gt;</code></dt>
<dd><p>Processes text encryption with visual feedback, animations, and parameter validation</p>
</dd>
<dt><a href="#handleDecrypt">handleDecrypt()</a> ⇒ <code>Promise.&lt;void&gt;</code></dt>
<dd><p>Processes text decryption with visual feedback, animations, and parameter validation</p>
</dd>
<dt><a href="#useEffect">useEffect(callback, dependencies)</a></dt>
<dd><p>Automatically removes animation class after 1 second to reset animation state</p>
</dd>
</dl>

<a name="CipherApp"></a>

## CipherApp() ⇒ <code>JSX.Element</code>
Provides UI for encrypting and decrypting text using various cipher algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers

**Kind**: global function  
**Returns**: <code>JSX.Element</code> - The main cipher application interface with theme support and animations  
**Component**:   
**Example**  
```js
// Usage in App.js
<CipherApp />
```
<a name="handleEncrypt"></a>

## handleEncrypt() ⇒ <code>Promise.&lt;void&gt;</code>
Processes text encryption with visual feedback, animations, and parameter validation

**Kind**: global function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Promise that resolves when encryption is complete  
**Throws**:

- <code>Error</code> When invalid parameters are provided for specific ciphers

<a name="handleDecrypt"></a>

## handleDecrypt() ⇒ <code>Promise.&lt;void&gt;</code>
Processes text decryption with visual feedback, animations, and parameter validation

**Kind**: global function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Promise that resolves when decryption is complete  
**Throws**:

- <code>Error</code> When invalid parameters are provided for specific ciphers

<a name="useEffect"></a>

## useEffect(callback, dependencies)
Automatically removes animation class after 1 second to reset animation state

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Cleanup function for animation timer |
| dependencies | <code>Array</code> | Dependencies array containing animateResult state |



---

## Usage in Project
This component is part of the Cipher Project React application that provides a user interface for various encryption and decryption algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers.

## Related Components
- AlgorithmInfo
- SourceCodeViewer
- ThemeToggle
- ThemeContext
