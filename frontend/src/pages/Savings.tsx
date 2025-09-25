import React, { useState } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  Coins, 
  Bitcoin,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Zap
} from 'lucide-react';
import { useSavingsSTX } from '@/hooks/useContract';
import { useStacks } from '@/hooks/useStacks';
import { formatSTX, formatBTC, parseSTX } from '@/utils/stacks';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  poolType: 'STX' | 'sBTC';
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDeposit, poolType }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      await onDeposit(parseSTX(amount));
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Deposit {poolType}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ({poolType})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${poolType} amount`}
              className="input w-full"
              step="0.000001"
              min="0"
              required
            />
          </div>

          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-primary-600 mt-0.5" />
              <div className="text-sm text-primary-800">
                <p className="font-medium mb-1">Deposit Benefits:</p>
                <ul className="space-y-1 text-xs">
                  {poolType === 'STX' && (
                    <>
                      <li>• Earn BTC rewards through PoX stacking</li>
                      <li>• Receive proportional pool shares</li>
                      <li>• Participate in automated stacking cycles</li>
                    </>
                  )}
                  {poolType === 'sBTC' && (
                    <>
                      <li>• Earn protocol rewards in WASHA tokens</li>
                      <li>• Maintain Bitcoin exposure</li>
                      <li>• Liquid staking alternative</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className="flex-1 btn btn-primary btn-md"
            >
              {isLoading ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (shares: number) => void;
  poolType: 'STX' | 'sBTC';
  userShares: number;
  userBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onClose, 
  onWithdraw, 
  poolType, 
  userShares, 
  userBalance 
}) => {
  const [percentage, setPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!percentage || parseFloat(percentage) <= 0) return;

    setIsLoading(true);
    try {
      const sharesToWithdraw = Math.floor((userShares * parseFloat(percentage)) / 100);
      await onWithdraw(sharesToWithdraw);
      setPercentage('');
      onClose();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedAmount = percentage ? 
    (userBalance * parseFloat(percentage)) / 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Withdraw {poolType}
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-2">
              <span>Your Balance:</span>
              <span className="font-medium">{formatSTX(userBalance)} {poolType}</span>
            </div>
            <div className="flex justify-between">
              <span>Your Shares:</span>
              <span className="font-medium">{userShares.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Percentage
            </label>
            <input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Enter percentage (1-100)"
              className="input w-full"
              step="0.1"
              min="0.1"
              max="100"
              required
            />
            {percentage && (
              <p className="text-sm text-gray-600 mt-1">
                Estimated: {formatSTX(estimatedAmount)} {poolType}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setPercentage(pct.toString())}
                className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-outline btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !percentage || parseFloat(percentage) <= 0}
              className="flex-1 btn btn-primary btn-md"
            >
              {isLoading ? 'Withdrawing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Savings: React.FC = () => {
  const { userData } = useStacks();
  const { poolInfo, userShares, userSTXBalance, userPendingBTC, exchangeRate } = useSavingsSTX();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<'STX' | 'sBTC'>('STX');

  const handleDeposit = async (amount: number) => {
    try {
      console.log(`Depositing ${amount} ${selectedPool}`);
      // await depositSTX(amount) or depositsBTC(amount)
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async (shares: number) => {
    try {
      console.log(`Withdrawing ${shares} shares from ${selectedPool}`);
      // await withdrawSTX(shares) or withdrawsBTC(shares)
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const handleClaimRewards = async () => {
    try {
      console.log('Claiming BTC rewards');
      // await claimBTCRewards()
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const openDepositModal = (poolType: 'STX' | 'sBTC') => {
    setSelectedPool(poolType);
    setShowDepositModal(true);
  };

  const openWithdrawModal = (poolType: 'STX' | 'sBTC') => {
    setSelectedPool(poolType);
    setShowWithdrawModal(true);
  };

  // Calculate APY (mock calculation)
  const calculateAPY = (poolType: 'STX' | 'sBTC') => {
    if (poolType === 'STX') {
      // Estimate based on PoX rewards (roughly 6-8% annually)
      return '7.2%';
    } else {
      // sBTC pool rewards
      return '4.5%';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Savings</h1>
        <p className="text-gray-600 mt-2">
          Deposit STX or sBTC to earn rewards through PoX stacking and protocol incentives
        </p>
      </div>

      {/* User Portfolio Overview */}
      {userData.isSignedIn && (
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white p-6">
          <h2 className="text-xl font-semibold mb-4">Your Savings Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold">
                {userSTXBalance ? formatSTX(parseInt(userSTXBalance.value)) : '0'} STX
              </div>
              <div className="text-primary-200 text-sm">Total Deposited</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {userShares ? userShares.value : '0'}
              </div>
              <div className="text-primary-200 text-sm">Pool Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {userPendingBTC ? formatBTC(parseInt(userPendingBTC.value)) : '0'} BTC
              </div>
              <div className="text-primary-200 text-sm">Pending Rewards</div>
            </div>
          </div>
          
          {userPendingBTC && parseInt(userPendingBTC.value) > 0 && (
            <button
              onClick={handleClaimRewards}
              className="mt-4 bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              Claim BTC Rewards
            </button>
          )}
        </div>
      )}

      {/* Savings Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* STX Pool */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Coins className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">STX Savings</h3>
                  <p className="text-sm text-gray-600">Earn BTC through PoX stacking</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success-600">{calculateAPY('STX')}</div>
                <div className="text-sm text-gray-600">Est. APY</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total Deposited</div>
                  <div className="text-lg font-semibold">
                    {poolInfo ? formatSTX(parseInt(poolInfo.value['total-stx'])) : '0'} STX
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Stacking Status</div>
                  <div className="flex items-center space-x-1">
                    <Zap size={16} className="text-success-600" />
                    <span className="text-sm font-medium text-success-600">
                      {poolInfo && poolInfo.value['stacking-enabled'] ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Bitcoin size={16} className="text-primary-600 mt-0.5" />
                  <div className="text-sm text-primary-800">
                    <p className="font-medium">PoX Stacking Benefits:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Earn BTC rewards every cycle (~2 weeks)</li>
                      <li>• Automated stacking management</li>
                      <li>• No minimum stacking requirement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => openDepositModal('STX')}
                  className="flex-1 btn btn-primary btn-md"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowUpRight size={16} className="mr-2" />
                  Deposit STX
                </button>
                <button
                  onClick={() => openWithdrawModal('STX')}
                  className="flex-1 btn btn-outline btn-md"
                  disabled={!userData.isSignedIn || !userShares || parseInt(userShares.value) === 0}
                >
                  <ArrowDownLeft size={16} className="mr-2" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* sBTC Pool */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bitcoin className="text-yellow-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">sBTC Savings</h3>
                  <p className="text-sm text-gray-600">Earn protocol rewards</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success-600">{calculateAPY('sBTC')}</div>
                <div className="text-sm text-gray-600">Est. APY</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total Deposited</div>
                  <div className="text-lg font-semibold">0 sBTC</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Reward Token</div>
                  <div className="text-sm font-medium text-primary-600">WASHA</div>
                </div>
              </div>

              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <TrendingUp size={16} className="text-secondary-600 mt-0.5" />
                  <div className="text-sm text-secondary-800">
                    <p className="font-medium">sBTC Pool Benefits:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Maintain Bitcoin exposure</li>
                      <li>• Earn WASHA governance tokens</li>
                      <li>• Liquid Bitcoin alternative</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => openDepositModal('sBTC')}
                  className="flex-1 btn btn-primary btn-md"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowUpRight size={16} className="mr-2" />
                  Deposit sBTC
                </button>
                <button
                  onClick={() => openWithdrawModal('sBTC')}
                  className="flex-1 btn btn-outline btn-md"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowDownLeft size={16} className="mr-2" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Savings Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <PiggyBank className="text-primary-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Deposit Assets</h4>
            <p className="text-sm text-gray-600">
              Deposit STX or sBTC into the respective savings pools to start earning rewards
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="text-primary-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Automatic Stacking</h4>
            <p className="text-sm text-gray-600">
              STX deposits are automatically stacked through PoX to earn BTC rewards every cycle
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Earn Rewards</h4>
            <p className="text-sm text-gray-600">
              Claim your BTC rewards from STX stacking or WASHA tokens from sBTC deposits
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
        poolType={selectedPool}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdraw}
        poolType={selectedPool}
        userShares={userShares ? parseInt(userShares.value) : 0}
        userBalance={userSTXBalance ? parseInt(userSTXBalance.value) : 0}
      />
    </div>
  );
};

export default Savings;
