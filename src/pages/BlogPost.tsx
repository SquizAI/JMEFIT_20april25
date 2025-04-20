import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Share2, Heart, Facebook, Twitter, Linkedin, Copy, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';

// Import blog data
import { blogPosts, BlogPost as BlogPostType, BlogContent } from './blogData.ts';

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Find the blog post with the matching slug
  const post = blogPosts.find((post: BlogPostType) => 
    post.slug === slug || post.title.toLowerCase().replace(/\s+/g, '-').replace(/:/g, '') === slug
  );
  
  // Handle copy URL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Handle outside click for share menu
  useEffect(() => {
    if (showShareMenu) {
      const handleOutsideClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.share-menu-container')) {
          setShowShareMenu(false);
        }
      };
      
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showShareMenu]);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center animate-fadeIn">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          The blog post you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center text-jme-purple font-semibold hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
      <SEO title={post.title} description={post.excerpt} />
      
      <Link
        to="/blog"
        className="inline-flex items-center text-jme-purple font-semibold hover:text-purple-700 transition-colors mb-6 sm:mb-8 block group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to Blog
      </Link>
      
      <article>
        <div className="mb-6 sm:mb-8">
          <span className="bg-jme-purple text-white text-sm px-3 py-1 rounded-full shadow-sm hover:shadow transition-shadow duration-300">
            {post.category}
          </span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight bg-gradient-to-r from-jme-purple to-jme-cyan bg-clip-text text-transparent">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mb-6 sm:mb-8">
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
        
        <div className="aspect-w-16 aspect-h-9 mb-8 rounded-xl overflow-hidden shadow-xl">
          <img
            src={post.image}
            alt={post.title}
            className="object-cover w-full h-64 sm:h-80 md:h-96"
            loading="lazy"
          />
        </div>
        
        <div className="prose prose-lg max-w-none prose-headings:text-jme-purple prose-a:text-jme-cyan prose-a:no-underline hover:prose-a:underline prose-blockquote:border-jme-purple prose-blockquote:bg-purple-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
          {post.content.map((section: BlogContent, index: number) => (
            <React.Fragment key={index}>
              {section.type === 'paragraph' && <p className="text-base sm:text-lg">{section.content}</p>}
              {section.type === 'heading' && <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-4 text-jme-purple">{section.content}</h2>}
              {section.type === 'list' && (
                <ul className="list-disc pl-6 space-y-2">
                  {section.items.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {section.type === 'image' && (
                <div className="my-8 overflow-hidden rounded-lg shadow-lg transition-transform duration-500 hover:shadow-xl">
                  <img 
                    src={section.src} 
                    alt={section.alt} 
                    className="rounded-lg w-full hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  {section.caption && (
                    <p className="text-sm text-gray-500 mt-2 text-center italic">{section.caption}</p>
                  )}
                </div>
              )}
              {section.type === 'quote' && (
                <blockquote className="border-l-4 border-jme-purple pl-4 italic my-6 py-3 bg-purple-50 rounded-r-lg text-gray-700">
                  {section.content}
                </blockquote>
              )}
              {section.type === 'recipe' && (
                <div className="bg-gray-50 p-5 sm:p-6 rounded-lg my-8 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                  
                  {section.intro && <p className="mb-4">{section.intro}</p>}
                  
                  {section.ingredients && (
                    <>
                      <h4 className="font-bold text-lg mb-2">Ingredients:</h4>
                      <ul className="list-disc pl-6 mb-4">
                        {section.ingredients.map((ingredient: string, i: number) => (
                          <li key={i}>{ingredient}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  {section.instructions && (
                    <>
                      <h4 className="font-bold text-lg mb-2">Instructions:</h4>
                      <ol className="list-decimal pl-6">
                        {section.instructions.map((step: string, i: number) => (
                          <li key={i} className="mb-2">{step}</li>
                        ))}
                      </ol>
                    </>
                  )}
                  
                  {section.notes && (
                    <div className="mt-4 text-sm italic">
                      <strong>Notes:</strong> {section.notes}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-12 pt-8 border-t border-gray-200">
          <div className="flex space-x-4">
            <button className="flex items-center text-gray-500 hover:text-jme-purple transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg">
              <Heart className="w-5 h-5 mr-1" />
              Like
            </button>
            <div className="relative share-menu-container">
              <button 
                className="flex items-center text-gray-500 hover:text-jme-purple transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
              >
                <Share2 className="w-5 h-5 mr-1" />
                Share
              </button>
              
              {showShareMenu && (
                <div className="absolute left-0 mt-2 w-44 bg-white rounded-lg shadow-lg py-2 z-10 animate-fadeIn">
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Facebook className="w-4 h-4 mr-3 text-blue-600" />
                    Facebook
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Twitter className="w-4 h-4 mr-3 text-blue-400" />
                    Twitter
                  </a>
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Linkedin className="w-4 h-4 mr-3 text-blue-700" />
                    LinkedIn
                  </a>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-3 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-3 text-gray-500" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <Link
            to="/blog"
            className="inline-flex items-center text-jme-purple font-semibold hover:text-purple-700 transition-colors bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg"
          >
            More Articles <span className="ml-1">→</span>
          </Link>
        </div>
      </article>
      
      {/* Author Bio */}
      <div className="mt-12 bg-gray-50 rounded-xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center">
          <img
            src="/profile.png"
            alt="Jaime Christine"
            className="w-16 h-16 rounded-full object-cover sm:mr-6 border-2 border-jme-purple"
            loading="lazy"
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{post.author}</h3>
            <p className="text-gray-600 mt-1">
              Certified Personal Trainer and Nutrition Coach with over 10 years of experience helping people transform their bodies and lives through fitness and nutrition.
            </p>
          </div>
        </div>
      </div>
      
      {/* Related Posts */}
      <div className="mt-12 sm:mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {blogPosts
            .filter((p: BlogPostType) => p.title !== post.title)
            .slice(0, 2)
            .map((relatedPost: BlogPostType, index: number) => (
              <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] flex flex-col h-full">
                <div className="relative overflow-hidden group">
                  <img
                    src={relatedPost.image}
                    alt={relatedPost.title}
                    className="object-cover w-full h-48 transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-jme-purple text-white text-sm px-3 py-1 rounded-full">
                      {relatedPost.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {relatedPost.excerpt}
                  </p>
                  <Link
                    to={`/blog/${relatedPost.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-jme-purple font-semibold hover:text-purple-700 transition-colors"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}

export default BlogPost;
