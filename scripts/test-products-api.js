// Test script for products API
import { createProduct, getProducts } from '../src/lib/api/products.js';

// Test creating a product
async function testProductsAPI() {
  try {
    console.log('Testing products API...');
    
    // Create a test product
    const testProduct = {
      name: 'Test Product',
      description: 'This is a test product created via the API',
      imageUrl: 'https://example.com/test-product.jpg',
      active: true,
      metadata: {
        testKey: 'testValue',
        category: 'test'
      }
    };
    
    console.log('Creating test product...');
    const createdProduct = await createProduct(testProduct);
    
    console.log('Product created successfully:');
    console.log(JSON.stringify(createdProduct, null, 2));
    
    // Get all products
    console.log('\nFetching all products...');
    const products = await getProducts();
    
    console.log(`Found ${products.length} products:`);
    console.log(JSON.stringify(products, null, 2));
    
    console.log('\nProducts API test completed successfully!');
  } catch (error) {
    console.error('Error testing products API:', error);
  }
}

// Run the test
testProductsAPI();

// Export for ES modules
export {};
