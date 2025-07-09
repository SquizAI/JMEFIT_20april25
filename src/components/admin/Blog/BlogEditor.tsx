import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import AIBlogWriter from './AIBlogWriter';
import { 
  FileText, 
  Eye, 
  Save, 
  Trash2, 
  Plus, 
  Edit2,
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Code,
  Heading1,
  Heading2,
  Sparkles
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  author_id: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    email: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

function BlogEditor() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'categories'>('posts');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Rich text editor state
  const [editorContent, setEditorContent] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Fetch blog posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['blog-posts', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as BlogCategory[];
    }
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'author'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('blog_posts')
        .insert([{ ...post, author_id: user?.id }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      setShowNewPostForm(false);
      setEditorContent('');
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (post: BlogPost) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          category: post.category,
          tags: post.tags,
          status: post.status,
          published_at: post.published_at,
          seo_title: post.seo_title,
          seo_description: post.seo_description,
          seo_keywords: post.seo_keywords,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      setEditingPost(null);
      setActiveTab('posts');
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<BlogCategory, 'id'>) => {
      const { error } = await supabase
        .from('blog_categories')
        .insert([category]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] });
    }
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Apply formatting to editor
  const applyFormat = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
    }

    const newContent = 
      editorContent.substring(0, start) + 
      formattedText + 
      editorContent.substring(end);
    
    setEditorContent(newContent);
  };

  // Render markdown preview (basic implementation)
  const renderMarkdown = (content: string) => {
    // This is a very basic markdown renderer
    // In production, use a proper markdown library like marked or remark
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.+)$/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

  const handleCreatePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get('title')?.toString() || '';
    const slug = formData.get('slug')?.toString() || generateSlug(title);
    
    const newPost: Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'author'> = {
      title,
      slug,
      content: editorContent,
      excerpt: formData.get('excerpt')?.toString() || '',
      featured_image: formData.get('featured_image')?.toString() || undefined,
      author_id: '', // Will be set in mutation
      category: formData.get('category')?.toString() || 'uncategorized',
      tags: formData.get('tags')?.toString()?.split(',').map(t => t.trim()) || [],
      status: formData.get('status')?.toString() as BlogPost['status'] || 'draft',
      published_at: formData.get('published_at')?.toString() || undefined,
      seo_title: formData.get('seo_title')?.toString() || title,
      seo_description: formData.get('seo_description')?.toString() || '',
      seo_keywords: formData.get('seo_keywords')?.toString()?.split(',').map(k => k.trim()) || []
    };
    
    createPostMutation.mutate(newPost);
  };

  if (postsLoading || categoriesLoading) {
    return <div className="text-center py-8">Loading blog data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Blog Manager</h2>
            <p className="text-gray-600 mt-1">Create and manage blog posts</p>
          </div>
          <button
            onClick={() => {
              setShowNewPostForm(true);
              setActiveTab('editor');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'posts' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Posts
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'editor' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            disabled={!showNewPostForm && !editingPost}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'categories' 
                ? 'border-jme-purple text-jme-purple' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      {/* Posts List */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="all">All Posts</option>
                  <option value="draft">Drafts</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts
                  ?.filter(post => 
                    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500">{post.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {post.author?.full_name || post.author?.email || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.status === 'published' ? 'bg-green-100 text-green-800' :
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {post.published_at 
                          ? format(parseISO(post.published_at), 'MMM d, yyyy')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setEditorContent(post.content);
                              setActiveTab('editor');
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post?')) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor */}
      {activeTab === 'editor' && (showNewPostForm || editingPost) && (
        <form 
          onSubmit={editingPost 
            ? (e) => {
                e.preventDefault();
                updatePostMutation.mutate({
                  ...editingPost,
                  content: editorContent
                });
              }
            : handleCreatePost
          }
          className="space-y-6"
        >
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  name="title"
                  defaultValue={editingPost?.title}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter post title..."
                  onChange={(e) => {
                    if (!editingPost) return;
                    const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement;
                    if (slugInput && !slugInput.value) {
                      slugInput.value = generateSlug(e.target.value);
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    name="slug"
                    defaultValue={editingPost?.slug}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="post-url-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingPost?.category || 'uncategorized'}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="uncategorized">Uncategorized</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea
                  name="excerpt"
                  defaultValue={editingPost?.excerpt}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Brief description of the post..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingPost?.status || 'draft'}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Publish Date</label>
                  <input
                    name="published_at"
                    type="datetime-local"
                    defaultValue={editingPost?.published_at?.slice(0, 16)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Blog Writer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <AIBlogWriter 
                onGenerate={(content) => {
                  setEditorContent(content.content);
                  // Update form fields
                  const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
                  const excerptTextarea = document.querySelector('textarea[name="excerpt"]') as HTMLTextAreaElement;
                  const seoDescTextarea = document.querySelector('textarea[name="seo_description"]') as HTMLTextAreaElement;
                  
                  if (titleInput) titleInput.value = content.title;
                  if (excerptTextarea) excerptTextarea.value = content.excerpt;
                  if (seoDescTextarea) seoDescTextarea.value = content.metaDescription;
                }}
              />
            </div>

            {/* Content Editor */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Content</h3>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>

            {/* Formatting Toolbar */}
            {!previewMode && (
              <div className="flex gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => applyFormat('bold')}
                  className="p-2 hover:bg-white rounded"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  className="p-2 hover:bg-white rounded"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px bg-gray-300" />
                <button
                  type="button"
                  onClick={() => applyFormat('h1')}
                  className="p-2 hover:bg-white rounded"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('h2')}
                  className="p-2 hover:bg-white rounded"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <div className="w-px bg-gray-300" />
                <button
                  type="button"
                  onClick={() => applyFormat('list')}
                  className="p-2 hover:bg-white rounded"
                  title="List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('quote')}
                  className="p-2 hover:bg-white rounded"
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('code')}
                  className="p-2 hover:bg-white rounded"
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormat('link')}
                  className="p-2 hover:bg-white rounded"
                  title="Link"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Editor/Preview */}
            {previewMode ? (
              <div 
                className="prose max-w-none p-4 bg-gray-50 rounded-lg min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(editorContent) }}
              />
            ) : (
              <textarea
                id="content-editor"
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                rows={20}
                placeholder="Write your content here... (Markdown supported)"
                required
              />
            )}
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">SEO Title</label>
                <input
                  name="seo_title"
                  defaultValue={editingPost?.seo_title}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="SEO optimized title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <textarea
                  name="seo_description"
                  defaultValue={editingPost?.seo_description}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="SEO meta description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
                <input
                  name="seo_keywords"
                  defaultValue={editingPost?.seo_keywords?.join(', ')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  name="tags"
                  defaultValue={editingPost?.tags?.join(', ')}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                <input
                  name="featured_image"
                  type="url"
                  defaultValue={editingPost?.featured_image}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setShowNewPostForm(false);
                setEditingPost(null);
                setEditorContent('');
                setActiveTab('posts');
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-5 h-5" />
              {editingPost ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Categories</h3>
          </div>
          
          <div className="p-6">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name')?.toString() || '';
                createCategoryMutation.mutate({
                  name,
                  slug: generateSlug(name),
                  description: formData.get('description')?.toString()
                });
                e.currentTarget.reset();
              }}
              className="flex gap-4 mb-6"
            >
              <input
                name="name"
                placeholder="Category name"
                required
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <input
                name="description"
                placeholder="Description (optional)"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-jme-purple-dark"
              >
                Add Category
              </button>
            </form>

            <div className="space-y-2">
              {categories?.map(category => (
                <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.slug}</div>
                    {category.description && (
                      <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogEditor;