import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Vote, 
  PiggyBank,
  TrendingUp,
  Menu,
  X,
  ExternalLink,
  Users,
  User
} from 'lucide-react';
import WalletConnect from './WalletConnect';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Pools', href: '/pools', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Governance', href: '/governance', icon: Vote },
    { name: 'Savings', href: '/savings', icon: PiggyBank },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900">WashikaDAO</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet Connect & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              <WalletConnect />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900">WashikaDAO</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                A decentralized protocol on Stacks for marginalized communities, featuring 
                governance, savings with PoX stacking, and trustless lending.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Protocol</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/governance" className="text-sm text-gray-600 hover:text-primary-600">
                    Governance
                  </Link>
                </li>
                <li>
                  <Link to="/savings" className="text-sm text-gray-600 hover:text-primary-600">
                    Savings
                  </Link>
                </li>
                <li>
                  <Link to="/lending" className="text-sm text-gray-600 hover:text-primary-600">
                    Lending
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="text-sm text-gray-600 hover:text-primary-600">
                    Analytics
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://docs.stacks.co/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-primary-600 flex items-center space-x-1"
                  >
                    <span>Stacks Docs</span>
                    <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://docs.hiro.so/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-primary-600 flex items-center space-x-1"
                  >
                    <span>Hiro Docs</span>
                    <ExternalLink size={12} />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-primary-600 flex items-center space-x-1"
                  >
                    <span>GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 WashikaDAO. Built on Stacks for marginalized communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
