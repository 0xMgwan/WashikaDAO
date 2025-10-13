import React, { useState } from 'react';
import { X, AlertCircle, Users, DollarSign } from 'lucide-react';
import { useStacks } from '@/hooks/useStacks';
import { openContractCall } from '@stacks/connect';
import { stringUtf8CV, stringAsciiCV, uintCV, someCV, noneCV, principalCV } from '@stacks/transactions';
import { CONTRACT_ADDRESS, network } from '@/utils/stacks';
import toast from 'react-hot-toast';

interface ProposalType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { userData } = useStacks();
  const [isLoading, setIsLoading] = useState(false);
  
  const proposalTypes: ProposalType[] = [
    {
      id: 'fund-allocation',
      title: 'Fund Allocation',
      description: 'Allocate funds from the pool treasury for community projects',
      icon: <DollarSign size={20} className="text-green-600" />
    },
    {
      id: 'pool-parameters',
      title: 'Pool Parameters',
      description: 'Change pool settings like interest rates, fees, or membership rules',
      icon: <Users size={20} className="text-blue-600" />
    },
    {
      id: 'general',
      title: 'General Proposal',
      description: 'Any other proposal for the community to vote on',
      icon: <AlertCircle size={20} className="text-purple-600" />
    }
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    amount: '',
    recipient: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 256) {
      newErrors.title = 'Title must be 256 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1024) {
      newErrors.description = 'Description must be 1024 characters or less';
    }

    if (!formData.type) {
      newErrors.type = 'Please select a proposal type';
    }

    if (formData.type === 'fund-allocation') {
      if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
      if (!formData.recipient.trim()) {
        newErrors.recipient = 'Please enter a recipient address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    // Check if wallet is connected
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet first');
      return;
    }

    console.log('Wallet data:', userData);

    try {
      console.log('Creating proposal on blockchain...', {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        amount: formData.amount,
        recipient: formData.recipient,
        userAddress: userData.address
      });

      setIsLoading(true);
      
      // Create proposal on blockchain using deployed simple-governance contract
      const amount = formData.amount ? Math.floor(Number(formData.amount) * 1000000) : 0;
      
      // Prepare function arguments - match contract signature exactly
      const functionArgs = [
        stringUtf8CV(formData.title),
        stringUtf8CV(formData.description),
        stringAsciiCV(formData.type || 'general'), // Ensure we have a valid type
        uintCV(amount),
        formData.recipient ? someCV(principalCV(formData.recipient)) : noneCV()
      ];
      
      console.log('Function arguments prepared:', {
        title: formData.title,
        description: formData.description,
        type: formData.type || 'general',
        amount: amount,
        recipient: formData.recipient || 'none'
      });
      
      console.log('Opening contract call with args:', {
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'simple-governance',
        functionName: 'create-proposal',
        functionArgs,
        network
      });
      
      // Use openContractCall directly to ensure wallet popup
      await new Promise((resolve, reject) => {
        openContractCall({
          contractAddress: CONTRACT_ADDRESS,
          contractName: 'simple-governance',
          functionName: 'create-proposal',
          functionArgs,
          network,
          onFinish: (data) => {
            console.log('Transaction completed:', data);
            resolve(data);
          },
          onCancel: () => {
            console.log('Transaction cancelled by user');
            reject(new Error('Transaction cancelled'));
          },
        });
      });

      toast.success('Proposal created successfully! Check your wallet for transaction confirmation.');
      onClose();
      // Wait a bit for transaction to be processed before refreshing
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        amount: '',
        recipient: ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Failed to create proposal:', error);
      if (error instanceof Error) {
        if (error.message === 'Transaction cancelled') {
          toast.error('Transaction was cancelled');
        } else {
          toast.error(`Failed to create proposal: ${error.message}`);
        }
      } else {
        toast.error('Failed to create proposal. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Proposal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Proposal Type *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {proposalTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {type.icon}
                    <div>
                      <h4 className="font-medium text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.type}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter a clear, descriptive title for your proposal"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide a detailed description of what this proposal aims to achieve..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Fund Allocation Fields */}
          {formData.type === 'fund-allocation' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (STX) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.000000"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address *
                  </label>
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.recipient ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                  />
                  {errors.recipient && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle size={16} className="mr-1" />
                      {errors.recipient}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Proposal Requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li>• You must be a member of a pool to create proposals</li>
                  <li>• Proposals have a 3-day voting period</li>
                  <li>• All pool members can vote using their STX balance</li>
                  <li>• Successful proposals require majority approval</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !userData.isSignedIn}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProposalModal;
