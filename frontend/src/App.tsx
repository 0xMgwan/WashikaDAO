import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
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
const Governance = React.lazy(() => import('./pages/Governance'));
const Savings = React.lazy(() => import('./pages/Savings'));
const Lending = React.lazy(() => import('./pages/Lending'));
const Analytics = React.lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <React.Suspense 
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/lending" element={<Lending />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </React.Suspense>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
