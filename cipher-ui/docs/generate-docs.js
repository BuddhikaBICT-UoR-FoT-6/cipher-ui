/**
 * Documentation generation script for Cipher Project
 * Generates separate PDF documentation for each component
 */

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Component configuration
const components = [
  { 
    file: 'src/CipherApp.js', 
    name: 'CipherApp',
    description: 'Main cipher application component with encryption/decryption functionality'
  },
  { 
    file: 'src/AlgorithmInfo.js', 
    name: 'AlgorithmInfo',
    description: 'Component displaying detailed information about cipher algorithms'
  },
  { 
    file: 'src/SourceCodeViewer.js', 
    name: 'SourceCodeViewer',
    description: 'Component for displaying Java source code with syntax highlighting'
  },
  { 
    file: 'src/ThemeToggle.js', 
    name: 'ThemeToggle',
    description: 'Theme toggle component for switching between light and dark modes'
  },
  { 
    file: 'src/ThemeContext.js', 
    name: 'ThemeContext',
    description: 'Theme context provider for managing application-wide theme state'
  }
];

// Ensure directories exist
if (!fsSync.existsSync('docs')) {
  fsSync.mkdirSync('docs');
}
if (!fsSync.existsSync('docs/components')) {
  fsSync.mkdirSync('docs/components');
}

async function generateDocs() {
  console.log('🚀 Starting documentation generation...\n');

  // Generate documentation for each component
  for (const component of components) {
    try {
      console.log(`📝 Generating documentation for ${component.name}...`);
      
      // Generate markdown for each component
      const markdown = await jsdoc2md.render({ 
        files: component.file,
        'heading-depth': 2
      });
    
    // Create enhanced markdown with project info
    const enhancedMarkdown = `# ${component.name} Documentation

## Overview
${component.description}

## Project Information
- **Project:** Cipher Algorithms Implementation
- **Version:** 1.0.0
- **Author:** Cipher Project Team
- **File:** \`${component.file}\`

---

${markdown}

---

## Usage in Project
This component is part of the Cipher Project React application that provides a user interface for various encryption and decryption algorithms including Caesar, ROT13, Atbash, Vigenère, and Rail Fence ciphers.

## Related Components
${components.filter(c => c.name !== component.name).map(c => `- ${c.name}`).join('\n')}
`;
    
    const mdPath = `docs/components/${component.name}.md`;
    
      // Write markdown file
      await fs.writeFile(mdPath, enhancedMarkdown);
      console.log(`✅ Generated ${mdPath}`);
      
    } catch (error) {
      console.error(`❌ Error generating documentation for ${component.name}:`, error.message);
    }
  }

  // Generate complete API documentation
  try {
    console.log('\n📚 Generating complete API documentation...');
    
    const allFiles = components.map(c => c.file);
    const completeMarkdown = await jsdoc2md.render({ 
      files: allFiles,
      'heading-depth': 1
    });
  
  const completeDoc = `# Cipher Project - Complete API Documentation

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

${completeMarkdown}

---

## Installation & Usage

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Setup
\`\`\`bash
cd cipher-ui
npm install
npm start
\`\`\`

### Building Documentation
\`\`\`bash
npm run docs:all
\`\`\`

## Contributing
1. Add JSDoc comments to new components
2. Run documentation generation
3. Update this README if needed

## License
This project is part of an academic assignment for ICT3243 - Network, Computer and Application Security.
`;
  
    await fs.writeFile('docs/API-Documentation.md', completeDoc);
    console.log('✅ Generated docs/API-Documentation.md');
    
  } catch (error) {
    console.error('❌ Error generating complete documentation:', error.message);
  }

  console.log('\n🎉 Documentation generation completed!');
  console.log('\n📋 Generated files:');
  console.log('- docs/API-Documentation.md (Complete API documentation)');
  components.forEach(component => {
    console.log(`- docs/components/${component.name}.md`);
  });

  console.log('\n💡 Next steps:');
  console.log('1. Install markdown-pdf: npm install -g markdown-pdf');
  console.log('2. Convert to PDF: npm run docs:pdf');
  console.log('3. Or use VS Code Markdown PDF extension');
}

generateDocs().catch(console.error);