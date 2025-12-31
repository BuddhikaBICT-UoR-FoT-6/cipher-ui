# SourceCodeViewer Documentation

## Overview
Component for displaying Java source code with syntax highlighting

## Project Information
- **Project:** Cipher Algorithms Implementation
- **Version:** 1.0.0
- **Author:** Cipher Project Team
- **File:** `src/SourceCodeViewer.js`

---

## Constants

<dl>
<dt><a href="#sourceCode">sourceCode</a> : <code>Object</code></dt>
<dd><p>Contains complete Java implementation source code for each cipher algorithm</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#SourceCodeViewer">SourceCodeViewer(props)</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Displays Java source code for cipher algorithms with syntax highlighting, copy functionality, and expandable interface</p>
</dd>
<dt><a href="#handleCopyCode">handleCopyCode()</a> ⇒ <code>void</code></dt>
<dd><p>Uses the Clipboard API to copy Java source code to user&#39;s clipboard</p>
</dd>
</dl>

<a name="sourceCode"></a>

## sourceCode : <code>Object</code>
Contains complete Java implementation source code for each cipher algorithm

**Kind**: global constant  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| caesar | <code>string</code> | Caesar cipher Java source code |
| rot13 | <code>string</code> | ROT13 cipher Java source code |
| atbash | <code>string</code> | Atbash cipher Java source code |
| vigenere | <code>string</code> | Vigenère cipher Java source code |
| railfence | <code>string</code> | Rail Fence cipher Java source code |

<a name="SourceCodeViewer"></a>

## SourceCodeViewer(props) ⇒ <code>JSX.Element</code>
Displays Java source code for cipher algorithms with syntax highlighting, copy functionality, and expandable interface

**Kind**: global function  
**Returns**: <code>JSX.Element</code> - Collapsible source code viewer with copy-to-clipboard functionality  
**Component**:   

| Param | Type | Description |
| --- | --- | --- |
| props | <code>Object</code> | Component properties |
| props.selectedCipher | <code>string</code> | Currently selected cipher algorithm key |

**Example**  
```js
<SourceCodeViewer selectedCipher="caesar" />
<SourceCodeViewer selectedCipher="vigenere" />
```
<a name="handleCopyCode"></a>

## handleCopyCode() ⇒ <code>void</code>
Uses the Clipboard API to copy Java source code to user's clipboard

**Kind**: global function  


---

## Usage in Project
This component is part of the Cipher Project React application that provides a user interface for various encryption and decryption algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers.

## Related Components
- CipherApp
- AlgorithmInfo
- ThemeToggle
- ThemeContext
