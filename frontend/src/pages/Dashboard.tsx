import React from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  PiggyBank,
  Vote,
  Heart,
  Globe,
  Shield,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useDAO, useSavingsSTX, useOracle } from '../hooks/useContract';
import { useStacks } from '../hooks/useStacks';
import { formatSTX, extractClarityValue } from '../utils/stacks';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  loading = false 
}) => {
  const changeColor = {
    positive: 'text-success-600',
    negative: 'text-error-600',
    neutral: 'text-gray-600'
  }[changeType];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-primary-600">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center space-x-1 text-sm ${changeColor}`}>
              <TrendingUp size={16} />
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { userData } = useStacks();
  
  // Use real pool data - mock the others for now
  const { proposalCount } = useDAO();
  const { poolInfo } = useSavingsSTX();
  const { price: stxPrice } = useOracle('STX-USD');
  
  // Calculate TVL (Total Value Locked)
  const calculateTVL = () => {
    const savingsSTX = poolInfo ? Number(extractClarityValue(poolInfo)?.['total-stx'] || 0) : 0;
    
    if (stxPrice) {
      const stxPriceUSD = Number(extractClarityValue(stxPrice) || 0) / 100000000;
      return (savingsSTX * stxPriceUSD / 1000000).toFixed(0);
    }
    return '2400'; // Mock value for demo
  };

  return (
    <div className="space-y-8">
      {/* Hero Section - Community Focused */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 p-8 lg:p-12">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="text-red-400" size={24} />
              <span className="text-white/90 font-medium">Built for Communities</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Financial Freedom for
              <span className="block text-yellow-300">Everyone</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              WashikaDAO empowers marginalized communities worldwide with decentralized savings, lending, and governance on Bitcoin's secure foundation.
            </p>
            
            {!userData.isSignedIn ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <CheckCircle className="text-green-300" size={20} />
                  <span className="text-white">No minimum balance required</span>
                </div>
                <div className="flex items-center space-x-4 mb-4">
                  <CheckCircle className="text-green-300" size={20} />
                  <span className="text-white">Earn Bitcoin rewards through stacking</span>
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <CheckCircle className="text-green-300" size={20} />
                  <span className="text-white">Community-governed protocol</span>
                </div>
                <button 
                  onClick={() => {
                    // This would trigger wallet connection
                    alert('Wallet connection will be implemented when contracts are deployed!');
                  }}
                  className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <span>Connect Wallet</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">Welcome back to the community!</p>
                    <p className="text-white/70 text-sm">Connected: {userData.profile?.stxAddress?.testnet?.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Community Impact Stats */}
        <div className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10 p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">1,247</div>
              <div className="text-white/70 text-sm">Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">${calculateTVL()}K</div>
              <div className="text-white/70 text-sm">Total Value Secured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-white/70 text-sm">Countries Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">7.2%</div>
              <div className="text-white/70 text-sm">Average APY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Value Locked"
          value={`$${calculateTVL()}K`}
          change="+12.5%"
          changeType="positive"
          icon={<DollarSign size={24} />}
          loading={!stxPrice}
        />
        
        <StatCard
          title="Active Proposals"
          value={proposalCount ? String(extractClarityValue(proposalCount) || 0) : '0'}
          change="+2 this week"
          changeType="positive"
          icon={<Vote size={24} />}
          loading={false}
        />
        
        <StatCard
          title="Community Pool"
          value={poolInfo ? `${formatSTX(Number(extractClarityValue(poolInfo)?.['total-stx'] || 0))} STX` : '0 STX'}
          change="Live on Testnet"
          changeType="positive"
          icon={<PiggyBank size={24} />}
          loading={false}
        />

        <StatCard
          title="Community Impact"
          value="156 Countries"
          change="+12 this month"
          changeType="positive"
          icon={<Globe size={24} />}
        />
      </div>

      {/* Community Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Savings for Everyone */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <PiggyBank className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Community Savings</h3>
              <p className="text-green-700 text-sm">Earn Bitcoin rewards together</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">No minimum deposit required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">Automated Bitcoin stacking</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">Community-pooled rewards</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/community-pool'}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Join Community Pool
          </button>
        </div>

        {/* Community Governance */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Vote className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Voice Matters</h3>
              <p className="text-blue-700 text-sm">Democratic decision making</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <Shield className="text-blue-500" size={16} />
              <span className="text-sm text-gray-700">Transparent governance</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="text-blue-500" size={16} />
              <span className="text-sm text-gray-700">Community proposals</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="text-blue-500" size={16} />
              <span className="text-sm text-gray-700">Equal voting rights</span>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/governance'}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Join Governance
          </button>
        </div>

        {/* Analytics */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <p className="text-purple-700 text-sm">Track community growth</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">Real-time pool metrics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">Governance participation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="text-yellow-500" size={16} />
              <span className="text-sm text-gray-700">Community impact data</span>
            </div>
          </div>
          
          <button
            onClick={() => window.location.href = '/analytics'}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Recent Community Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Community Activity</h3>
          <span className="text-sm text-gray-500">Live updates</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New community member from Nigeria</p>
                <p className="text-xs text-gray-600">Joined the savings pool with 100 STX</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2 min ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Vote size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Community Grant Proposal Passed</p>
                <p className="text-xs text-gray-600">$50,000 allocated for education initiatives</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">1h ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Heart size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Micro-loan success story</p>
                <p className="text-xs text-gray-600">Small business in Kenya repaid loan early</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">3h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
