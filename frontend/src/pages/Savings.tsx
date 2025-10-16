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
import { useSavingsSTX, useContractCall } from '@/hooks/useContract';
import { useStacks } from '@/hooks/useStacks';
import { formatSTX, formatBTC, parseSTX, extractClarityValue } from '@/utils/stacks';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDeposit }) => {
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
          Deposit STX
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (STX)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter STX amount"
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
                  <li>• Earn BTC rewards through PoX stacking</li>
                  <li>• Receive proportional pool shares</li>
                  <li>• Participate in automated stacking cycles</li>
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
  userShares: number;
  userBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  isOpen, 
  onClose, 
  onWithdraw, 
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
          Withdraw STX
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-2">
              <span>Your Balance:</span>
              <span className="font-medium">{formatSTX(userBalance)} STX</span>
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
                Estimated: {formatSTX(estimatedAmount)} STX
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
  const { poolInfo, userShares, userSTXBalance, userPendingBTC } = useSavingsSTX();
  const queryClient = useQueryClient();
  const contractCall = useContractCall();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleDeposit = async (amount: number) => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet to deposit');
      return;
    }

    try {
      await contractCall.mutateAsync({
        contractName: 'savings-stx-v4',
        functionName: 'deposit-stx',
        functionArgs: [uintCV(amount)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow
      });

      toast.success('STX deposited successfully!');
      // Refresh all savings-related data
      queryClient.invalidateQueries(['savings-stx']);
      queryClient.refetchQueries(['savings-stx']);
      setShowDepositModal(false);
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error('Failed to deposit STX. Please try again.');
    }
  };

  const handleWithdraw = async (shares: number) => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet to withdraw');
      return;
    }

    try {
      await contractCall.mutateAsync({
        contractName: 'savings-stx-v4',
        functionName: 'withdraw-stx',
        functionArgs: [uintCV(shares)],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow
      });

      toast.success('STX withdrawn successfully!');
      queryClient.invalidateQueries(['savings-stx']);
      setShowWithdrawModal(false);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Failed to withdraw STX. Please try again.');
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

  const openDepositModal = () => {
    setShowDepositModal(true);
  };

  const openWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  // Calculate STX APY
  const calculateSTXAPY = () => {
    // Estimate based on PoX rewards (roughly 6-8% annually)
    return '7.2%';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Savings</h1>
        <p className="text-gray-600 mt-2">
          Deposit STX to earn BTC rewards through PoX stacking
        </p>
      </div>

      {/* User Portfolio Overview */}
      {userData.isSignedIn && (
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white p-6">
          <h2 className="text-xl font-semibold mb-4">Your Savings Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold">
                {userSTXBalance ? formatSTX(Number(extractClarityValue(userSTXBalance) || 0)) : '0'} STX
              </div>
              <div className="text-primary-200 text-sm">Total Deposited</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {userShares ? String(extractClarityValue(userShares) || '0') : '0'}
              </div>
              <div className="text-primary-200 text-sm">Pool Shares</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {userPendingBTC ? formatBTC(Number(extractClarityValue(userPendingBTC) || 0)) : '0'} BTC
              </div>
              <div className="text-primary-200 text-sm">Pending Rewards</div>
            </div>
          </div>
          
          {userPendingBTC && (extractClarityValue(userPendingBTC) || 0) > 0 && (
            <button
              onClick={handleClaimRewards}
              className="mt-4 bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              Claim BTC Rewards
            </button>
          )}
        </div>
      )}

      {/* STX Savings Pool */}
      <div className="max-w-4xl mx-auto">
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
                <div className="text-2xl font-bold text-success-600">{calculateSTXAPY()}</div>
                <div className="text-sm text-gray-600">Est. APY</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total Deposited</div>
                  <div className="text-lg font-semibold">
                    {poolInfo && (poolInfo as any).data ? formatSTX(Number(extractClarityValue((poolInfo as any).data['total-stx']) || 0)) : '0'} STX
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Stacking Status</div>
                  <div className="flex items-center space-x-1">
                    <Zap size={16} className="text-success-600" />
                    <span className="text-sm font-medium text-success-600">
                      {poolInfo && (poolInfo as any).data && extractClarityValue((poolInfo as any).data['stacking-enabled']) ? 'Active' : 'Inactive'}
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
                  onClick={openDepositModal}
                  className="flex-1 btn btn-primary btn-md"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowUpRight size={16} className="mr-2" />
                  Deposit STX
                </button>
                <button
                  onClick={openWithdrawModal}
                  className="flex-1 btn btn-outline btn-md"
                  disabled={!userData.isSignedIn || !userShares || Number(extractClarityValue(userShares) || 0) === 0}
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
            <h4 className="font-medium text-gray-900 mb-2">Deposit STX</h4>
            <p className="text-sm text-gray-600">
              Deposit STX into the savings pool to start earning BTC rewards through PoX stacking
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
            <h4 className="font-medium text-gray-900 mb-2">Earn BTC Rewards</h4>
            <p className="text-sm text-gray-600">
              Claim your BTC rewards earned from STX stacking every ~2 weeks
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDeposit}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdraw={handleWithdraw}
        userShares={userShares ? Number(extractClarityValue(userShares) || 0) : 0}
        userBalance={userSTXBalance ? Number(extractClarityValue(userSTXBalance) || 0) : 0}
      />
    </div>
  );
};

export default Savings;
