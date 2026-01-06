import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileInput, AlertTriangle, Settings, Info, Sun } from 'lucide-react';

const Navbar: React.FC = () => {
  const navItems = [
    { path: '/', label: '変換', icon: <FileInput size={20} /> },
    { path: '/errors', label: 'エラー', icon: <AlertTriangle size={20} /> },
    { path: '/settings', label: '設定', icon: <Settings size={20} /> },
    { path: '/about', label: 'About', icon: <Info size={20} /> },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Sun className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">PCS Generator</span>
            </div>
            <div className="ml-6 flex space-x-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
