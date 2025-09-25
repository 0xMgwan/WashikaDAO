import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  DollarSign,
  Users,
  Zap,
  Target
} from 'lucide-react';
import { useDAO, useSavingsSTX, useLendingCore, useOracle } from '../hooks/useContract';
import { formatSTX, formatWASHA, formatBTC } from '../utils/stacks';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
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

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
};

const Analytics: React.FC = () => {
  const { proposalCount } = useDAO();
  const { poolInfo } = useSavingsSTX();
  const { totalSupply, totalBorrows, utilizationRate } = useLendingCore();
  const { price: stxPrice } = useOracle('STX-USD');
  const { price: btcPrice } = useOracle('BTC-USD');

  // Calculate TVL
  const calculateTVL = () => {
    const savingsSTX = poolInfo ? parseInt(poolInfo.value['total-stx']) : 0;
    const lendingSTX = totalSupply ? parseInt(totalSupply.value) : 0;
    const totalSTX = savingsSTX + lendingSTX;
    
    if (stxPrice) {
      const stxPriceUSD = parseInt(stxPrice.value) / 100000000;
      return (totalSTX * stxPriceUSD / 1000000).toFixed(2); // Convert from microSTX to STX then to USD
    }
    return '0';
  };

  // Mock data for charts (in production, this would come from an indexer or API)
  const mockTVLHistory = [
    { date: '2024-01', tvl: 1200000 },
    { date: '2024-02', tvl: 1450000 },
    { date: '2024-03', tvl: 1680000 },
    { date: '2024-04', tvl: 1920000 },
    { date: '2024-05', tvl: 2150000 },
    { date: '2024-06', tvl: 2380000 },
  ];

  const mockVolumeData = [
    { category: 'Savings Deposits', value: 45, color: '#3B82F6' },
    { category: 'Lending Supply', value: 30, color: '#10B981' },
    { category: 'Borrowing', value: 20, color: '#F59E0B' },
    { category: 'Governance', value: 5, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track protocol metrics, usage statistics, and market performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Value Locked"
          value={`$${calculateTVL()}`}
          change="+12.5%"
          changeType="positive"
          icon={<DollarSign size={24} />}
          loading={!stxPrice}
        />
        
        <MetricCard
          title="Active Proposals"
          value={proposalCount ? proposalCount.value : '0'}
          change="+2"
          changeType="positive"
          icon={<Target size={24} />}
          loading={!proposalCount}
        />
        
        <MetricCard
          title="Savings Pool"
          value={poolInfo ? `${formatSTX(parseInt(poolInfo.value['total-stx']))} STX` : '0 STX'}
          change="+8.3%"
          changeType="positive"
          icon={<Zap size={24} />}
          loading={!poolInfo}
        />
        
        <MetricCard
          title="Lending Utilization"
          value={utilizationRate ? `${(parseInt(utilizationRate.value) / 1e16).toFixed(1)}%` : '0%'}
          change="+2.1%"
          changeType="positive"
          icon={<Activity size={24} />}
          loading={!utilizationRate}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TVL Chart */}
        <ChartCard title="Total Value Locked Over Time">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">TVL Chart</p>
              <p className="text-sm text-gray-500 mt-2">
                Historical TVL: ${mockTVLHistory[mockTVLHistory.length - 1].tvl.toLocaleString()}
              </p>
            </div>
          </div>
        </ChartCard>

        {/* Protocol Usage */}
        <ChartCard title="Protocol Usage Distribution">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <PieChart size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Usage Distribution</p>
              <div className="mt-4 space-y-2">
                {mockVolumeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>{item.category}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Governance Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Proposals</span>
              <span className="font-medium">{proposalCount ? proposalCount.value : '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Proposals</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Participation Rate</span>
              <span className="font-medium text-success-600">78%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg. Voting Power</span>
              <span className="font-medium">1,250 WASHA</span>
            </div>
          </div>
        </div>

        {/* Savings Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Savings</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">STX Pool Size</span>
              <span className="font-medium">
                {poolInfo ? formatSTX(parseInt(poolInfo.value['total-stx'])) : '0'} STX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stacking Status</span>
              <span className={`font-medium ${
                poolInfo && poolInfo.value['stacking-enabled'] ? 'text-success-600' : 'text-gray-600'
              }`}>
                {poolInfo && poolInfo.value['stacking-enabled'] ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Est. BTC Rewards</span>
              <span className="font-medium">0.125 BTC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">sBTC Pool Size</span>
              <span className="font-medium">0 sBTC</span>
            </div>
          </div>
        </div>

        {/* Lending Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lending</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Supply</span>
              <span className="font-medium">
                {totalSupply ? formatSTX(parseInt(totalSupply.value)) : '0'} STX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Borrows</span>
              <span className="font-medium">
                {totalBorrows ? formatSTX(parseInt(totalBorrows.value)) : '0'} STX
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Utilization Rate</span>
              <span className="font-medium">
                {utilizationRate ? `${(parseInt(utilizationRate.value) / 1e16).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Borrowers</span>
              <span className="font-medium">24</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Prices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              ${stxPrice ? (parseInt(stxPrice.value) / 100000000).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-600">STX/USD</div>
            <div className="text-xs text-success-600 mt-1">+2.4%</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              ${btcPrice ? (parseInt(btcPrice.value) / 100000000).toLocaleString() : '0'}
            </div>
            <div className="text-sm text-gray-600">BTC/USD</div>
            <div className="text-xs text-success-600 mt-1">+1.8%</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">1.00</div>
            <div className="text-sm text-gray-600">sBTC/BTC</div>
            <div className="text-xs text-gray-600 mt-1">Pegged</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Protocol Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Users size={16} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New Proposal Created</p>
                <p className="text-xs text-gray-600">Proposal #5: Increase stacking rewards</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">2h ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                <Zap size={16} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Large STX Deposit</p>
                <p className="text-xs text-gray-600">50,000 STX deposited to savings pool</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">4h ago</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                <Activity size={16} className="text-warning-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Liquidation Event</p>
                <p className="text-xs text-gray-600">Position liquidated due to low health factor</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">6h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
