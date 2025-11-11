import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Camera } from 'lucide-react';

interface RegisterProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Register: React.FC<RegisterProps> = ({ setIsAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Attempting registration with:', { username, email, password: '***' });

    try {
      const response = await axios.post('/api/auth/register', { 
        username, 
        email, 
        password 
      });
      
      console.log('Registration successful:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id.toString());
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
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
            type="text"
            placeholder="Username"
            className="w-full p-3 border border-gray-300 rounded mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-gray-600">Have an account? </span>
          <Link to="/login" className="text-blue-500 font-semibold">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;