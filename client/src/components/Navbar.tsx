import React from 'react';
import { Link } from 'react-router-dom';
import { Home, User, LogOut, Camera } from 'lucide-react';

interface NavbarProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setIsAuthenticated }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 border-b border-white/20 fixed top-0 w-full z-50 shadow-lg backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-full group-hover:bg-white/30 transition">
            <Camera size={28} className="text-white" />
          </div>
          <span className="text-2xl font-bold font-serif text-white drop-shadow-lg">
            Insta Lite
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="text-white hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm"
            title="Home"
          >
            <Home size={24} />
          </Link>
          <Link 
            to={`/profile/${user.id}`} 
            className="text-white hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm"
            title="Profile"
          >
            <User size={24} />
          </Link>
          <button 
            onClick={handleLogout} 
            className="text-white hover:bg-white/20 p-2 rounded-full transition backdrop-blur-sm"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;