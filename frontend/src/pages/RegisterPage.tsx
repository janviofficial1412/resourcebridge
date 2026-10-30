import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User as UserIcon,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RegistrationIntent } from '../features/auth/registrationIntent';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ApiClientError } from '../services/api';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationIntent, setRegistrationIntent] = useState<RegistrationIntent>('STUDENT');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const getUtf8ByteLength = (str: string): number => {
    return new TextEncoder().encode(str).length;
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      errors.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (trimmedUsername.length > 50) {
      errors.username = 'Username must be at most 50 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      errors.username = 'Username may only contain letters, numbers, underscores, hyphens, and periods';
    }

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      errors.fullName = 'Full name is required';
    } else if (trimmedFullName.length > 200) {
      errors.fullName = 'Full name must be at most 200 characters';
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    } else if (trimmedEmail.length > 254) {
      errors.email = 'Email must be at most 254 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (getUtf8ByteLength(password) > 72) {
      errors.password = 'Password must not exceed 72 bytes';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        password,
      });

      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: {
            prefilledUsername: username.trim().toLowerCase(),
            registrationIntent,
          },
        });
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          if (err.message.toLowerCase().includes('username')) {
            setFieldErrors((prev) => ({
              ...prev,
              username: 'This username is already taken. Please choose another.',
            }));
          } else if (err.message.toLowerCase().includes('email')) {
            setFieldErrors((prev) => ({
              ...prev,
              email: 'An account with this email already exists.',
            }));
          } else {
            setGeneralError(err.message);
          }
        } else if (err.status === 400 && err.fieldErrors) {
          const apiFieldMap: Record<string, string> = {};
          err.fieldErrors.forEach((fe) => {
            apiFieldMap[fe.field] = fe.message;
          });
          setFieldErrors(apiFieldMap);
        } else {
          setGeneralError(err.message || 'Registration failed. Please try again.');
        }
      } else {
        setGeneralError('Network error. Unable to contact registration service.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-[1.75rem] border border-[#e7e5df] bg-white p-6 shadow-[0_24px_70px_-45px_rgba(27,56,42,0.35)] sm:p-9">
        <div className="space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-50 text-brand-600 mb-2">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Join ResourceBridge to share and discover university facilities
          </p>
        </div>

        {registrationSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">Account created successfully!</p>
              <p className="text-emerald-700 text-xs">Redirecting to login...</p>
            </div>
          </div>
        )}

        {generalError && (
          <ErrorMessage
            variant="error"
            message={generalError}
            onDismiss={() => setGeneralError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-800">How will you use ResourceBridge?</legend>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
              registrationIntent === 'STUDENT'
                ? 'border-brand-500 bg-brand-50/60'
                : 'border-slate-200 hover:border-brand-200'
            }`}>
              <input
                type="radio"
                name="registrationIntent"
                value="STUDENT"
                checked={registrationIntent === 'STUDENT'}
                onChange={() => setRegistrationIntent('STUDENT')}
                className="mt-1 accent-brand-700"
              />
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-slate-900">General user (Student)</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  Find an institution and request membership to discover and book resources.
                </span>
              </span>
            </label>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
              registrationIntent === 'ADMIN'
                ? 'border-brand-500 bg-brand-50/60'
                : 'border-slate-200 hover:border-brand-200'
            }`}>
              <input
                type="radio"
                name="registrationIntent"
                value="ADMIN"
                checked={registrationIntent === 'ADMIN'}
                onChange={() => setRegistrationIntent('ADMIN')}
                className="mt-1 accent-brand-700"
              />
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-slate-900">Institution Administrator</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  Create an institution to become its initial administrator. This choice grants no access by itself.
                </span>
              </span>
            </label>
          </fieldset>

          <Input
            id="reg-username"
            name="username"
            type="text"
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: '' }));
              }
            }}
            placeholder="e.g. scholar_jane"
            required
            error={fieldErrors.username}
            helperText="3-50 characters. Letters, numbers, hyphens, and periods."
            leftIcon={<UserIcon className="h-4 w-4" />}
          />

          <Input
            id="reg-fullname"
            name="fullName"
            type="text"
            label="Full Name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) {
                setFieldErrors((prev) => ({ ...prev, fullName: '' }));
              }
            }}
            placeholder="e.g. Dr. Jane Doe"
            required
            error={fieldErrors.fullName}
            leftIcon={<UserIcon className="h-4 w-4" />}
          />

          <Input
            id="reg-email"
            name="email"
            type="email"
            label="Email Address (Optional)"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            placeholder="e.g. jane@university.edu"
            error={fieldErrors.email}
            helperText="Optional for account recovery and notifications."
            leftIcon={<Mail className="h-4 w-4" />}
          />

          <Input
            id="reg-password"
            name="password"
            type="password"
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: '' }));
              }
            }}
            placeholder="••••••••"
            required
            error={fieldErrors.password}
            helperText="Use at least 8 characters."
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Input
            id="reg-confirm-password"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            placeholder="••••••••"
            required
            error={fieldErrors.confirmPassword}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            size="md"
            isLoading={isSubmitting}
            disabled={registrationSuccess}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already have an account?</span>
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign In
          </Link>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your sign-in details are handled securely.</span>
        </div>
        </div>
      </div>
    </div>
  );
};
