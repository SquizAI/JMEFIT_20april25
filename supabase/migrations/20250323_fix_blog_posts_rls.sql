-- Fix blog_posts RLS policies
-- Allow anyone to read published blog posts
CREATE POLICY "Anyone can view published blog posts" 
  ON blog_posts FOR SELECT 
  USING (status = 'published');

-- Allow admins to manage all blog posts
CREATE POLICY "Admins can manage all blog posts"
  ON blog_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  ); 