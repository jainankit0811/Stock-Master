import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';
import toast from 'react-hot-toast';
import TextInput from '../components/form/TextInput';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [email, setEmail] = useState('');
  const [resetData, setResetData] = useState({
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPassword({ email });
      if (result.success) {
        setStep('reset');
        toast.success('OTP has been sent to your email!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate OTP
    if (!resetData.otp || resetData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    // Validate password
    if (resetData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[a-z]/.test(resetData.password)) {
      toast.error('Password must contain a lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(resetData.password)) {
      toast.error('Password must contain an uppercase letter');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(resetData.password)) {
      toast.error('Password must contain a special character');
      return;
    }
    if (resetData.password !== resetData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        email,
        otp: resetData.otp,
        password: resetData.password
      });
      if (result.success) {
        // Store token and user for automatic login
        const { user, token } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        toast.success('Password reset successfully! Redirecting to dashboard...');
        // Force page reload to update AuthContext
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    // Reset password form with OTP
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Enter the OTP sent to your email and your new password
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="rounded-card shadow-sm bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={resetData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setResetData({ ...resetData, otp: value });
                  }}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent border-gray-300 dark:border-gray-600 text-center text-2xl font-mono tracking-widest"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Check your email for the 6-digit OTP
                </p>
              </div>
              <TextInput
                label="New Password"
                name="password"
                type="password"
                value={resetData.password}
                onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                required
                placeholder="Min 8 chars, uppercase, lowercase, special char"
              />
              <TextInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                required
                placeholder="Confirm your password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Resetting...' : 'RESET PASSWORD'}
              </button>
              <div className="mt-4 text-center text-sm space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setResetData({ otp: '', password: '', confirmPassword: '' });
                    setOtpReceived('');
                  }}
                  className="text-brand-primary hover:underline"
                >
                  Back
                </button>
                <span className="text-gray-500 dark:text-gray-400">|</span>
                <Link to="/login" className="text-brand-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Forgot password form - email input
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you an OTP
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
          <div className="rounded-card shadow-sm bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700">
            <TextInput
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Sending...' : 'SEND OTP'}
            </button>
            <div className="mt-4 text-center text-sm">
              <Link to="/login" className="text-brand-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
