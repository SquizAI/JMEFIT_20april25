// generate-promo-video.js - Creates a promotional video for JMEFit
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Create directory if it doesn't exist
    const outputDir = path.join(__dirname, 'public', 'videos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create a temporary HTML file for the video frames
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    console.log('🎬 Generating promotional video for JMEFit...');

    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport to video dimensions (16:9 aspect ratio)
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    });

    // Define frames for the video
    const frames = [
      {
        title: 'JMEFit Training',
        subtitle: 'Transform Mind & Body, Elevate Life',
        image: '/JMEFIT_photo.png',
        color: '#8B5CF6'
      },
      {
        title: 'Expert Guidance',
        subtitle: 'Custom Training Programs Designed for You',
        image: '/JMEFIT_hero_mirrored.png',
        color: '#EC4899'
      },
      {
        title: 'Join Our Community',
        subtitle: 'Get Support, Stay Motivated, Achieve Results',
        image: '/images/IMG_3190.PNG',
        color: '#8B5CF6'
      }
    ];

    // Generate frames
    console.log('Generating frames...');
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JMEFit Promo - Frame ${i+1}</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 1280px;
            height: 720px;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            overflow: hidden;
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          }
          .frame-container {
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
          .cta {
            display: inline-block;
            background: ${frame.color};
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 24px;
            text-decoration: none;
            margin-top: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .domain {
            position: absolute;
            bottom: 40px;
            width: 100%;
            text-align: center;
            font-size: 24px;
            font-weight: 500;
            color: ${frame.color};
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          }
        </style>
      </head>
      <body>
        <div class="frame-container">
          <img src="${frame.image}" alt="JMEFit" class="background">
          <div class="overlay"></div>
          <div class="content">
            <img src="/JME_fit_purple.png" alt="JMEFit Logo" class="logo">
            <h1>${frame.title}</h1>
            <p class="subtitle">${frame.subtitle}</p>
            ${i === frames.length - 1 ? '<div class="cta">Start Today</div>' : ''}
            <div class="domain">jmefit.com</div>
          </div>
        </div>
      </body>
      </html>
      `;
      
      const framePath = path.join(tempDir, `frame-${i+1}.html`);
      fs.writeFileSync(framePath, htmlContent);
      
      await page.goto(`file://${framePath}`, { waitUntil: 'networkidle0' });
      
      await page.screenshot({
        path: path.join(tempDir, `frame-${i+1}.png`),
        type: 'png'
      });
      
      console.log(`✅ Generated frame ${i+1} of ${frames.length}`);
    }
    
    await browser.close();
    
    // Use ffmpeg to create a video from the frames
    console.log('Creating video from frames...');
    
    try {
      // Check if ffmpeg is installed
      await execAsync('which ffmpeg');
      
      // Create video using ffmpeg
      await execAsync(`ffmpeg -y -framerate 1 -i ${tempDir}/frame-%d.png -c:v libx264 -pix_fmt yuv420p -r 30 -vf "fps=30,format=yuv420p" -t 9 ${outputDir}/jmefit-promo.mp4`);
      
      console.log(`✅ Video created successfully at ${outputDir}/jmefit-promo.mp4`);
      
      // Clean up temporary files
      for (let i = 1; i <= frames.length; i++) {
        fs.unlinkSync(path.join(tempDir, `frame-${i}.html`));
        fs.unlinkSync(path.join(tempDir, `frame-${i}.png`));
      }
      fs.rmdirSync(tempDir);
      
      console.log('✅ Temporary files cleaned up');
    } catch (error) {
      console.error('❌ Error creating video:', error.message);
      console.error('Note: This script requires ffmpeg to be installed on your system.');
      console.error('Please install ffmpeg and try again.');
    }
  } catch (error) {
    console.error('❌ Error generating promotional video:', error);
    process.exit(1);
  }
})();
