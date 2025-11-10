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
    setIsAuthenticated(false);
  };

  return (
    <nav className="bg-white border-b border-gray-300 fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Camera size={28} className="text-pink-600" />
          <span className="text-2xl font-bold font-serif">Instagram Lite</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-gray-600">
            <Home size={24} />
          </Link>
          <Link to={`/profile/${user.id}`} className="hover:text-gray-600">
            <User size={24} />
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-600">
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;