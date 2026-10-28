import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        
        {/* Placeholder / early preview routes to be wired in subsequent phases */}
        <Route 
          path="discover" 
          element={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Resource Discovery</h1>
              <p className="mt-2 text-sm text-slate-500">
                Resource catalog and category filtering will be connected in Phase 6.
              </p>
            </div>
          } 
        />
        <Route 
          path="institutions" 
          element={
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Partner Institutions</h1>
              <p className="mt-2 text-sm text-slate-500">
                Institution directory and membership status will be connected in Phase 4.
              </p>
            </div>
          } 
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
