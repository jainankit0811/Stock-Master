import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TextInput from '../components/form/TextInput';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const validateSignup = () => {
    // Name validation: 6-12 characters
    if (signupData.name.length < 6 || signupData.name.length > 12) {
      toast.error('Name must be between 6-12 characters');
      return false;
    }

    // Email validation: check for duplicates (would be done on backend)
    if (!signupData.email.includes('@')) {
      toast.error('Please enter a valid email');
      return false;
    }

    // Password validation: min 8 chars, uppercase, lowercase, special char
    if (signupData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (!/[a-z]/.test(signupData.password)) {
      toast.error('Password must contain a lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(signupData.password)) {
      toast.error('Password must contain an uppercase letter');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(signupData.password)) {
      toast.error('Password must contain a special character');
      return false;
    }

    // Confirm password
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(loginData);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      toast.error('Invalid Login Id or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateSignup()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
      });
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      toast.error('Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Smart Modular Inventory OS
          </h2>
        </div>

        {!isSignup ? (
          // Login Form
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-card shadow-sm bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700">
              <TextInput
                label="Login Id"
                name="email"
                type="email"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                placeholder="Enter your email"
              />
              <TextInput
                label="Password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
              <div className="mt-4 text-center text-sm">
                <Link to="/forgot-password" className="text-brand-primary hover:underline mr-2">
                  Forget Password ?
                </Link>
                <span className="text-gray-500 dark:text-gray-400">|</span>
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className="text-brand-primary hover:underline ml-2"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Signup Form
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="rounded-card shadow-sm bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700">
              <TextInput
                label="Enter Login Id"
                name="name"
                value={signupData.name}
                onChange={handleSignupChange}
                required
                placeholder="6-12 characters"
              />
              <TextInput
                label="Enter Email Id"
                name="email"
                type="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
                placeholder="Enter your email"
              />
              <TextInput
                label="Enter Password"
                name="password"
                type="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                placeholder="Min 8 chars, uppercase, lowercase, special char"
              />
              <TextInput
                label="Re-Enter Password"
                name="confirmPassword"
                type="password"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                required
                placeholder="Confirm your password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Creating account...' : 'SIGN UP'}
              </button>
              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className="text-brand-primary hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
