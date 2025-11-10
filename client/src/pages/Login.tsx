import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Camera } from 'lucide-react';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id.toString());
      setIsAuthenticated(true);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-6">
          <Camera size={48} className="text-pink-600" />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 font-serif">Instagram Lite</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded font-semibold hover:bg-blue-600"
          >
            Log In
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="text-blue-500 font-semibold">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;