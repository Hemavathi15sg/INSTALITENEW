# Instagram Lite - GitHub Copilot SDLC Demo

A simple Instagram clone built to demonstrate GitHub Copilot's capabilities across the Software Development Lifecycle.

## Features
- ✅ User authentication (login/signup)
- ✅ Photo feed with real-time likes
- ✅ Post creation with image upload
- ✅ User profiles
- ✅ Comments on posts
- ✨ **NEW**: AI-Powered Image Captions using BLIP model

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **Auth**: JWT + bcrypt
- **AI**: Hugging Face Inference API (BLIP image captioning)

## Installation

1. Clone or create the project structure
2. Install all dependencies:
   ```powershell
   npm run install:all
   ```
3. Set up environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Get a free Hugging Face API token from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Add your API token to `server/.env`:
     ```
     HUGGINGFACE_API_KEY=your_token_here
     ```
   - Note: AI caption generation is optional. The app works without it, but the feature will be disabled.

4. Run the application:
   ```powershell
   npm run dev
   ```
   This starts both the frontend (http://localhost:5173) and backend (http://localhost:5000)

## AI-Powered Image Captions

The app now includes AI-powered automatic caption generation for images using the BLIP (Bootstrapping Language-Image Pre-training) model from Salesforce via the Hugging Face Inference API.

### How to Use:
1. Click "Create Post" to upload an image
2. Select your image file
3. Click the "AI Generate Caption" button (purple button with sparkles ✨)
4. The AI will analyze your image and suggest a caption
5. You can edit the generated caption or write your own
6. Click "Share" to post

### Configuration:
- The feature requires a Hugging Face API token (free tier available)
- Set `HUGGINGFACE_API_KEY` in `server/.env`
- If not configured, the app still works - the AI button will show an error message

### Model Details:
- **Model**: Salesforce/blip-image-captioning-large
- **Task**: Image-to-text (visual question answering)
- **Provider**: Hugging Face Inference API
- **Language**: English

### API Endpoint:
```
POST /api/posts/generate-caption
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: 
  - image: File (image file to analyze)

Response:
  - caption: String (generated caption text)
```