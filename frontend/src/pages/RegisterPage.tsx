import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { ApiClientError } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate form client-side matching backend rules
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length > 200) {
      newErrors.fullName = 'Full name must be at most 200 characters';
    }

    // Email validation
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailTrimmed.length > 254) {
      newErrors.email = 'Email must be at most 254 characters';
    }

    // Password validation: min 8 chars, max 72 UTF-8 bytes
    const utf8Bytes = new TextEncoder().encode(password).length;
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (utf8Bytes > 72) {
      newErrors.password = 'Password exceeds maximum length (72 bytes in UTF-8)';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMessage(
        'Account created successfully! Redirecting you to sign in...'
      );

      // Give the user a moment to see the success confirmation, then navigate
      setTimeout(() => {
        navigate('/login', {
          state: { registeredEmail: email.trim().toLowerCase() },
        });
      }, 1500);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.isConflict) {
          setApiError('An account with this email address already exists. Please sign in instead.');
        } else if (err.isValidationError && err.fieldErrors.length > 0) {
          const backendFieldErrors: Record<string, string> = {};
          err.fieldErrors.forEach((fe) => {
            backendFieldErrors[fe.field] = fe.message;
          });
          setErrors(backendFieldErrors);
          setApiError('Please correct the highlighted errors below.');
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Join ResourceBridge to discover and share institutional equipment
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
          {apiError && (
            <ErrorMessage
              message={apiError}
              variant="error"
              onDismiss={() => setApiError(null)}
            />
          )}

          {successMessage && (
            <ErrorMessage
              message={successMessage}
              variant="success"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
              leftIcon={<User className="h-4 w-4" />}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              maxLength={200}
            />

            <Input
              label="Campus / Academic Email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              helperText="Institutional email ensures scoped access to your campus."
              maxLength={254}
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              disabled={isSubmitting || Boolean(successMessage)}
              helperText="Min. 8 characters (max 72 bytes UTF-8)."
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              disabled={isSubmitting || Boolean(successMessage)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              disabled={isSubmitting || Boolean(successMessage)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Security assurance */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Passwords hashed with BCrypt. Credentials never stored in browser storage.</span>
        </div>
      </div>
    </div>
  );
};
