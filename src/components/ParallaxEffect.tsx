import { useEffect, useState } from 'react';

/**
 * ParallaxEffect component that adds smooth parallax scrolling to background images
 * This uses the window scroll position to create a subtle parallax effect
 */
const ParallaxEffect = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile or tablet
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    // Initial check
    checkDevice();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Handle scroll events
  useEffect(() => {
    // Skip parallax effect on mobile devices
    if (isMobile) return;
    
    const handleScroll = () => {
      const position = window.scrollY;
      
      // Apply parallax effect to hero background
      const heroBackground = document.querySelector('.hero-background') as HTMLElement;
      if (heroBackground) {
        // Move the background slightly as user scrolls
        const yPos = position * 0.2;
        heroBackground.style.backgroundPositionY = `calc(10% + ${yPos}px)`;
        
        // Add fade-out effect to hero content when scrolling down
        const heroContent = document.querySelector('.hero-content') as HTMLElement;
        if (heroContent) {
          if (position > 100) {
            heroContent.classList.add('active');
          } else {
            heroContent.classList.remove('active');
          }
        }
      }
      
      // Apply parallax effect to journey banner
      const journeyBanner = document.querySelector('.parallax-banner') as HTMLElement;
      if (journeyBanner && journeyBanner.getBoundingClientRect().top < window.innerHeight) {
        const bannerPosition = journeyBanner.getBoundingClientRect().top;
        const offset = (window.innerHeight - bannerPosition) * 0.1;
        journeyBanner.style.backgroundPositionY = `calc(50% - ${offset}px)`;
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Call once to initialize
    handleScroll();
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return null; // This component doesn't render anything
};

export default ParallaxEffect;
