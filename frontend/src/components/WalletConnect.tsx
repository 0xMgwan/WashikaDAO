import React from 'react';
import { Wallet, LogOut, User } from 'lucide-react';
import { connectWallet, disconnectWallet, formatSTX } from '@/utils/stacks';
import { useStacks } from '@/hooks/useStacks';
import { useGovernanceToken } from '@/hooks/useContract';

const WalletConnect: React.FC = () => {
  const { userData, isLoading } = useStacks();
  const { balance, currentVotes } = useGovernanceToken();

  const handleConnect = () => {
    connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-300 h-10 w-32 rounded-lg"></div>
      </div>
    );
  }

  if (!userData.isSignedIn) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
      >
        <Wallet size={20} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Wallet Info */}
      <div className="hidden md:flex flex-col items-end text-sm">
        <div className="flex items-center space-x-2 text-gray-700">
          <User size={16} />
          <span className="font-mono">{truncateAddress(userData.address!)}</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {balance && (
            <span>
              {formatSTX(parseInt(balance.value))} WASHA
            </span>
          )}
          {currentVotes && (
            <span>
              {formatSTX(parseInt(currentVotes.value))} Votes
            </span>
          )}
        </div>
      </div>

      {/* Mobile wallet info */}
      <div className="md:hidden">
        <div className="text-sm font-mono text-gray-700">
          {truncateAddress(userData.address!)}
        </div>
      </div>

      {/* Disconnect button */}
      <button
        onClick={handleDisconnect}
        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors duration-200"
        title="Disconnect Wallet"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Disconnect</span>
      </button>
    </div>
  );
};

export default WalletConnect;
