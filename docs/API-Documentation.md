# Cipher Project - Complete API Documentation

## Project Overview
This documentation covers the complete React application for the Cipher Algorithms project. The application provides a modern, responsive interface for encrypting and decrypting text using classical cipher algorithms.

## Features
- **5 Cipher Algorithms:** Caesar, ROT13, Atbash, Vigenère, and Rail Fence
- **Theme Support:** Light (purple) and dark (black) themes
- **Source Code Viewer:** Display Java implementations with syntax highlighting
- **Algorithm Information:** Detailed information about each cipher's security and complexity
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Animations:** Smooth transitions and visual feedback

## Architecture
The application follows React best practices with:
- **Component-based architecture**
- **Context API for theme management**
- **Custom hooks for state management**
- **CSS modules for styling**
- **JSDoc documentation**

---

# Constants

<dl>
<dt><a href="#algorithmDetails">algorithmDetails</a> : <code>Object</code></dt>
<dd><p>Contains detailed information for each cipher including icons, descriptions, complexity ratings, security levels, historical data, and key space analysis</p>
</dd>
<dt><a href="#sourceCode">sourceCode</a> : <code>Object</code></dt>
<dd><p>Contains complete Java implementation source code for each cipher algorithm</p>
</dd>
<dt><a href="#ThemeContext">ThemeContext</a> : <code>React.Context</code></dt>
<dd><p>React context for theme management</p>
</dd>
<dt><a href="#ThemeProvider">ThemeProvider</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Provides theme context to all child components and manages theme persistence</p>
</dd>
</dl>

# Functions

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
<dt><a href="#AlgorithmInfo">AlgorithmInfo(props)</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Shows algorithm details including complexity, security level, historical information, and key space analysis</p>
</dd>
<dt><a href="#SourceCodeViewer">SourceCodeViewer(props)</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Displays Java source code for cipher algorithms with syntax highlighting, copy functionality, and expandable interface</p>
</dd>
<dt><a href="#handleCopyCode">handleCopyCode()</a> ⇒ <code>void</code></dt>
<dd><p>Uses the Clipboard API to copy Java source code to user&#39;s clipboard</p>
</dd>
<dt><a href="#ThemeToggle">ThemeToggle()</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Provides a toggle switch for switching between light (purple) and dark (black) themes with smooth animations</p>
</dd>
<dt><a href="#useTheme">useTheme()</a> ⇒ <code>Object</code></dt>
<dd><p>Provides access to theme state and toggle functionality</p>
</dd>
<dt><a href="#useEffect">useEffect()</a></dt>
<dd><p>Retrieves and applies previously saved theme preference</p>
</dd>
<dt><a href="#useEffect">useEffect(isDark)</a></dt>
<dd><p>Updates document.body.className to apply global theme styles</p>
</dd>
<dt><a href="#toggleTheme">toggleTheme()</a> ⇒ <code>void</code></dt>
<dd><p>Switches theme state and persists choice to localStorage</p>
</dd>
</dl>

<a name="algorithmDetails"></a>

# algorithmDetails : <code>Object</code>
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

<a name="sourceCode"></a>

# sourceCode : <code>Object</code>
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

<a name="ThemeContext"></a>

# ThemeContext : <code>React.Context</code>
React context for theme management

**Kind**: global constant  
<a name="ThemeProvider"></a>

# ThemeProvider ⇒ <code>JSX.Element</code>
Provides theme context to all child components and manages theme persistence

**Kind**: global constant  
**Returns**: <code>JSX.Element</code> - ThemeContext.Provider wrapping children with theme functionality  
**Component**:   

| Param | Type | Description |
| --- | --- | --- |
| props | <code>Object</code> | Component properties |
| props.children | <code>React.ReactNode</code> | Child components to wrap with theme context |

**Example**  
```js
<ThemeProvider>
  <App />
</ThemeProvider>
```
<a name="CipherApp"></a>

# CipherApp() ⇒ <code>JSX.Element</code>
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

# handleEncrypt() ⇒ <code>Promise.&lt;void&gt;</code>
Processes text encryption with visual feedback, animations, and parameter validation

**Kind**: global function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Promise that resolves when encryption is complete  
**Throws**:

- <code>Error</code> When invalid parameters are provided for specific ciphers

<a name="handleDecrypt"></a>

# handleDecrypt() ⇒ <code>Promise.&lt;void&gt;</code>
Processes text decryption with visual feedback, animations, and parameter validation

**Kind**: global function  
**Returns**: <code>Promise.&lt;void&gt;</code> - Promise that resolves when decryption is complete  
**Throws**:

- <code>Error</code> When invalid parameters are provided for specific ciphers

<a name="useEffect"></a>

# useEffect(callback, dependencies)
Automatically removes animation class after 1 second to reset animation state

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Cleanup function for animation timer |
| dependencies | <code>Array</code> | Dependencies array containing animateResult state |

<a name="AlgorithmInfo"></a>

# AlgorithmInfo(props) ⇒ <code>JSX.Element</code>
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
<a name="SourceCodeViewer"></a>

# SourceCodeViewer(props) ⇒ <code>JSX.Element</code>
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

# handleCopyCode() ⇒ <code>void</code>
Uses the Clipboard API to copy Java source code to user's clipboard

**Kind**: global function  
<a name="ThemeToggle"></a>

# ThemeToggle() ⇒ <code>JSX.Element</code>
Provides a toggle switch for switching between light (purple) and dark (black) themes with smooth animations

**Kind**: global function  
**Returns**: <code>JSX.Element</code> - Animated toggle button with theme icons  
**Component**:   
**Example**  
```js
<ThemeToggle />
```
<a name="useTheme"></a>

# useTheme() ⇒ <code>Object</code>
Provides access to theme state and toggle functionality

**Kind**: global function  
**Returns**: <code>Object</code> - Theme context object containing isDark state and toggleTheme function  
**Throws**:

- <code>Error</code> When used outside of ThemeProvider

**Example**  
```js
const { isDark, toggleTheme } = useTheme();
```
<a name="useEffect"></a>

# useEffect()
Retrieves and applies previously saved theme preference

**Kind**: global function  
<a name="useEffect"></a>

# useEffect(isDark)
Updates document.body.className to apply global theme styles

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| isDark | <code>boolean</code> | Current theme state dependency |

<a name="toggleTheme"></a>

# toggleTheme() ⇒ <code>void</code>
Switches theme state and persists choice to localStorage

**Kind**: global function  


---

## Installation & Usage

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Setup
```bash
cd cipher-ui
npm install
npm start
```

### Building Documentation
```bash
npm run docs:all
```

## Contributing
1. Add JSDoc comments to new components
2. Run documentation generation
3. Update this README if needed

## License
This project is part of an academic assignment for ICT3243 - Network, Computer and Application Security.
