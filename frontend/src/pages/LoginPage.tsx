import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User as UserIcon, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ApiClientError } from '../services/api';
import { SessionEstablishmentError } from '../features/auth/authSession';
import { getPostRegistrationDestination, RegistrationIntent } from '../features/auth/registrationIntent';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const registrationFlow = location.state as {
    from?: { pathname: string };
    prefilledUsername?: string;
    registrationIntent?: RegistrationIntent;
  } | null;
  const [username, setUsername] = useState(registrationFlow?.prefilledUsername ?? '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const from = registrationFlow?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setGeneralError('Please enter your username');
      return;
    }
    if (!password) {
      setGeneralError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username: trimmedUsername, password });
      if (registrationFlow?.registrationIntent) {
        const destination = getPostRegistrationDestination(registrationFlow.registrationIntent);
        navigate(destination.path, { replace: true, state: destination.state });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof SessionEstablishmentError) {
        setGeneralError(err.message);
      } else if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setGeneralError('Invalid username or password. Please verify your credentials.');
        } else if (err.status === 403) {
          setGeneralError('We could not verify your sign-in request. Please refresh the page and try again.');
        } else {
          setGeneralError(err.message || 'An unexpected error occurred during login.');
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Unable to connect to the authentication service. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-[1.75rem] border border-[#e7e5df] bg-white p-6 shadow-[0_24px_70px_-45px_rgba(27,56,42,0.35)] sm:p-9">
        <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-50 text-brand-600 mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to ResourceBridge</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Access your university research resources and equipment
          </p>
        </div>

        {generalError && (
          <ErrorMessage
            variant="error"
            message={generalError}
            onDismiss={() => setGeneralError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="login-username"
            name="username"
            type="text"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. scholar_jane"
            required
            autoComplete="username"
            leftIcon={<UserIcon className="h-4 w-4" />}
          />

          <Input
            id="login-password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Don't have an account?</span>
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your account is protected with secure sign-in.</span>
        </div>
        </div>
      </div>
    </div>
  );
};
