import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../api/auth.api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await forgotPasswordApi(email);
      setMessage(response.message || 'If that email address is in our database, we will send you an email to reset your password.');
      // After a short delay, redirect to verify OTP page
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 3000);
    } catch (err) {
      // For security, even on error we should probably just show success message if it's a 404,
      // but if it's a 429 (cooldown), we should show the error.
      if (err.response && err.response.status === 429) {
        setError(err.response.data.message);
      } else {
        setMessage('If that email address is in our database, we will send you an email to reset your password.');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Forgot Password
          </h2>
          <p className="mt-4 text-center text-sm text-gray-600">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {message && !error && (
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <p className="text-sm text-green-600 text-center font-medium">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send OTP'}
            </button>
          </div>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
