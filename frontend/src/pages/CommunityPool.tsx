import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import { useStacks } from '../hooks/useStacks';
import { useRoscaPool } from '../hooks/useRoscaPool';
import { usePoolFactory } from '../hooks/usePoolFactory';
import { openContractCall } from '@stacks/connect';
import { PostConditionMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const CommunityPool: React.FC = () => {
  const { userData } = useStacks();
  const [searchParams] = useSearchParams();
  const poolId = searchParams.get('id');
  const { pools } = usePoolFactory();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  
  const poolData = useRoscaPool(userData.address || undefined);
  const [isJoining, setIsJoining] = useState(false);
  const [isContributing, setIsContributing] = useState(false);

  useEffect(() => {
    if (poolId && pools.length > 0) {
      const pool = pools.find(p => p.id === poolId);
      setSelectedPool(pool);
    }
  }, [poolId, pools]);

  const handleJoinPool = async () => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedPool) {
      toast.error('No pool selected');
      return;
    }

    setIsJoining(true);
    toast.loading('Opening wallet...', { id: 'join-pool' });
    
    try {
      const network = new StacksTestnet();
      const { uintCV } = await import('@stacks/transactions');
      
      // Call the pool-factory join-pool function with pool ID
      await openContractCall({
        contractAddress: 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28',
        contractName: 'pool-factory',
        functionName: 'join-pool',
        functionArgs: [uintCV(parseInt(selectedPool.id))],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          console.log('Transaction:', data);
          toast.success(`Successfully joined ${selectedPool.name}! 🎉`, { id: 'join-pool' });
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

    if (!selectedPool) {
      toast.error('No pool selected');
      return;
    }

    setIsContributing(true);
    toast.loading('Opening wallet...', { id: 'contribute' });
    
    try {
      const network = new StacksTestnet();
      const { uintCV } = await import('@stacks/transactions');
      
      // Use the selected pool's contribution amount
      const contributionAmount = selectedPool.contributionAmount;
      
      await openContractCall({
        contractAddress: 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28',
        contractName: 'rosca-pool',
        functionName: 'contribute',
        functionArgs: [uintCV(contributionAmount)],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          console.log('Transaction:', data);
          toast.success(`Successfully contributed ${(contributionAmount / 1000000).toFixed(2)} STX! 💰`, { id: 'contribute' });
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
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Users size={32} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Community Pool</h2>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          {selectedPool ? selectedPool.name : 'Save Together, Grow Together'}
        </h1>
        <p className="text-xl text-green-50">
          {selectedPool 
            ? `Contribute ${(selectedPool.contributionAmount / 1000000).toFixed(2)} STX every ${Math.floor(selectedPool.cycleBlocks / 144)} days. ${selectedPool.maxMembers} members rotating.`
            : 'Join our community pool where members contribute weekly and receive monthly distributions. No minimum required - every contribution counts!'
          }
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
            {selectedPool ? '0' : (poolData.loading ? '...' : poolData.totalMembers)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Current Round</span>
            <Calendar className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            #{selectedPool ? '0' : (poolData.loading ? '...' : poolData.currentRound)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pot Balance</span>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {selectedPool ? '0.00 STX' : (poolData.loading ? '...' : `${(poolData.poolBalance / 1000000).toFixed(2)} STX`)}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Fixed Contribution</span>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {selectedPool 
              ? `${(selectedPool.contributionAmount / 1000000).toFixed(2)} STX`
              : (poolData.loading ? '...' : `${(poolData.contributionAmount / 1000000).toFixed(2)} STX`)
            }
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Join Pool */}
        {selectedPool && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join {selectedPool.name}</h2>
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

          {selectedPool && (
            <>
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Fixed Contribution:</strong> {(selectedPool.contributionAmount / 1000000).toFixed(2)} STX
                </p>
                <p className="text-xs text-blue-600">
                  All members contribute the same amount each round for fairness.
                </p>
              </div>

              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm font-semibold mb-2">
                  ⚠️ Pool Contract Not Yet Deployed
                </p>
                <p className="text-yellow-700 text-xs">
                  This pool is registered in the factory but needs a dedicated ROSCA contract deployed. 
                  Contributions will be available once the contract is deployed. You can still join to reserve your spot!
                </p>
              </div>

              <button
                disabled={true}
                className="w-full bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold cursor-not-allowed opacity-50"
              >
                Contributions Coming Soon
              </button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Contract deployment in progress...
              </p>
            </>
          )}

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
