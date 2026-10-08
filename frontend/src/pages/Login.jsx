import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import AuthLayout from '../components/auth/AuthLayout';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errors.email = 'Email is required.';
    else if (!emailRegex.test(email)) errors.email = 'Please enter a valid email address.';
    if (!password) errors.password = 'Password is required.';

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Failed to login. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field) => setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to ChatApp"
      error={error}
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-accent-300 hover:text-accent-400 transition-colors">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          icon={Mail}
          error={fieldErrors.email}
        />

        <Input
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          icon={Lock}
          error={fieldErrors.password}
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full !mt-6">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
