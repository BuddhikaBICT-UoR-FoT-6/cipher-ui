# AlgorithmInfo Documentation

## Overview
Component displaying detailed information about cipher algorithms

## Project Information
- **Project:** Cipher Algorithms Implementation
- **Version:** 1.0.0
- **Author:** Cipher Project Team
- **File:** `src/AlgorithmInfo.js`

---

## Constants

<dl>
<dt><a href="#algorithmDetails">algorithmDetails</a> : <code>Object</code></dt>
<dd><p>Contains detailed information for each cipher including icons, descriptions, complexity ratings, security levels, historical data, and key space analysis</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#AlgorithmInfo">AlgorithmInfo(props)</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Shows algorithm details including complexity, security level, historical information, and key space analysis</p>
</dd>
</dl>

<a name="algorithmDetails"></a>

## algorithmDetails : <code>Object</code>
Contains detailed information for each cipher including icons, descriptions, complexity ratings, security levels, historical data, and key space analysis

**Kind**: global constant  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| caesar | <code>Object</code> | Caesar cipher information |
| rot13 | <code>Object</code> | ROT13 cipher information |
| atbash | <code>Object</code> | Atbash cipher information |
| vigenere | <code>Object</code> | Vigenère cipher information |
| railfence | <code>Object</code> | Rail Fence cipher information |

<a name="AlgorithmInfo"></a>

## AlgorithmInfo(props) ⇒ <code>JSX.Element</code>
Shows algorithm details including complexity, security level, historical information, and key space analysis

**Kind**: global function  
**Returns**: <code>JSX.Element</code> - Algorithm information panel with animated entrance and hover effects  
**Component**:   

| Param | Type | Description |
| --- | --- | --- |
| props | <code>Object</code> | Component properties |
| props.selectedCipher | <code>string</code> | Currently selected cipher algorithm key (caesar|rot13|atbash|vigenere|railfence) |

**Example**  
```js
<AlgorithmInfo selectedCipher="caesar" />
<AlgorithmInfo selectedCipher="vigenere" />
```


---

## Usage in Project
This component is part of the Cipher Project React application that provides a user interface for various encryption and decryption algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers.

## Related Components
- CipherApp
- SourceCodeViewer
- ThemeToggle
- ThemeContext
