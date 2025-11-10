import React from 'react';
import '../styles/PostCard.css';

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
}

interface PostCardProps {
  post: Post;
  onDelete: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-user-info">
          <img src={post.userAvatar} alt={post.username} className="user-avatar" />
          <span className="username">{post.username}</span>
        </div>
      </div>
      <img src={post.image} alt="Post" className="post-image" />
      <div className="post-actions">
        <div className="action-icons">
          <button className="action-btn">
            <svg /* ...heart icon... */>
              {/* ...existing code... */}
            </svg>
          </button>
          <button className="action-btn">
            <svg /* ...comment icon... */>
              {/* ...existing code... */}
            </svg>
          </button>
          <button 
            className="action-btn delete-action-btn" 
            onClick={() => onDelete(post.id)}
            title="Delete post"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="post-content">
        <p className="caption">{post.caption}</p>
        <div className="post-stats">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
