# ThemeContext Documentation

## Overview
Theme context provider for managing application-wide theme state

## Project Information
- **Project:** Cipher Algorithms Implementation
- **Version:** 1.0.0
- **Author:** Cipher Project Team
- **File:** `src/ThemeContext.js`

---

## Constants

<dl>
<dt><a href="#ThemeContext">ThemeContext</a> : <code>React.Context</code></dt>
<dd><p>React context for theme management</p>
</dd>
<dt><a href="#ThemeProvider">ThemeProvider</a> ⇒ <code>JSX.Element</code></dt>
<dd><p>Provides theme context to all child components and manages theme persistence</p>
</dd>
</dl>

## Functions

<dl>
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

<a name="ThemeContext"></a>

## ThemeContext : <code>React.Context</code>
React context for theme management

**Kind**: global constant  
<a name="ThemeProvider"></a>

## ThemeProvider ⇒ <code>JSX.Element</code>
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
<a name="useTheme"></a>

## useTheme() ⇒ <code>Object</code>
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

## useEffect()
Retrieves and applies previously saved theme preference

**Kind**: global function  
<a name="useEffect"></a>

## useEffect(isDark)
Updates document.body.className to apply global theme styles

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| isDark | <code>boolean</code> | Current theme state dependency |

<a name="toggleTheme"></a>

## toggleTheme() ⇒ <code>void</code>
Switches theme state and persists choice to localStorage

**Kind**: global function  


---

## Usage in Project
This component is part of the Cipher Project React application that provides a user interface for various encryption and decryption algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers.

## Related Components
- CipherApp
- AlgorithmInfo
- SourceCodeViewer
- ThemeToggle
