import React, { useState } from 'react';
import { Users, Calendar, TrendingUp, DollarSign, ArrowRight, CheckCircle, Gift } from 'lucide-react';
import { useStacks } from '../hooks/useStacks';
import { useCommunityPool } from '../hooks/useCommunityPool';
import { openContractCall } from '@stacks/connect';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import toast from 'react-hot-toast';

const CommunityPool: React.FC = () => {
  const { userData } = useStacks();
  const poolData = useCommunityPool(userData.address || undefined);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isContributing, setIsContributing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleJoinPool = async () => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsJoining(true);
    toast.loading('Opening wallet...', { id: 'join-pool' });
    
    try {
      const network = new StacksTestnet();
      
      // Call the join-pool function
      await openContractCall({
        contractAddress: 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28',
        contractName: 'community-pool',
        functionName: 'join-pool',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          console.log('Transaction:', data);
          toast.success('Successfully joined the community pool! 🎉', { id: 'join-pool' });
          setIsJoining(false);
        },
        onCancel: () => {
          toast.dismiss('join-pool');
          setIsJoining(false);
        },
      });
    } catch (error) {
      console.error('Error joining pool:', error);
      toast.error('Failed to join pool. Please try again.', { id: 'join-pool' });
      setIsJoining(false);
    }
  };

  const handleContribute = async () => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!poolData.isMember) {
      toast.error('You must join the pool first before contributing!');
      return;
    }

    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsContributing(true);
    toast.loading('Opening wallet...', { id: 'contribute' });
    
    try {
      const network = new StacksTestnet();
      
      // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
      const amountInMicroSTX = Math.floor(parseFloat(contributionAmount) * 1000000);
      
      await openContractCall({
        contractAddress: 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28',
        contractName: 'community-pool',
        functionName: 'contribute',
        functionArgs: [uintCV(amountInMicroSTX)],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          console.log('Transaction:', data);
          toast.success(`Successfully contributed ${contributionAmount} STX! 💰`, { id: 'contribute' });
          setContributionAmount('');
          setIsContributing(false);
        },
        onCancel: () => {
          toast.dismiss('contribute');
          setIsContributing(false);
        },
      });
    } catch (error) {
      console.error('Error contributing:', error);
      toast.error('Failed to contribute. Please try again.', { id: 'contribute' });
      setIsContributing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-2 mb-4">
          <Users size={24} />
          <span className="font-medium">Community Pool</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Save Together, Grow Together
        </h1>
        <p className="text-xl text-green-100 mb-6 max-w-2xl">
          Join our community pool where members contribute weekly and receive monthly distributions. 
          No minimum required - every contribution counts!
        </p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Members</span>
            <Users className="text-green-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {poolData.loading ? '...' : poolData.totalMembers}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Current Cycle</span>
            <Calendar className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            #{poolData.loading ? '...' : poolData.currentCycle}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pool Balance</span>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {poolData.loading ? '...' : (poolData.poolBalance / 1000000).toFixed(2)} STX
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Your Total</span>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {poolData.loading ? '...' : (poolData.yourTotalContributions / 1000000).toFixed(2)} STX
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Join Pool */}
        {!poolData.isMember && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Community Pool</h2>
            <p className="text-gray-700 mb-6">
              Become a member and start contributing to the community pool. There's no minimum requirement - 
              contribute what you can afford each week!
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">No minimum deposit</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Weekly contributions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Monthly distributions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-gray-700">Proportional rewards</span>
              </div>
            </div>

            <button
              onClick={handleJoinPool}
              disabled={isJoining || !userData.isSignedIn}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{isJoining ? 'Joining...' : 'Join Pool'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Contribute */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Make a Contribution</h2>
          <p className="text-gray-700 mb-6">
            Contribute STX to this week's pool. All contributions are pooled together and 
            distributed proportionally at the end of the month.
          </p>

          {!poolData.isMember && !poolData.loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                ⚠️ You must join the pool first before you can contribute!
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (STX)
            </label>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="Enter amount in STX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
              step="0.000001"
            />
            <p className="text-sm text-gray-500 mt-2">
              Minimum: 0.000001 STX (1 microSTX)
            </p>
          </div>

          <button
            onClick={handleContribute}
            disabled={isContributing || !userData.isSignedIn || !contributionAmount}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isContributing ? 'Contributing...' : 'Contribute to Pool'}
          </button>

          {!userData.isSignedIn && (
            <p className="text-sm text-orange-600 mt-4 text-center">
              Please connect your wallet to contribute
            </p>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold text-xl">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Join the Pool</h3>
            <p className="text-sm text-gray-600">
              Become a member with just one click. No fees, no minimum balance.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-xl">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Contribute Weekly</h3>
            <p className="text-sm text-gray-600">
              Add STX to the pool each week. Contribute what you can afford.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 font-bold text-xl">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Pool Grows</h3>
            <p className="text-sm text-gray-600">
              All contributions are pooled together throughout the month.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 font-bold text-xl">4</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Get Your Share</h3>
            <p className="text-sm text-gray-600">
              Receive your proportional share at the end of each month.
            </p>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">📝 Smart Contract</h3>
        <p className="text-sm text-gray-700 mb-2">
          This community pool is powered by a smart contract deployed on Stacks testnet.
        </p>
        <a
          href={`https://explorer.stacks.co/txid/f16239ef6a0c1732ccf1395222f71b16f5d990d30f2b80eb4c0db75ad81486d5?chain=testnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Contract on Explorer →
        </a>
      </div>
    </div>
  );
};

export default CommunityPool;
