// Component uses JSX, so React is needed for compilation
import { useRef, useEffect } from 'react';

// Define a type for the window with our custom property
declare global {
  interface Window {
    carouselTimeout?: number;
  }
}

const transformations = [
  { id: 1, image: "/shred_photos/03FC67A2-2E09-473F-B733-321BB946B33D.JPG" },
  { id: 2, image: "/shred_photos/1A5965FCD5EF4538BBB737EA1149131F.JPG" },
  { id: 3, image: "/shred_photos/22DF37CB-5F90-4C13-9823-1A45CD68D845.JPG" },
  { id: 4, image: "/shred_photos/263E9A9D-C3AE-4A09-AB19-D864B296F2C6.JPG" },
  { id: 5, image: "/shred_photos/2D816154-C7A1-44C5-8070-76077B47E50D.JPG" },
  { id: 6, image: "/shred_photos/549EF83D-8FFC-42F1-8B2D-FFF967D574CD.JPG" },
  { id: 7, image: "/shred_photos/7DB5CAAC-ADE9-48EB-ADDF-3C88D2959E55.JPG" },
  { id: 8, image: "/shred_photos/E1F8794E-3BBC-4040-B0BD-C64BAA845728.JPG" },
  { id: 9, image: "/shred_photos/FAC9246C-4BDF-4FE6-8877-81580F812D1A.JPG" },
  { id: 10, image: "/shred_photos/IMG_1323.JPG" },
  { id: 11, image: "/shred_photos/IMG_2020.JPG" },
  { id: 12, image: "/shred_photos/IMG_2024.JPG" },
  { id: 13, image: "/shred_photos/IMG_2028.JPG" },
  { id: 14, image: "/shred_photos/IMG_2034.JPG" },
  { id: 15, image: "/shred_photos/IMG_2037.JPG" },
  { id: 16, image: "/shred_photos/IMG_2038.JPG" },
  { id: 17, image: "/shred_photos/IMG_2039.JPG" },
  { id: 18, image: "/shred_photos/IMG_4241.JPG" },
  { id: 19, image: "/shred_photos/IMG_4245.JPG" },
  { id: 20, image: "/shred_photos/IMG_4864.JPG" },
  { id: 21, image: "/shred_photos/IMG_7425.JPG" },
  { id: 22, image: "/shred_photos/IMG_7426.JPG" },
  { id: 23, image: "/shred_photos/IMG_8740.JPG" },
  { id: 24, image: "/shred_photos/image3.JPG" }
];

function TransformationsBanner() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  
  // Instead of duplicating the array, we'll handle the looping in the animation
  
  // Add CSS to head to hide scrollbar
  useEffect(() => {
    // Create a style element for the scrollbar hiding
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up by removing the style element
      document.head.removeChild(style);
    };
  }, []);
  
  // Enhanced smooth continuous rotation effect with true infinite loop
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    let animationFrameId: number;
    const scrollSpeed = 1; // Pixels per frame - lower is smoother
    const container = scrollContainerRef.current;
    
    // Calculate the width of a single item including gap
    const itemWidth = 344; // 320px width + 24px gap
    const totalContentWidth = transformations.length * itemWidth;
    
    // Set initial scroll position
    container.scrollLeft = 0;
    
    // Smooth auto-scroll animation
    const scrollCarousel = () => {
      if (!container) return;
      
      // Increment scroll position
      container.scrollLeft += scrollSpeed;
      
      // Check if we need to loop back
      if (container.scrollLeft >= totalContentWidth) {
        // Reset to beginning without animation for seamless loop
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = 0;
        // Small delay before re-enabling smooth scrolling
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 50);
      }
      
      animationFrameId = requestAnimationFrame(scrollCarousel);
    };
    
    // Start the animation
    animationFrameId = requestAnimationFrame(scrollCarousel);
    
    // Handle manual interaction
    const handleUserInteraction = () => {
      cancelAnimationFrame(animationFrameId);
      
      // Resume auto-scroll after user stops interacting
      if (window.carouselTimeout) {
        clearTimeout(window.carouselTimeout);
      }
      
      window.carouselTimeout = window.setTimeout(() => {
        animationFrameId = requestAnimationFrame(scrollCarousel);
      }, 2000);
    };
    
    // Event listeners for user interaction
    container.addEventListener('mousedown', handleUserInteraction);
    container.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (window.carouselTimeout) {
        clearTimeout(window.carouselTimeout);
      }
      container.removeEventListener('mousedown', handleUserInteraction);
      container.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [transformations.length]);
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg text-center w-full" style={{ textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px' }}>
          SHRED 6-WEEK CHALLENGE
        </h2>
        <div className="max-w-3xl mx-auto text-center mb-10">
          <p className="text-xl text-pink-500 font-semibold mb-4">
            Transform Your Body in Just 6 Weeks
          </p>
          <p className="text-gray-300 mb-6">
            These incredible transformations are all from real clients who completed our signature SHRED 6-Week Challenge. 
            Join hundreds of successful participants who have changed their bodies and lives through our proven system.
          </p>
        </div>
        <div className="relative">
          {/* Scroll indicators */}

          
          {/* Scrollable container */}
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar" 
            style={{willChange: 'scroll-position', overscrollBehavior: 'none', scrollBehavior: 'smooth'}}>
            {transformations.map((item) => (
              <div 
                key={item.id} 
                className="flex-none w-80 snap-center relative group transition-all duration-300 hover:-translate-y-2"
              >
                <div className="rounded-xl overflow-hidden shadow-lg shadow-black/30 border-2 border-gray-700 h-full">
                  <div className="w-full h-80">
                    <img 
                      src={item.image} 
                      alt="Client transformation"
                      className="object-cover w-full h-full rounded-xl transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransformationsBanner;