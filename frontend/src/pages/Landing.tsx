import React from 'react';
import { ArrowRight, Shield, Users, Globe, TrendingUp, Heart, Sparkles, Star, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStacks } from '../hooks/useStacks';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useStacks();

  React.useEffect(() => {
    // If already connected, redirect to pools
    if (userData.isSignedIn) {
      navigate('/pools');
    }
  }, [userData.isSignedIn, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,transparent,white,transparent)] -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center">
            {/* Logo/Brand - Smaller and more refined */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Heart className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                WashikaDAO
              </h1>
            </div>

            {/* Main Headline - More compact */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
              Financial Freedom
              <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                For Everyone
              </span>
            </h2>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Empowering marginalized communities worldwide with decentralized savings 
              and governance on Bitcoin's secure foundation.
            </p>

            {/* CTA Buttons - More compact */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <button
                onClick={() => navigate('/dashboard')}
                className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              
              <button
                onClick={() => navigate('/community-pool')}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm text-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl border border-purple-200 hover:border-purple-300 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Explore Community Pool
              </button>
            </div>

            {/* Stats - Compact cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="text-2xl font-bold text-purple-600 mb-1">1,247</div>
                <div className="text-sm text-gray-600">Community Members</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600 mb-1">$2.4M</div>
                <div className="text-sm text-gray-600">Value Secured</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="text-2xl font-bold text-pink-600 mb-1">156</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20 shadow-sm">
                <div className="text-2xl font-bold text-green-600 mb-1">7.2%</div>
                <div className="text-sm text-gray-600">Average APY</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Built for Communities
          </h3>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            No barriers, no discrimination, just fair access to financial services for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-green-200 hover:border-green-300">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-green-500/25">
              <Users className="text-white" size={26} />
            </div>
            <h4 className="text-xl font-bold text-green-800 mb-3">Community Pooling</h4>
            <p className="text-green-700 text-sm leading-relaxed">
              Save together, grow together. Contribute weekly and receive monthly distributions. 
              No minimum required - every contribution counts.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-purple-200 hover:border-purple-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">
              <Shield className="text-white" size={26} />
            </div>
            <h4 className="text-xl font-bold text-purple-800 mb-3">Bitcoin Secured</h4>
            <p className="text-purple-700 text-sm leading-relaxed">
              Built on Stacks, secured by Bitcoin. Your funds are protected by the world's 
              most secure blockchain network.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-pink-200 hover:border-pink-300">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-pink-500/25">
              <TrendingUp className="text-white" size={26} />
            </div>
            <h4 className="text-xl font-bold text-pink-800 mb-3">Earn Rewards</h4>
            <p className="text-pink-700 text-sm leading-relaxed">
              Earn BTC rewards through PoX stacking. Get up to 7.2% APY on your STX 
              contributions automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Why WashikaDAO Section */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-12">
            <h3 className="text-3xl font-bold mb-3">Why WashikaDAO?</h3>
            <p className="text-lg text-purple-100 max-w-xl mx-auto">
              Traditional banking excludes billions. We include everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No Barriers</h4>
              <p className="text-purple-100 text-sm">
                No minimum balance, no credit checks, no discrimination
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Global Access</h4>
              <p className="text-purple-100 text-sm">
                Serving 156 countries, reaching the underserved everywhere
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Community First</h4>
              <p className="text-purple-100 text-sm">
                Governed by the community, for the community
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="text-white" size={24} />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Transparent</h4>
              <p className="text-purple-100 text-sm">
                All transactions on-chain, fully auditable and secure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Trusted by Communities Worldwide
          </h3>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Real stories from people building financial freedom together.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <Quote className="w-8 h-8 text-purple-400 mb-3" />
            <p className="text-purple-800 text-sm mb-4 leading-relaxed">
              "WashikaDAO helped me start saving for the first time. The community support and Bitcoin rewards make it feel safe and rewarding."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                AM
              </div>
              <div className="ml-3">
                <p className="font-semibold text-purple-900 text-sm">Amara M.</p>
                <p className="text-purple-600 text-xs">Lagos, Nigeria</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <Quote className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-blue-800 text-sm mb-4 leading-relaxed">
              "Finally, a financial platform that doesn't discriminate. I've been earning steady returns while helping my community grow."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                CR
              </div>
              <div className="ml-3">
                <p className="font-semibold text-blue-900 text-sm">Carlos R.</p>
                <p className="text-blue-600 text-xs">São Paulo, Brazil</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <Quote className="w-8 h-8 text-green-400 mb-3" />
            <p className="text-green-800 text-sm mb-4 leading-relaxed">
              "The governance system lets our community decide how funds are used. It's democracy in action for financial inclusion."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                PS
              </div>
              <div className="ml-3">
                <p className="font-semibold text-green-900 text-sm">Priya S.</p>
                <p className="text-green-600 text-xs">Mumbai, India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center shadow-xl">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Join the Movement?
          </h3>
          <p className="text-lg text-purple-100 mb-6 max-w-xl mx-auto">
            Be part of a global community building financial freedom for everyone.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white text-purple-600 rounded-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center space-x-2"
          >
            <span>Start Your Journey</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
