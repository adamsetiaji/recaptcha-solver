// src/components/Layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Code, Monitor, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { title: 'Dashboard', path: '/', icon: LayoutDashboard },
    { title: 'Users', path: '/users', icon: Users },
    { title: 'Function Requests', path: '/function-requests', icon: Code },
    { title: 'Monitor Recaptcha', path: '/monitor-recaptcha', icon: Monitor },
    { title: 'Setting', path: '/setting', icon: Settings },
  ];

  return (
    <div className="h-screen w-64 bg-gray-800 text-white p-4">
      <div className="text-xl font-bold mb-8">Admin Panel</div>
      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-gray-700 transition-colors ${
                isActive ? 'bg-gray-700' : ''
              }`}
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;