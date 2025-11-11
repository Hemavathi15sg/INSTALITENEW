import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, XCircle, Copy } from 'lucide-react';

interface AICaptionSuggestionsProps {
  imageFile: File | null;
  onCaptionSelect: (caption: string) => void;
}

const AICaptionSuggestions: React.FC<AICaptionSuggestionsProps> = ({ 
  imageFile, 
  onCaptionSelect 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCaptions = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCaptions([]);
    setSelectedCaption(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts/generate-caption', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      setCaptions(data.captions || []);
    } catch (err) {
      console.error('Error generating captions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate captions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectCaption = (caption: string) => {
    setSelectedCaption(caption);
    onCaptionSelect(caption);
  };

  const handleCopyCaption = (caption: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigator.clipboard.writeText(caption);
  };

  return (
    <div className="w-full">
      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerateCaptions}
        disabled={!imageFile || isGenerating}
        className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
          !imageFile || isGenerating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg'
        }`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Generating AI Captions...</span>
          </>
        ) : (
          <>
            <Sparkles size={20} />
            <span>Generate AI Captions</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-1">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Caption Suggestions */}
      {captions.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            AI Caption Suggestions
          </h3>
          
          <div className="space-y-2">
            {captions.map((caption, index) => (
              <div
                key={index}
                onClick={() => handleSelectCaption(caption)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCaption === caption
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-800 flex-1 leading-relaxed">
                    {caption}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedCaption === caption && (
                      <CheckCircle2 
                        className="text-purple-500" 
                        size={20} 
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleCopyCaption(caption, e)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {selectedCaption === caption && (
                  <div className="mt-2 text-xs font-medium text-purple-600">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
            Click on a caption to use it, or click the copy icon to copy to clipboard
          </p>
        </div>
      )}

      {/* Loading State Skeleton */}
      {isGenerating && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            Generating Captions...
          </h3>
          
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse"
              >
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AICaptionSuggestions;