import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { useRouter } from 'next/router';
import { isLoggedIn, getUsername, getToken } from '../utils/auth';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      try {
        const response = await fetch('/api/profile?username='+getUsername(), {});

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  if (isLoading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-red-500">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h1 className="text-2xl font-bold mb-6 text-center">User Profile</h1>
        {profile && (
          <div>
            <p className="mb-4"><strong>Name:</strong> {profile.username}</p>
            <p className="mb-4"><strong>Phone:</strong> {profile.phone}</p>
            <p className="mb-4"><strong>Address:</strong> {profile.address}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
