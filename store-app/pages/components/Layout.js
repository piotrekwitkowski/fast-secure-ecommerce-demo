import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { isLoggedIn, logout, getUsername } from '../../utils/auth';
import Script from 'next/script'
import config from '../../aws-backend-config.json';


export default function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(isLoggedIn());
  }, []);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between">
            <div className="flex space-x-7">
              <div>
                <Link href="/" className="flex items-center py-4 px-2">
                    <img src="/logo.svg" alt="Store Logo" width={30} height={30} />
                    <div className="font-semibold text-gray-500 text-lg">Recycle Bin Boutique</div>
                </Link>
              </div>
            </div>
            {isAuthenticated ? 
              (
                <div className="flex justify-between">
                    <Link className="py-2 px-2 flex items-center font-medium text-gray-500 rounded hover:bg-green-500 hover:text-white transition duration-300"href="/profile">
                      Ciao {getUsername()} !
                    </Link>
                    <button onClick={handleLogout} className="py-2 px-2 font-medium text-gray-500 rounded hover:bg-red-500 hover:text-white transition duration-300">
                      Log Out
                    </button>
                </div>
              ) : (
                <div>
                    <Link className="py-2 px-2 flex items-center font-medium text-gray-500 rounded hover:bg-green-500 hover:text-white transition duration-300"href="/login">
                      Log in
                    </Link>
                </div>
              )}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto mt-6 px-4">{children}</main>
      <Script src={config.waf_url} strategy="beforeInteractive" />
    </div>
  );
}
