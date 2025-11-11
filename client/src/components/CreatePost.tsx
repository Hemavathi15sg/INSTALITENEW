import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import AICaptionSuggestions from './AICaptionSuggestions';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setShowAISuggestions(false); // Reset AI suggestions when new image is selected
    }
  };

  const handleCaptionSelect = (selectedCaption: string) => {
    setCaption(selectedCaption);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);
    formData.append('caption', caption);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/posts', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      onPostCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create post', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {preview && (
              <img src={preview} alt="Preview" className="mt-4 w-full rounded-lg max-h-96 object-cover" />
            )}
          </div>

          {/* AI Caption Suggestions Section */}
          {image && (
            <div className="mb-4">
              <AICaptionSuggestions
                imageFile={image}
                onCaptionSelect={handleCaptionSelect}
              />
            </div>
          )}

          {/* Caption Input Section */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Caption
            </label>
            <textarea
              placeholder="Write a caption or select an AI suggestion above..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Share
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;