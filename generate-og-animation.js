// generate-og-animation.js - Creates an animated GIF for social media sharing
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Create directory if it doesn't exist
    const outputDir = path.join(__dirname, 'public', 'og');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Generating animated OG image for JMEFit...');

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport to OG image dimensions (1200x630 is standard for OG images)
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1
    });

    // Create HTML for the OG image
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JMEFit OG Image</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 630px;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          overflow: hidden;
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
        }
        .container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
        }
        .content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 2;
          padding: 40px;
          text-align: center;
        }
        .logo {
          width: 180px;
          margin-bottom: 40px;
        }
        h1 {
          font-size: 72px;
          font-weight: 800;
          margin: 0 0 20px 0;
          line-height: 1.1;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .subtitle {
          font-size: 36px;
          font-weight: 400;
          margin: 0 0 40px 0;
          color: #f0f0f0;
          line-height: 1.4;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
          z-index: 1;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%);
          z-index: 1;
        }
        .domain {
          position: absolute;
          bottom: 40px;
          width: 100%;
          text-align: center;
          font-size: 24px;
          font-weight: 500;
          color: #8B5CF6;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }
        .animated-text {
          animation: colorChange 3s infinite alternate;
        }
        @keyframes colorChange {
          0% { color: #8B5CF6; }
          50% { color: #EC4899; }
          100% { color: #8B5CF6; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="/JMEFIT_photo.png" alt="JMEFit" class="background">
        <div class="overlay"></div>
        <div class="content">
          <img src="/JME_fit_purple.png" alt="JMEFit Logo" class="logo">
          <h1>JMEFit Training</h1>
          <p class="subtitle animated-text">Transform Mind & Body, Elevate Life</p>
          <div class="domain">jmefit.com</div>
        </div>
      </div>
      <script>
        // Add animation to make screenshot capture the animated state
        document.addEventListener('DOMContentLoaded', () => {
          const subtitle = document.querySelector('.subtitle');
          let colorIndex = 0;
          const colors = ['#8B5CF6', '#EC4899', '#8B5CF6'];
          
          setInterval(() => {
            colorIndex = (colorIndex + 1) % colors.length;
            subtitle.style.color = colors[colorIndex];
          }, 1000);
        });
      </script>
    </body>
    </html>
    `;
    
    // Write the HTML to a temporary file
    const tempHtmlPath = path.join(outputDir, 'animated-og.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    // Navigate to the HTML file
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await page.screenshot({
      path: path.join(outputDir, 'jmefit-animated-og.png'),
      type: 'png'
    });
    
    console.log('✅ Generated animated OG image successfully!');
    
    await browser.close();
    
    // Clean up temporary files
    fs.unlinkSync(tempHtmlPath);
    
  } catch (error) {
    console.error('❌ Error generating animated OG image:', error);
    process.exit(1);
  }
})();
