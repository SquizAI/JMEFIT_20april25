// This script fixes the pricing toggle functionality
// To use it:
// 1. Open https://jmefit.com/monthly-app in your browser
// 2. Open the developer console (F12 or right-click > Inspect > Console)
// 3. Copy and paste this entire script into the console
// 4. Press Enter to run it

(function() {
  console.log('Applying pricing toggle fix...');
  
  // Function to fix the pricing toggle functionality
  function fixPricingToggle() {
    // Find all pricing toggle containers
    const toggleContainers = document.querySelectorAll('.program-card-header');
    
    if (toggleContainers.length === 0) {
      console.log('No pricing toggle containers found. Try running this on the Monthly App page.');
      return;
    }
    
    console.log(`Found ${toggleContainers.length} pricing toggle containers`);
    
    toggleContainers.forEach((container, index) => {
      // Find the toggle options (monthly and yearly)
      const toggleOptions = container.querySelectorAll('.flex-1');
      
      if (toggleOptions.length !== 2) {
        console.log(`Container ${index}: Expected 2 toggle options, found ${toggleOptions.length}`);
        return;
      }
      
      // Get the monthly and yearly options
      const monthlyOption = toggleOptions[0];
      const yearlyOption = toggleOptions[1];
      
      // Remove any overlays that might be blocking clicks
      container.querySelectorAll('.absolute').forEach(el => {
        el.style.pointerEvents = 'none';
      });
      
      // Make sure the toggle options are clickable
      [monthlyOption, yearlyOption].forEach(option => {
        option.style.position = 'relative';
        option.style.zIndex = '10';
        option.style.cursor = 'pointer';
      });
      
      // Add click event listeners
      monthlyOption.addEventListener('click', function(e) {
        console.log('Monthly option clicked');
        // Simulate a click on the monthly option
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Dispatch the event on all potential elements
        monthlyOption.querySelectorAll('*').forEach(el => {
          el.dispatchEvent(event);
        });
        
        // Apply visual changes directly
        monthlyOption.classList.add('border-jme-purple', 'bg-purple-50');
        yearlyOption.classList.remove('border-jme-purple', 'bg-purple-50');
        yearlyOption.classList.add('border-gray-200');
        
        // Find and hide the "BEST VALUE" badge
        const bestValueBadge = yearlyOption.querySelector('.absolute');
        if (bestValueBadge) {
          bestValueBadge.style.display = 'none';
        }
        
        // Find and hide the savings message
        const savingsMessage = container.querySelector('.text-center .inline-flex');
        if (savingsMessage) {
          savingsMessage.closest('.text-center').style.display = 'none';
        }
      });
      
      yearlyOption.addEventListener('click', function(e) {
        console.log('Yearly option clicked');
        // Simulate a click on the yearly option
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        
        // Dispatch the event on all potential elements
        yearlyOption.querySelectorAll('*').forEach(el => {
          el.dispatchEvent(event);
        });
        
        // Apply visual changes directly
        yearlyOption.classList.add('border-jme-purple', 'bg-purple-50');
        monthlyOption.classList.remove('border-jme-purple', 'bg-purple-50');
        monthlyOption.classList.add('border-gray-200');
        
        // Find and show the "BEST VALUE" badge
        const bestValueBadge = yearlyOption.querySelector('.absolute');
        if (bestValueBadge) {
          bestValueBadge.style.display = 'block';
        }
        
        // Find and show the savings message
        const savingsMessage = container.querySelector('.text-center .inline-flex');
        if (savingsMessage) {
          savingsMessage.closest('.text-center').style.display = 'block';
        }
      });
      
      console.log(`Fixed pricing toggle for container ${index}`);
    });
    
    console.log('Pricing toggle fix applied successfully!');
  }
  
  // Wait for the page to fully load before applying the fix
  if (document.readyState === 'complete') {
    fixPricingToggle();
  } else {
    window.addEventListener('load', fixPricingToggle);
  }
  
  // Also run the fix after a short delay to ensure all elements are loaded
  setTimeout(fixPricingToggle, 1000);
})();
