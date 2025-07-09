import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
  FileText,
  Image,
  Video,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Upload,
  Globe,
  Clock,
  Tag,
  BarChart,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  author_id: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string;
  categories: string[];
  tags: string[];
  seo_title: string;
  seo_description: string;
  views: number;
  created_at: string;
  updated_at: string;
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
  width?: number;
  height?: number;
  uploaded_at: string;
  alt_text?: string;
}

export function ContentManagement() {
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'seo'>('posts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const queryClient = useQueryClient();

  // Fetch blog posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase.from('blog_posts').select('*');
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  // Fetch media items
  const { data: mediaItems } = useQuery({
    queryKey: ['media-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as MediaItem[];
    }
  });

  // Create/Update post
  const postMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      if (post.id) {
        const { error } = await supabase
          .from('blog_posts')
          .update(post)
          .eq('id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([{ ...post, author_id: (await supabase.auth.getUser()).data.user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success(editingPost ? 'Post updated!' : 'Post created!');
      setShowEditor(false);
      setEditingPost(null);
    }
  });

  // Delete post
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post deleted!');
    }
  });

  // Upload media
  const uploadMedia = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `media/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // Save to media library
    const { error: dbError } = await supabase
      .from('media_library')
      .insert([{
        filename: file.name,
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        size: file.size
      }]);

    if (dbError) throw dbError;
    
    queryClient.invalidateQueries({ queryKey: ['media-items'] });
    toast.success('Media uploaded successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadMedia);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'posts' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Blog Posts
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'media' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'seo' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              SEO Tools
            </button>
          </div>
        </div>

        {/* Blog Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setShowEditor(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </div>

            {/* Posts List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left pb-3">Title</th>
                    <th className="text-left pb-3">Status</th>
                    <th className="text-left pb-3">Author</th>
                    <th className="text-left pb-3">Published</th>
                    <th className="text-left pb-3">Views</th>
                    <th className="text-left pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts?.map((post) => (
                    <tr key={post.id} className="border-b dark:border-gray-700">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500">{post.slug}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'published' ? 'bg-green-100 text-green-800' :
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm">{post.author_id}</td>
                      <td className="py-3 text-sm">
                        {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="py-3 text-sm">{post.views}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            className="p-1 text-gray-600 hover:text-purple-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setShowEditor(true);
                            }}
                            className="p-1 text-gray-600 hover:text-purple-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this post?')) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            className="p-1 text-gray-600 hover:text-red-600"
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

        {/* Media Library Tab */}
        {activeTab === 'media' && (
          <div>
            <div className="mb-6">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-600 dark:text-gray-400">Click to upload media</span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {mediaItems?.map((item) => (
                <div key={item.id} className="border dark:border-gray-700 rounded-lg p-4">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.alt_text || item.filename}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : item.type === 'video' ? (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="text-sm font-medium truncate">{item.filename}</div>
                  <div className="text-xs text-gray-500">
                    {(item.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.url);
                      toast.success('URL copied to clipboard!');
                    }}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700"
                  >
                    Copy URL
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO Tools Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">92/100</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">SEO Score</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-blue-600">+12%</span>
                </div>
                <div className="text-2xl font-bold">45.2K</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Traffic</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-purple-600">287</span>
                </div>
                <div className="text-2xl font-bold">1,234</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Keywords Ranked</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">SEO Recommendations</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Meta descriptions optimized</div>
                    <div className="text-sm text-gray-500">All pages have unique meta descriptions</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Missing alt text on 12 images</div>
                    <div className="text-sm text-gray-500">Add descriptive alt text for better accessibility</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Page load speed: 3.2s</div>
                    <div className="text-sm text-gray-500">Optimize images to improve loading time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Blog Post Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              postMutation.mutate({
                id: editingPost?.id,
                title: formData.get('title') as string,
                slug: (formData.get('title') as string).toLowerCase().replace(/\s+/g, '-'),
                content: formData.get('content') as string,
                excerpt: formData.get('excerpt') as string,
                status: formData.get('status') as BlogPost['status'],
                seo_title: formData.get('seo_title') as string,
                seo_description: formData.get('seo_description') as string,
                tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
                categories: (formData.get('categories') as string).split(',').map(c => c.trim())
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editingPost?.title}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Excerpt</label>
                  <textarea
                    name="excerpt"
                    rows={2}
                    defaultValue={editingPost?.excerpt}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    name="content"
                    rows={10}
                    defaultValue={editingPost?.content}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      name="status"
                      defaultValue={editingPost?.status || 'draft'}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Categories (comma separated)</label>
                    <input
                      name="categories"
                      type="text"
                      defaultValue={editingPost?.categories?.join(', ')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    defaultValue={editingPost?.tags?.join(', ')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">SEO Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Title</label>
                      <input
                        name="seo_title"
                        type="text"
                        defaultValue={editingPost?.seo_title}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Description</label>
                      <textarea
                        name="seo_description"
                        rows={2}
                        defaultValue={editingPost?.seo_description}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingPost ? 'Update' : 'Create'} Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 