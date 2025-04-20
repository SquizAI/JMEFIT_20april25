import { Link } from 'react-router-dom';
import { Calendar, User, Clock, Search } from 'lucide-react';
import { blogPosts } from './blogData';
import { useState, useEffect } from 'react';

function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  const [activeCategory, setActiveCategory] = useState('All');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(blogPosts.map(post => post.category)))];

  useEffect(() => {
    // Filter posts based on search term and active category
    const filtered = blogPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
    
    setFilteredPosts(filtered);
  }, [searchTerm, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{ textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px' }}>
        Latest Articles
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12">
        Expert advice on training, nutrition, and living a healthy lifestyle
      </p>
      
      {/* Search and filter section */}
      <div className="mb-10 space-y-6">
        <div className="relative">  
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search articles..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-jme-purple focus:border-jme-purple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category 
                  ? 'bg-jme-purple text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-600">No articles found matching your criteria.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setActiveCategory('All');
            }}
            className="mt-4 px-6 py-2 bg-jme-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredPosts.map((post, index) => (
          <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] flex flex-col h-full">
            <div className="relative overflow-hidden group">
              <img
                src={post.image}
                alt={post.title}
                className="object-cover w-full h-48 sm:h-56 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-jme-purple text-white text-sm px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
            </div>
            <div className="p-5 sm:p-6 flex-grow">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {post.author}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {post.date}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {post.readTime}
                </div>
              </div>
            </div>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 mt-auto">
              <Link
                to={`/blog/${post.slug || post.title.toLowerCase().replace(/\s+/g, '-').replace(/:/g, '')}`}
                className="inline-flex items-center text-jme-purple font-semibold hover:text-purple-700 transition-colors"
              >
                Read More <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </article>
        ))}
        </div>
      )}

      {/* Newsletter Section */}
      <div className="mt-16 sm:mt-24 bg-gradient-to-r from-jme-purple to-purple-800 rounded-2xl p-6 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Subscribe to Our Newsletter
        </h2>
        <p className="text-gray-200 mb-8 max-w-2xl mx-auto">
          Get the latest articles, workout tips, and exclusive content delivered straight to your inbox.
        </p>
        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 sm:px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 w-full"
            aria-label="Email address"
          />
          <button
            type="submit"
            className="bg-white text-jme-purple px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors w-full sm:w-auto"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}

export default Blog;