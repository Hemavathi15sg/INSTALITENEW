import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';

interface PostType {
  id: number;
  user_id: number;
  username: string;
  avatar: string;
  image_url: string;
  caption: string;
  likes_count: number;
  created_at: string;
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts');
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto pt-20 pb-8 px-4">
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showCreatePost && (
        <CreatePost 
          onClose={() => setShowCreatePost(false)} 
          onPostCreated={fetchPosts}
        />
      )}

      <div className="space-y-8">
        {posts.map(post => (
          <Post key={post.id} post={post} onDelete={handlePostDeleted} />
        ))}
      </div>
    </div>
  );
};

export default Feed;
