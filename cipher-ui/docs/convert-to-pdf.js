/**
 * Convert markdown documentation to PDF files
 * Alternative approach using puppeteer for PDF generation
 */

const fs = require('fs');
const path = require('path');

// List of markdown files to convert
const markdownFiles = [
  'docs/API-Documentation.md',
  'docs/components/CipherApp.md',
  'docs/components/AlgorithmInfo.md',
  'docs/components/SourceCodeViewer.md',
  'docs/components/ThemeToggle.md',
  'docs/components/ThemeContext.md'
];

console.log('📄 Converting markdown files to PDF...\n');

// Simple HTML template for better PDF formatting
const htmlTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h1 {
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        h2 {
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        blockquote {
            border-left: 4px solid #667eea;
            margin: 0;
            padding-left: 20px;
            color: #666;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: white; border: none; margin: 0;">${title}</h1>
        <p style="margin: 10px 0 0 0;">Cipher Project Documentation</p>
    </div>
    ${content}
    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Cipher Project v1.0.0</p>
    </div>
</body>
</html>
`;

// Convert markdown to basic HTML (simple implementation)
function markdownToHtml(markdown) {
    return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]*)`/gim, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
        // Line breaks
        .replace(/\n/gim, '<br>');
}

// Process each markdown file
markdownFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath, '.md');
        const htmlPath = filePath.replace('.md', '.html');
        
        console.log(`📝 Processing ${fileName}...`);
        
        try {
            // Read markdown content
            const markdownContent = fs.readFileSync(filePath, 'utf8');
            
            // Convert to HTML
            const htmlContent = markdownToHtml(markdownContent);
            const fullHtml = htmlTemplate(htmlContent, fileName);
            
            // Write HTML file
            fs.writeFileSync(htmlPath, fullHtml);
            console.log(`✅ Generated ${htmlPath}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${fileName}:`, error.message);
        }
    } else {
        console.log(`⚠️  File not found: ${filePath}`);
    }
});

console.log('\n🎉 HTML conversion completed!');
console.log('\n💡 To convert HTML to PDF:');
console.log('1. Open each HTML file in your browser');
console.log('2. Press Ctrl+P (Print)');
console.log('3. Select "Save as PDF"');
console.log('4. Or use VS Code extension "Markdown PDF"');
console.log('\n📋 Generated HTML files:');
markdownFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        console.log(`- ${filePath.replace('.md', '.html')}`);
    }
});