import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-6">
        <AlertCircle className="h-8 w-8 text-slate-400" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 text-sm text-slate-500 max-w-md">
        The requested resource or page does not exist or may have been moved within the institution.
      </p>
      <div className="mt-8">
        <Link to="/">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
