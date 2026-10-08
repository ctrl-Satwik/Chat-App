import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import AuthLayout from '../components/auth/AuthLayout';
import { User, Mail, Lock, Camera } from 'lucide-react';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName.trim()) errors.fullName = 'Name is required.';
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!emailRegex.test(email)) errors.email = 'Please enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters long.';

    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('email', email.trim());
      formData.append('password', password);
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      await register(formData);
      navigate('/chat');
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || 'Failed to create account. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field) => setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start chatting in real time"
      error={error}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-300 hover:text-accent-400 transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Profile photo picker */}
        <div className="flex items-center gap-4 pb-1">
          <label htmlFor="register-photo" className="relative group cursor-pointer rounded-full">
            <Avatar src={photoPreview} name={fullName || 'New User'} size="lg" />
            <span className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <Camera className="w-4 h-4 text-white" />
            </span>
          </label>
          <div className="min-w-0">
            <label
              htmlFor="register-photo"
              className="text-[13px] font-medium text-fg hover:text-accent-300 cursor-pointer transition-colors"
            >
              {photoPreview ? 'Change photo' : 'Upload a photo'}
            </label>
            <p className="text-xs text-fg-subtle mt-0.5">Optional · JPG or PNG</p>
          </div>
          <input id="register-photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </div>

        <Input
          label="Full name"
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearFieldError('fullName');
          }}
          icon={User}
          error={fieldErrors.fullName}
        />

        <Input
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          icon={Lock}
          error={fieldErrors.password}
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full !mt-6">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;
