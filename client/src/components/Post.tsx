import { useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Comment {
  id: number;
  user_id: number;
  username: string;
  avatar: string;
  content: string;
  created_at: string;
}

interface PostProps {
  post: {
    id: number;
    user_id: number;
    username: string;
    avatar: string;
    image_url: string;
    caption: string;
    likes_count: number;
    created_at: string;
  };
  onDelete?: (postId: number) => void;
}

const Post: React.FC<PostProps> = ({ post, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  const isOwner = currentUserId === post.user_id;

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`/api/posts/${post.id}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/posts/${post.id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiked(!liked);
      setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleCommentToggle = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/posts/${post.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchComments();
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="flex items-center p-4 h-16">
        <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3">
          <img 
            src={post.avatar || '/default-avatar.png'} 
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <span className="font-semibold truncate">{post.username}</span>
        </Link>
      </div>

           {/* Image - Fixed Height with Better Object Fit */}
    <div className="w-full h-96 bg-gray-100 flex items-center justify-center overflow-hidden">
      <img 
        src={post.image_url} 
        alt={post.caption}
        className="w-full h-full object-contain"
      />
    </div>

      {/* Content - Fixed Structure */}
      <div className="p-4">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-3">
          <button onClick={handleLike} className={liked ? 'text-red-500' : 'hover:text-gray-600'}>
            <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleCommentToggle} className="hover:text-gray-600">
            <MessageCircle size={24} />
          </button>
          {isOwner && (
            <button onClick={handleDelete} className="hover:text-red-500 ml-auto">
              <Trash2 size={24} />
            </button>
          )}
        </div>

        {/* Likes Count */}
        <div className="font-semibold mb-2">{likesCount} likes</div>
        
        {/* Caption - Max 2 lines with ellipsis */}
        {post.caption && (
          <div className="mb-2">
            <span className="font-semibold mr-2">{post.username}</span>
            <span className="line-clamp-2">{post.caption}</span>
          </div>
        )}

        {/* View Comments Button */}
        {comments.length > 0 && !showComments && (
          <button 
            onClick={handleCommentToggle}
            className="text-gray-500 text-sm mb-2 hover:text-gray-700"
          >
            View all {comments.length} comments
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t pt-4">
            {loadingComments ? (
              <p className="text-gray-500 text-sm">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-sm mb-3">No comments yet</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.avatar || '/default-avatar.png'} 
                      alt={comment.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div>
                        <span className="font-semibold text-sm mr-2">{comment.username}</span>
                        <span className="text-sm break-words">{comment.content}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Date */}
        <div className="text-gray-400 text-sm mt-2">
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default Post;