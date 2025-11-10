import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Profile: React.FC = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, [userId]);

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto pt-20 pb-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-center gap-8">
          <img 
            src={user.avatar || '/default-avatar.png'} 
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
            <p className="text-gray-600 mb-4">{user.bio || 'No bio yet'}</p>
            <div className="flex gap-8">
              <div><span className="font-bold">{user.posts?.length || 0}</span> posts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {user.posts?.map((post: any) => (
          <div key={post.id} className="aspect-square">
            <img 
              src={post.image_url} 
              alt={post.caption}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;