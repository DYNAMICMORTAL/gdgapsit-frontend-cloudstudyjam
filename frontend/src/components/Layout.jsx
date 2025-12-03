import { Link, useLocation } from 'react-router-dom';
import { Trophy, Bell, Home, Cloud, Menu, X, Award, Users, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  const navigation = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Announcements', path: '/announcements', icon: Bell },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Certificates', path: '/admin/certificates', icon: Award }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <Link to="/" className="flex items-center gap-3 group">
              {/* Google Colors Logo */}
              <div className="flex items-center gap-0.5 bg-white rounded-lg p-2 border border-gray-200 group-hover:border-google-blue transition-colors">
                <Cloud className="w-6 h-6 text-google-blue" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="text-google-blue text-xl font-bold">G</span>
                  <span className="text-google-red text-xl font-bold">D</span>
                  <span className="text-google-yellow text-xl font-bold">G</span>
                  <span className="text-gray-700 text-xl font-medium ml-1">APSIT</span>
                </div>
                <p className="text-xs text-gray-600">Cloud Study Jam 2025</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-google-blue text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive(item.path)
                          ? 'bg-google-blue text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-6 h-6 text-google-blue" />
                <div className="flex items-center gap-1">
                  <span className="text-google-blue text-lg font-bold">G</span>
                  <span className="text-google-red text-lg font-bold">D</span>
                  <span className="text-google-yellow text-lg font-bold">G</span>
                  <span className="text-white text-lg font-medium ml-1">APSIT</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                GDG on Campus APSIT's official Cloud Study Jam portal. Learn Google Cloud Platform, 
                earn skill badges, and compete with peers.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-google-blue" />
                  <span className="text-sm text-gray-400">200+ Participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-google-green" />
                  <span className="text-sm text-gray-400">50+ Badges</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/announcements" className="text-gray-400 hover:text-white transition-colors">
                    Announcements
                  </Link>
                </li>
                <li>
                  <Link to="/admin/students" className="text-gray-400 hover:text-white transition-colors">
                    Admin · Students
                  </Link>
                </li>
                <li>
                  <Link to="/admin/certificates" className="text-gray-400 hover:text-white transition-colors">
                    Admin · Certificates
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.cloudskillsboost.google/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Cloud Skills Boost
                  </a>
                </li>
                <li>
                  <a 
                    href="https://cloud.google.com/docs" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    GCP Documentation
                  </a>
                </li>
                <li>
                  <a 
                    href="https://gdg.community.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    GDG Community
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2025 GDG on Campus APSIT. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>Made with ❤️ by GDG APSIT</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
