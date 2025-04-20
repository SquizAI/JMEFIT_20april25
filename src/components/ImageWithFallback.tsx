import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const ImageWithFallback = ({ src, alt, className, fallbackSrc }: ImageWithFallbackProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);

  const handleError = () => {
    // If the image is an Unsplash URL, make sure it's properly formatted
    if (imgSrc.includes('unsplash.com') && errorCount === 0) {
      // Try to fix the Unsplash URL by ensuring it has the correct parameters
      const fixedUrl = ensureUnsplashParams(imgSrc);
      setImgSrc(fixedUrl);
      setErrorCount(1);
    } 
    // If it's already tried to fix an Unsplash URL or it's not an Unsplash URL
    else if (fallbackSrc && errorCount < 2) {
      setImgSrc(fallbackSrc);
      setErrorCount(2);
    } 
    // If all else fails, use a default placeholder
    else if (errorCount >= 2) {
      setImgSrc('https://via.placeholder.com/800x600?text=Image+Not+Available');
    }
  };

  // Function to ensure Unsplash URLs have the correct parameters
  const ensureUnsplashParams = (url: string): string => {
    // If it's not an Unsplash URL, return as is
    if (!url.includes('unsplash.com')) return url;

    // Parse the URL
    try {
      const urlObj = new URL(url);
      
      // Ensure required parameters are present
      if (!urlObj.searchParams.has('auto')) {
        urlObj.searchParams.append('auto', 'format');
      }
      
      if (!urlObj.searchParams.has('fit')) {
        urlObj.searchParams.append('fit', 'crop');
      }
      
      if (!urlObj.searchParams.has('w')) {
        urlObj.searchParams.append('w', '1200');
      }
      
      if (!urlObj.searchParams.has('q')) {
        urlObj.searchParams.append('q', '80');
      }
      
      return urlObj.toString();
    } catch (e) {
      // If URL parsing fails, return the original URL
      console.error('Error parsing Unsplash URL:', e);
      return url;
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className || ''}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
