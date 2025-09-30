import React, { useState } from 'react';
import { Plus, Users, Calendar, DollarSign, ArrowRight, Search, Share2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStacks } from '../hooks/useStacks';
import { usePoolFactory } from '../hooks/usePoolFactory';
import { openContractCall } from '@stacks/connect';
import { stringUtf8CV, uintCV, stringAsciiCV, PostConditionMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import toast from 'react-hot-toast';

const PoolSelection: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useStacks();
  const { pools, loading } = usePoolFactory();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPools = pools.filter(pool =>
    pool.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSharePool = (pool: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const poolUrl = `${window.location.origin}/pools?pool=${pool.id}`;
    navigator.clipboard.writeText(poolUrl);
    toast.success('Pool link copied to clipboard! 📋');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">Community Pools</h1>
        <p className="text-xl text-purple-100 mb-6">
          Join an existing pool or create your own community savings circle
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
          >
            <Plus size={20} />
            <span>Create New Pool</span>
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300" size={20} />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      {/* Pools Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading pools...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <div
              key={pool.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/community-pool?id=${pool.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{pool.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleSharePool(pool, e)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Share pool"
                  >
                    <Share2 size={18} className="text-purple-600" />
                  </button>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Active
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Users size={16} />
                    <span>Max Members</span>
                  </span>
                  <span className="font-semibold text-gray-900">{pool.maxMembers}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <DollarSign size={16} />
                    <span>Contribution</span>
                  </span>
                  <span className="font-semibold text-gray-900">{(pool.contributionAmount / 1000000).toFixed(2)} STX</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Cycle</span>
                  </span>
                  <span className="font-semibold text-gray-900">{Math.floor(pool.cycleBlocks / 144)} days</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Creator</span>
                  <span className="font-semibold text-gray-900 font-mono text-xs">{pool.creator.slice(0, 8)}...</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/community-pool?id=${pool.id}`);
                  }}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>View Pool</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredPools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No pools found matching your search.</p>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <CreatePoolModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh page to show new pool
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }}
        />
      )}
    </div>
  );
};

interface CreatePoolModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '10',
    cycleDays: '7',
    maxMembers: '10',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.loading('Registering pool...', { id: 'create-pool' });
    
    try {
      const network = new StacksTestnet();
      
      // Convert days to blocks (approx 144 blocks per day)
      const cycleBlocks = parseInt(formData.cycleDays) * 144;
      const contributionMicroSTX = Math.floor(parseFloat(formData.contributionAmount) * 1000000);
      
      await openContractCall({
        contractAddress: 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28',
        contractName: 'pool-factory',
        functionName: 'register-pool',
        functionArgs: [
          stringUtf8CV(formData.name),
          uintCV(contributionMicroSTX),
          uintCV(cycleBlocks),
          uintCV(parseInt(formData.maxMembers)),
          stringAsciiCV(`pool-${Date.now()}`), // Unique contract ID
        ],
        postConditionMode: PostConditionMode.Allow,
        network,
        onFinish: (data) => {
          console.log('Pool registered:', data);
          toast.success('Pool created successfully! 🎉', { id: 'create-pool' });
          onSuccess();
        },
        onCancel: () => {
          toast.dismiss('create-pool');
        },
      });
    } catch (error) {
      console.error('Error creating pool:', error);
      toast.error('Failed to create pool', { id: 'create-pool' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Pool</h2>
          <p className="text-gray-600 mt-1">Set up your community savings circle</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pool Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Village Savings Group"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Amount (STX) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={formData.contributionAmount}
                onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Length (days) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.cycleDays}
                onChange={(e) => setFormData({ ...formData, cycleDays: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Members *
            </label>
            <input
              type="number"
              required
              min="2"
              value={formData.maxMembers}
              onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Number of rounds before the cycle repeats
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell others about your pool..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Pool Summary</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each member contributes {formData.contributionAmount} STX per round</li>
              <li>• One member receives the full pot every {formData.cycleDays} days</li>
              <li>• Pool completes after {formData.maxMembers} rounds</li>
              <li>• Total pot per round: {parseFloat(formData.contributionAmount) * parseInt(formData.maxMembers)} STX</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Create Pool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoolSelection;
