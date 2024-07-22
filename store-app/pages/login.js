import Layout from './components/Layout';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { login } from '../utils/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    function setError(err) {
      document.getElementById("error").innerHTML = err;
    }

    // Basic form validation
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        // Login successful
        const data = await response.json();
        login(username, data.token)
        router.push('/'); // Redirect to home page
      } else {
        // Login failed
        if ((response.status === 405) || (response.status === 202)) {
          // reload the page to display the captcha or challenge
          router.reload()
        } else if (response.status === 403) {
          setError('Login was not authorized and blocked');
        } else {
          const data = await response.json();
          setError(data.message || 'Login failed');
        }
        
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.log('Login error:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******************"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Sign In
            </button>
          </div>
          <div className="flex items-center justify-between">
              <Link href={`/register`} className="py-2 px-2 font-small text-blue-500">Sign up here, if you do not have an account</Link>
          </div>

        </form>
        <div id='error' className="flex items-center justify-between text-red-500"/>
      </div>
    </Layout>
  );
}
