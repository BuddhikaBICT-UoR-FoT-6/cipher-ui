# Cipher Project Documentation

This directory contains comprehensive documentation for the Cipher Project React application.

## 📚 Documentation Structure

### Generated Files
- **`API-Documentation.md`** - Complete API documentation for all components
- **`components/`** - Individual component documentation
  - `CipherApp.md` - Main application component
  - `AlgorithmInfo.md` - Algorithm information display
  - `SourceCodeViewer.md` - Source code viewer component
  - `ThemeToggle.md` - Theme toggle button
  - `ThemeContext.md` - Theme context provider

Note: The app has grown beyond this list (e.g., Admin dashboard, OTP flows, toasts, user menu, history).
If a component isn't listed here, refer to the source in `src/` or extend the generator script to include it.

### HTML Versions
Each markdown file has a corresponding HTML version with professional styling:
- **`API-Documentation.html`** - Styled complete documentation
- **`components/*.html`** - Individual component HTML docs

## 🚀 Generating Documentation

### Prerequisites
```bash
npm install --save-dev jsdoc jsdoc-to-markdown
```

### Commands
```bash
# Generate all documentation
npm run docs:all

# Generate only markdown files
npm run docs:generate

# Convert markdown to HTML
npm run docs:html

# Generate JSDoc HTML (alternative)
npm run docs:jsdoc
```

## 📄 Converting to PDF

### Method 1: Browser Print
1. Open any `.html` file in your browser
2. Press `Ctrl+P` (Print)
3. Select "Save as PDF"
4. Choose destination and save

### Method 2: VS Code Extension
1. Install "Markdown PDF" extension in VS Code
2. Right-click on any `.md` file
3. Select "Markdown PDF: Export (pdf)"

### Method 3: Command Line (if markdown-pdf is installed)
```bash
# Install globally
npm install -g markdown-pdf

# Convert specific file
markdown-pdf docs/API-Documentation.md -o docs/API-Documentation.pdf

# Convert all files
for file in docs/**/*.md; do markdown-pdf "$file" -o "${file%.md}.pdf"; done
```

## 📝 Adding Documentation to New Components

### 1. Add JSDoc Comments
```javascript
/**
 * @fileoverview Brief description of the file
 * @author Your Name
 * @version 1.0.0
 */

/**
 * Component description
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.example - Example prop description
 * @description Detailed component description
 * @returns {JSX.Element} What the component returns
 * 
 * @example
 * <YourComponent example="value" />
 */
const YourComponent = ({ example }) => {
  /**
   * Function description
   * @function functionName
   * @param {string} param - Parameter description
   * @returns {void} Return value description
   */
  const functionName = (param) => {
    // implementation
  };
```

### 2. Update Documentation Generator
Add your new component to `docs/generate-docs.js`:
```javascript
const components = [
  // existing components...
  { 
    file: 'src/YourComponent.js', 
    name: 'YourComponent',
    description: 'Brief description of your component'
  }
];
```

### 3. Regenerate Documentation
```bash
npm run docs:all
```

## 🎨 Documentation Features

### JSDoc Tags Used
- `@fileoverview` - File description
- `@component` - React component marker
- `@param` - Parameter documentation
- `@returns` - Return value documentation
- `@function` - Function documentation
- `@description` - Detailed description
- `@example` - Usage examples
- `@throws` - Error conditions
- `@constant` - Constants documentation
- `@type` - Type information
- `@default` - Default values

### HTML Styling Features
- Professional header with project branding
- Syntax highlighting for code blocks
- Responsive design
- Print-friendly formatting
- Consistent typography
- Color-coded sections

## 📋 File Organization

```
docs/
├── README.md                    # This file
├── generate-docs.js            # Documentation generator
├── convert-to-pdf.js           # HTML converter
├── API-Documentation.md        # Complete API docs
├── API-Documentation.html      # Styled complete docs
└── components/                 # Individual component docs
    ├── CipherApp.md
    ├── CipherApp.html
    ├── AlgorithmInfo.md
    ├── AlgorithmInfo.html
    ├── SourceCodeViewer.md
    ├── SourceCodeViewer.html
    ├── ThemeToggle.md
    ├── ThemeToggle.html
    ├── ThemeContext.md
    └── ThemeContext.html
```

## 🔧 Troubleshooting

### Common Issues

**JSDoc not generating content:**
- Ensure JSDoc comments use `/**` (not `//` or `/*`)
- Check file paths in `generate-docs.js`
- Verify JSDoc syntax is correct

**HTML conversion issues:**
- Check markdown syntax in generated files
- Ensure all files exist before conversion
- Verify file permissions

**PDF generation problems:**
- Try different browsers for printing
- Check print settings (margins, scale)
- Use VS Code Markdown PDF extension as alternative

### Getting Help
1. Check JSDoc documentation: https://jsdoc.app/
2. Verify React component documentation best practices
3. Test with simple examples first

## 📈 Maintenance

### Regular Tasks
1. **Update documentation** when adding new features
2. **Regenerate docs** before releases
3. **Review generated content** for accuracy
4. **Update examples** to match current API

### Version Control
- Commit generated documentation files
- Include both `.md` and `.html` versions
- Update version numbers in file headers

---

If you change public APIs or add major UI components, re-run `npm run docs:all` and review the generated output before committing.