import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Create directory if it doesn't exist
    const outputDir = path.join(__dirname, 'public', 'og');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read logo and hero image files
    const logoPath = path.join(__dirname, 'public', 'JME_fit_purple.png');
    const heroPath = path.join(__dirname, 'public', 'JMEFIT_hero_mirrored.png');
    
    // Convert images to base64
    const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
    const heroBase64 = fs.readFileSync(heroPath, { encoding: 'base64' });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Now generate the OG image with the selected image
    const page = await browser.newPage();
    
    // Set viewport to Open Graph image dimensions (1200x630)
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 2 // Retina quality
    });
    
    // Create HTML template with hero image background for better visual appeal
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
        }
        .og-container {
          position: relative;
          width: 100%;
          height: 100%;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
          box-sizing: border-box;
          background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('data:image/png;base64,${heroBase64}');
          background-size: cover;
          background-position: center;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1;
        }
        .content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .logo {
          width: 220px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: 80px;
          font-weight: 800;
          margin: 0 0 30px 0;
          line-height: 1.1;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .tagline {
          font-size: 48px;
          font-weight: 600;
          margin: 0 0 40px 0;
          color: #FF1493;
          line-height: 1.4;
          max-width: 80%;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .domain {
          position: absolute;
          bottom: 40px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 32px;
          font-weight: 500;
          color: #8B5CF6;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="og-container">
        <div class="content">
          <img src="data:image/png;base64,${logoBase64}" alt="JMEFit Logo" class="logo">
          <h1>JMEFit Training</h1>
          <p class="tagline">Transform Mind & Body, Elevate Life</p>
          <div class="domain">jmefit.com</div>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Write the HTML content to a temporary file
    const tempHtmlPath = path.join(outputDir, 'temp-og-image.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    // Load the HTML file
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Take a screenshot
    await page.screenshot({
      path: path.join(outputDir, 'jmefit-og-image.png'),
      type: 'png'
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempHtmlPath);
    
    console.log('✅ Open Graph image generated successfully with dynamic image!');
    
    await browser.close();
  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    process.exit(1);
  }
})();
