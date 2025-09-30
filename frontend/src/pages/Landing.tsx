import React from 'react';
import { ArrowRight, Shield, Users, Globe, TrendingUp, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStacks } from '../hooks/useStacks';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useStacks();

  React.useEffect(() => {
    // If already connected, redirect to dashboard
    if (userData.isSignedIn) {
      navigate('/dashboard');
    }
  }, [userData.isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="text-white" size={32} />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                WashikaDAO
              </h1>
            </div>

            {/* Main Headline */}
            <h2 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Financial Freedom
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                For Everyone
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Empowering marginalized communities worldwide with decentralized savings 
              and governance on Bitcoin's secure foundation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              
              <button
                onClick={() => navigate('/community-pool')}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border-2 border-purple-200 hover:border-purple-300 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Explore Community Pool
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">1,247</div>
                <div className="text-gray-600">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">$2.4M</div>
                <div className="text-gray-600">Value Secured</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">156</div>
                <div className="text-gray-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">7.2%</div>
                <div className="text-gray-600">Average APY</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Communities
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No barriers, no discrimination, just fair access to financial services for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="text-white" size={28} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Community Pooling</h4>
            <p className="text-gray-600 leading-relaxed">
              Save together, grow together. Contribute weekly and receive monthly distributions. 
              No minimum required - every contribution counts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="text-white" size={28} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Bitcoin Secured</h4>
            <p className="text-gray-600 leading-relaxed">
              Built on Stacks, secured by Bitcoin. Your funds are protected by the world's 
              most secure blockchain network.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-pink-200">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-white" size={28} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Earn Rewards</h4>
            <p className="text-gray-600 leading-relaxed">
              Earn BTC rewards through PoX stacking. Get up to 7.2% APY on your STX 
              contributions automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Why WashikaDAO Section */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-16">
            <h3 className="text-4xl font-bold mb-4">Why WashikaDAO?</h3>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Traditional banking excludes billions. We include everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-white" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">No Barriers</h4>
              <p className="text-purple-100">
                No minimum balance, no credit checks, no discrimination
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-white" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Global Access</h4>
              <p className="text-purple-100">
                Serving 156 countries, reaching the underserved everywhere
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Community First</h4>
              <p className="text-purple-100">
                Governed by the community, for the community
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={32} />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Transparent</h4>
              <p className="text-purple-100">
                All transactions on-chain, fully auditable and secure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Join the Movement?
          </h3>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Be part of a global community building financial freedom for everyone.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center space-x-2"
          >
            <span>Start Your Journey</span>
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
