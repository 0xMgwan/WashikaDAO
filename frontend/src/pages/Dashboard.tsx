import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  PiggyBank, 
  CreditCard,
  Vote,
  Activity
} from 'lucide-react';
import { useGovernanceToken, useDAO, useSavingsSTX, useLendingCore, useOracle } from '@/hooks/useContract';
import { useStacks } from '@/hooks/useStacks';
import { formatSTX, formatWASHA, formatBTC } from '@/utils/stacks';

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

  const ChangeIcon = changeType === 'positive' ? TrendingUp : TrendingDown;

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
              <ChangeIcon size={16} />
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  type: 'governance' | 'savings' | 'lending';
  title: string;
  description: string;
  timestamp: string;
  amount?: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  type, 
  title, 
  description, 
  timestamp, 
  amount 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'governance':
        return <Vote size={20} className="text-primary-600" />;
      case 'savings':
        return <PiggyBank size={20} className="text-success-600" />;
      case 'lending':
        return <CreditCard size={20} className="text-warning-600" />;
      default:
        return <Activity size={20} className="text-gray-600" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          {amount && (
            <span className="text-sm font-medium text-gray-900">{amount}</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { userData } = useStacks();
  const { totalSupply } = useGovernanceToken();
  const { proposalCount } = useDAO();
  const { poolInfo } = useSavingsSTX();
  const { totalSupply: lendingSupply, totalBorrows } = useLendingCore();
  const { price: stxPrice } = useOracle('STX-USD');
  const { price: btcPrice } = useOracle('BTC-USD');

  // Mock activity data - in production, this would come from an API or indexer
  const recentActivity = [
    {
      type: 'governance' as const,
      title: 'New Proposal Created',
      description: 'Proposal #5: Increase stacking rewards distribution',
      timestamp: '2 hours ago',
    },
    {
      type: 'savings' as const,
      title: 'STX Deposited',
      description: 'Deposited to savings pool',
      timestamp: '4 hours ago',
      amount: '1,000 STX',
    },
    {
      type: 'lending' as const,
      title: 'Loan Repaid',
      description: 'Repaid STX loan with interest',
      timestamp: '6 hours ago',
      amount: '500 STX',
    },
    {
      type: 'governance' as const,
      title: 'Vote Cast',
      description: 'Voted on Proposal #4: Treasury allocation',
      timestamp: '1 day ago',
    },
  ];

  const isLoading = !totalSupply || !proposalCount || !poolInfo;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to WashikaDAO
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            A decentralized protocol built on Stacks for marginalized communities. 
            Participate in governance, earn rewards through savings, and access trustless lending.
          </p>
          {!userData.isSignedIn && (
            <div className="mt-6">
              <p className="text-primary-200 mb-4">
                Connect your wallet to start participating in the protocol.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Value Locked"
          value={poolInfo ? `${formatSTX(parseInt(poolInfo.value['total-stx']))} STX` : '0 STX'}
          change="+12.5%"
          changeType="positive"
          icon={<DollarSign size={24} />}
          loading={isLoading}
        />
        
        <StatCard
          title="Active Proposals"
          value={proposalCount ? proposalCount.value : '0'}
          icon={<Vote size={24} />}
          loading={isLoading}
        />
        
        <StatCard
          title="WASHA Supply"
          value={totalSupply ? `${formatWASHA(parseInt(totalSupply.value))}` : '0'}
          icon={<Users size={24} />}
          loading={isLoading}
        />
        
        <StatCard
          title="Lending Pool"
          value={lendingSupply ? `${formatSTX(parseInt(lendingSupply.value))} STX` : '0 STX'}
          change="+8.2%"
          changeType="positive"
          icon={<CreditCard size={24} />}
          loading={!lendingSupply}
        />
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">STX/USD</span>
              <span className="font-medium">
                {stxPrice ? `$${(parseInt(stxPrice.value) / 100000000).toFixed(2)}` : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BTC/USD</span>
              <span className="font-medium">
                {btcPrice ? `$${(parseInt(btcPrice.value) / 100000000).toLocaleString()}` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stacking Enabled</span>
              <span className="font-medium">
                {poolInfo ? (poolInfo.value['stacking-enabled'] ? 'Yes' : 'No') : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Borrows</span>
              <span className="font-medium">
                {totalBorrows ? `${formatSTX(parseInt(totalBorrows.value))} STX` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity, index) => (
            <ActivityItem
              key={index}
              type={activity.type}
              title={activity.title}
              description={activity.description}
              timestamp={activity.timestamp}
              amount={activity.amount}
            />
          ))}
        </div>
        <div className="p-4 text-center border-t border-gray-200">
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
