import React, { useState } from 'react';
import { User, Mail, MapPin, Edit2, Save, X } from 'lucide-react';
import { useStacks } from '../hooks/useStacks';
import { useCommunityPool } from '../hooks/useCommunityPool';
import { useSavingsSTX } from '../hooks/useContract';
import { formatSTX, extractClarityValue } from '../utils/stacks';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { userData } = useStacks();
  const poolData = useCommunityPool(userData.address || undefined);
  const savingsData = useSavingsSTX(userData.address || undefined);
  
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Community Member',
    email: '',
    location: '',
    bio: '',
  });

  const handleSave = () => {
    // In a real app, this would save to a database or IPFS
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!userData.isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-purple-100">Manage your WashikaDAO profile and settings</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-colors"
            >
              <Edit2 size={20} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg transition-colors"
              >
                <Save size={20} />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg transition-colors"
              >
                <X size={20} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <p className="text-gray-600 font-mono text-sm break-all">
                  {userData.address}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Email (Optional)
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                ) : (
                  <p className="text-gray-900">{profile.email || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline mr-2" size={16} />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-gray-900">{profile.location || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.bio || 'No bio yet'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Pool Stats */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pool Activity</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Member Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {poolData.loading || savingsData.isLoading ? '...' : 
                   (poolData.isMember || (savingsData.userShares && Number(extractClarityValue(savingsData.userShares) || 0) > 0)) ? 
                   '✅ Active Member' : '❌ Not a Member'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
                <p className="text-2xl font-bold text-green-600">
                  {poolData.loading || savingsData.isLoading ? '...' : 
                   ((poolData.yourTotalContributions / 1000000) + 
                    (savingsData.userSTXBalance ? Number(extractClarityValue(savingsData.userSTXBalance) || 0) / 1000000 : 0)).toFixed(2)} STX
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Savings Pool</p>
                <p className="text-lg font-bold text-blue-600">
                  {savingsData.isLoading ? '...' : 
                   (savingsData.userSTXBalance ? formatSTX(Number(extractClarityValue(savingsData.userSTXBalance) || 0)) : '0.00')} STX
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Current Cycle</p>
                <p className="text-lg font-bold text-gray-900">
                  #{poolData.loading ? '...' : poolData.currentCycle}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/community-pool'}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Pool
              </button>
              
              <button
                onClick={() => window.location.href = '/governance'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Governance
              </button>
              
              <button
                onClick={() => window.location.href = '/savings'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Savings Pools
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
