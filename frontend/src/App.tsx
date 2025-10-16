import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    },
  },
});

// Lazy load pages for better performance
const Landing = React.lazy(() => import('./pages/Landing'));
const PoolSelection = React.lazy(() => import('./pages/PoolSelection'));
const Governance = React.lazy(() => import('./pages/Governance'));
const Savings = React.lazy(() => import('./pages/Savings'));
const CommunityPool = React.lazy(() => import('./pages/CommunityPool'));
const Profile = React.lazy(() => import('./pages/Profile'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '10px',
              padding: '16px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Layout>
          <React.Suspense 
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pools" element={<PoolSelection />} />
              <Route path="/community-pool" element={<CommunityPool />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/savings" element={<Savings />} />
            </Routes>
          </React.Suspense>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
