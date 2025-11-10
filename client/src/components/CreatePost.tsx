import { useState } from 'react';
import axios from 'axios';
import { X, Sparkles } from 'lucide-react';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionError, setCaptionError] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setCaptionError(''); // Clear any previous errors
    }
  };

  const handleGenerateCaption = async () => {
    if (!image) {
      setCaptionError('Please select an image first');
      return;
    }

    setIsGeneratingCaption(true);
    setCaptionError('');

    const formData = new FormData();
    formData.append('image', image);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/posts/generate-caption', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setCaption(response.data.caption);
    } catch (err: any) {
      console.error('Failed to generate caption', err);
      const errorMsg = err.response?.data?.error || 'Failed to generate caption. Please try again.';
      setCaptionError(errorMsg);
    } finally {
      setIsGeneratingCaption(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
              required
            />
            {preview && (
              <img src={preview} alt="Preview" className="mt-4 w-full rounded-lg" />
            )}
          </div>

          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={!image || isGeneratingCaption}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded font-semibold hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={18} />
                {isGeneratingCaption ? 'Generating...' : 'AI Generate Caption'}
              </button>
            </div>
            
            {captionError && (
              <div className="text-red-500 text-sm mb-2">{captionError}</div>
            )}

            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded resize-none"
              rows={3}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded font-semibold hover:bg-blue-600"
          >
            Share
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;