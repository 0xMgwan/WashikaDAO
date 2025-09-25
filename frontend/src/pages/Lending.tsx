import React, { useState } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  DollarSign
} from 'lucide-react';
import { useLendingCore } from '../hooks/useContract';
import { useStacks } from '../hooks/useStacks';
import { formatSTX, parseSTX } from '../utils/stacks';

interface LendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  type: 'supply' | 'borrow' | 'repay';
  asset: 'STX' | 'sBTC';
  maxAmount?: number;
}

const LendingModal: React.FC<LendingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  type, 
  asset, 
  maxAmount 
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      await onSubmit(parseSTX(amount));
      setAmount('');
      onClose();
    } catch (error) {
      console.error(`${type} failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'supply': return `Supply ${asset}`;
      case 'borrow': return `Borrow ${asset}`;
      case 'repay': return `Repay ${asset}`;
      default: return '';
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      switch (type) {
        case 'supply': return 'Supplying...';
        case 'borrow': return 'Borrowing...';
        case 'repay': return 'Repaying...';
        default: return 'Processing...';
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {getTitle()}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ({asset})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${asset} amount`}
              className="input w-full"
              step="0.000001"
              min="0"
              max={maxAmount ? formatSTX(maxAmount) : undefined}
              required
            />
            {maxAmount && (
              <p className="text-sm text-gray-600 mt-1">
                Max: {formatSTX(maxAmount)} {asset}
              </p>
            )}
          </div>

          <div className={`rounded-lg p-4 ${
            type === 'borrow' ? 'bg-warning-50' : 'bg-primary-50'
          }`}>
            <div className="flex items-start space-x-2">
              <Info size={16} className={`mt-0.5 ${
                type === 'borrow' ? 'text-warning-600' : 'text-primary-600'
              }`} />
              <div className={`text-sm ${
                type === 'borrow' ? 'text-warning-800' : 'text-primary-800'
              }`}>
                {type === 'supply' && (
                  <>
                    <p className="font-medium mb-1">Supply Benefits:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Earn interest on your deposits</li>
                      <li>• Use as collateral for borrowing</li>
                      <li>• Withdraw anytime (subject to utilization)</li>
                    </ul>
                  </>
                )}
                {type === 'borrow' && (
                  <>
                    <p className="font-medium mb-1">Borrowing Risks:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Interest accrues over time</li>
                      <li>• Risk of liquidation if collateral drops</li>
                      <li>• Maintain healthy collateral ratio</li>
                    </ul>
                  </>
                )}
                {type === 'repay' && (
                  <>
                    <p className="font-medium mb-1">Repayment:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Reduces your debt and interest</li>
                      <li>• Improves your health factor</li>
                      <li>• Frees up collateral</li>
                    </ul>
                  </>
                )}
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
              {getButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Lending: React.FC = () => {
  const { userData } = useStacks();
  const { 
    accountLiquidity, 
    supplyBalance, 
    borrowBalance, 
    supplyRate, 
    borrowRate, 
    utilizationRate,
    totalSupply,
    totalBorrows
  } = useLendingCore();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'supply' | 'borrow' | 'repay'>('supply');
  const [selectedAsset, setSelectedAsset] = useState<'STX' | 'sBTC'>('STX');

  const handleLendingAction = async (amount: number) => {
    try {
      console.log(`${modalType} ${amount} ${selectedAsset}`);
      // Implement actual contract calls here
    } catch (error) {
      console.error('Lending action failed:', error);
    }
  };

  const openModal = (type: 'supply' | 'borrow' | 'repay', asset: 'STX' | 'sBTC') => {
    setModalType(type);
    setSelectedAsset(asset);
    setShowModal(true);
  };

  // Calculate health factor (simplified)
  const calculateHealthFactor = () => {
    if (!accountLiquidity) return 0;
    const liquidity = parseInt(accountLiquidity.value?.liquidity || '0');
    const shortfall = parseInt(accountLiquidity.value?.shortfall || '0');
    
    if (shortfall > 0) return 0; // Liquidatable
    if (liquidity === 0 && shortfall === 0) return 1; // No position
    return liquidity / (liquidity + shortfall) * 2; // Simplified calculation
  };

  const healthFactor = calculateHealthFactor();
  const getHealthColor = (factor: number) => {
    if (factor >= 1.5) return 'text-success-600';
    if (factor >= 1.2) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lending</h1>
        <p className="text-gray-600 mt-2">
          Supply assets to earn interest or borrow against your collateral
        </p>
      </div>

      {/* User Position Overview */}
      {userData.isSignedIn && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Position</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {supplyBalance ? formatSTX(parseInt(supplyBalance.value)) : '0'} STX
              </div>
              <div className="text-sm text-gray-600">Total Supplied</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {borrowBalance ? formatSTX(parseInt(borrowBalance.value)) : '0'} STX
              </div>
              <div className="text-sm text-gray-600">Total Borrowed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {accountLiquidity ? formatSTX(parseInt(accountLiquidity.value?.liquidity || '0')) : '0'} STX
              </div>
              <div className="text-sm text-gray-600">Available to Borrow</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getHealthColor(healthFactor)}`}>
                {healthFactor.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Health Factor</div>
            </div>
          </div>

          {healthFactor < 1.2 && healthFactor > 0 && (
            <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={20} className="text-warning-600" />
                <div>
                  <p className="text-warning-800 font-medium">Low Health Factor Warning</p>
                  <p className="text-warning-700 text-sm">
                    Your position is at risk of liquidation. Consider repaying debt or adding collateral.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Supply</h3>
            <DollarSign className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalSupply ? formatSTX(parseInt(totalSupply.value)) : '0'} STX
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Borrows</h3>
            <CreditCard className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalBorrows ? formatSTX(parseInt(totalBorrows.value)) : '0'} STX
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Supply APY</h3>
            <TrendingUp className="text-success-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-success-600">
            {supplyRate ? `${(parseInt(supplyRate.value) / 1e16).toFixed(2)}%` : '0.00%'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Borrow APY</h3>
            <TrendingUp className="text-error-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-error-600">
            {borrowRate ? `${(parseInt(borrowRate.value) / 1e16).toFixed(2)}%` : '0.00%'}
          </p>
        </div>
      </div>

      {/* Markets */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Markets</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* STX Market */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">STX</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Stacks</h3>
                  <p className="text-sm text-gray-600">Native Stacks token</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Supply APY</div>
                  <div className="text-lg font-semibold text-success-600">
                    {supplyRate ? `${(parseInt(supplyRate.value) / 1e16).toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Borrow APY</div>
                  <div className="text-lg font-semibold text-error-600">
                    {borrowRate ? `${(parseInt(borrowRate.value) / 1e16).toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Utilization Rate</div>
                <div className="text-lg font-semibold text-gray-900">
                  {utilizationRate ? `${(parseInt(utilizationRate.value) / 1e16).toFixed(2)}%` : '0.00%'}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openModal('supply', 'STX')}
                  className="flex-1 btn btn-primary btn-sm"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowUpRight size={16} className="mr-1" />
                  Supply
                </button>
                <button
                  onClick={() => openModal('borrow', 'STX')}
                  className="flex-1 btn btn-outline btn-sm"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowDownLeft size={16} className="mr-1" />
                  Borrow
                </button>
                <button
                  onClick={() => openModal('repay', 'STX')}
                  className="flex-1 btn btn-ghost btn-sm"
                  disabled={!userData.isSignedIn || !borrowBalance || parseInt(borrowBalance.value) === 0}
                >
                  Repay
                </button>
              </div>
            </div>
          </div>

          {/* sBTC Market */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">₿</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">sBTC</h3>
                  <p className="text-sm text-gray-600">Synthetic Bitcoin</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Supply APY</div>
                  <div className="text-lg font-semibold text-success-600">3.2%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Borrow APY</div>
                  <div className="text-lg font-semibold text-error-600">5.8%</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Utilization Rate</div>
                <div className="text-lg font-semibold text-gray-900">45.2%</div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openModal('supply', 'sBTC')}
                  className="flex-1 btn btn-primary btn-sm"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowUpRight size={16} className="mr-1" />
                  Supply
                </button>
                <button
                  onClick={() => openModal('borrow', 'sBTC')}
                  className="flex-1 btn btn-outline btn-sm"
                  disabled={!userData.isSignedIn}
                >
                  <ArrowDownLeft size={16} className="mr-1" />
                  Borrow
                </button>
                <button
                  onClick={() => openModal('repay', 'sBTC')}
                  className="flex-1 btn btn-ghost btn-sm"
                  disabled={!userData.isSignedIn}
                >
                  Repay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="text-primary-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Collateralization</h4>
            <p className="text-sm text-gray-600">
              All loans are overcollateralized to protect lenders and maintain protocol stability
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="text-warning-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Liquidation Risk</h4>
            <p className="text-sm text-gray-600">
              Monitor your health factor to avoid liquidation. Maintain above 1.2 for safety
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="text-success-600" size={24} />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Dynamic Rates</h4>
            <p className="text-sm text-gray-600">
              Interest rates adjust automatically based on supply and demand in each market
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <LendingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleLendingAction}
        type={modalType}
        asset={selectedAsset}
        maxAmount={modalType === 'repay' && borrowBalance ? parseInt(borrowBalance.value) : undefined}
      />
    </div>
  );
};

export default Lending;
