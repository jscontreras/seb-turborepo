import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { Auth0ProviderWithNavigate } from './components/Auth0Provider';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import Profile from './components/Profile';
import { useAuth0 } from '@auth0/auth0-react';

function App() {
  const [count, setCount] = useState(0);
  const { isLoading, getAccessTokenSilently } = useAuth0();
  const [messages, setMessages] = useState(
    {
      edge: '...Fetching Vercel Edge Function...',
      nodejs: '...Fetching Vercel NodeJs Function...',
      authApi: '...Fetching Auth-based API Vercel Function...',
      ready: false
    });

  const Home = () => (
    <div className="flex flex-col items-center justify-top pt-8 min-h-screen bg-gray-100 px-4">
      <h1 className="text-3xl font-bold mb-4">My React Vercel App</h1>
      <div className="flex space-x-4 mt-6">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="w-16 h-16" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-16 h-16" alt="React logo" />
        </a>
      </div>
      <h1 className="text-2xl font-semibold mt-8">Vite + React</h1>
      <div className={`text-center mt-4`}>
        <p className={`text-lg ${messages.ready ? 'text-amber-600' : 'text-gray-500'}`}>{messages.edge}</p>
        <p className={`text-lg ${messages.ready ? 'text-amber-600' : 'text-gray-500'}`}>{messages.nodejs}</p>
        <p className={`text-lg ${messages.ready ? 'text-purple-700' : 'text-gray-500'}`}>{messages.authApi}</p>
        {/* <AuthorizedApiCallbacks /> */}
      </div>
      <div className="card mt-6">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          count is {count}
        </button>
      </div>
      <p className="read-the-docs mt-6 text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [edgeResponse, nodejsResponse, authApiResponse] = await Promise.all([
          fetch('/api/edge/hello'),
          fetch('/api/nodejs/hello'),
          new Promise(async (resolve) => {
            let validToken = 'SAMPLE_FAKE_TOKEN_INITIAL';
            try {
              // Extract token if authenticated, throw errors otherwisse.
              const extractToken = await getAccessTokenSilently();
              validToken = extractToken;
            } catch (e) {
              // do nothing as we intentionally want to proceed with invalid token;
            }
            try {
              const authRes = await fetch(`/api/nodejs/hello-auth`, {
                headers: {
                  Authorization: `Bearer ${validToken}`,
                },
              });
              if (authRes.status === 200) {
                resolve(authRes);
              } else {
                const body = await authRes.json();

                throw new Error(`[${authRes.status}] ${authRes.statusText}: ${body.message}`);
              }
            } catch (e: any) {
              console.log('e', e)
              resolve({ json: () => ({ message: e.message }) });
            }
          }) as Promise<any>
        ]);

        const [edgeData, nodejsData, authjsData] = await Promise.all([
          edgeResponse.json(),
          nodejsResponse.json(),
          authApiResponse.json()
        ]);

        setMessages({ edge: edgeData.message, nodejs: nodejsData.message, ready: true, authApi: authjsData.message });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (!isLoading && !messages.ready) {
      fetchData();
    }
  }, [messages, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Auth0ProviderWithNavigate>
        {/* Wrapper for max width and centering */}
        <div className="flex flex-col min-h-screen items-center bg-gray-100">
          {/* Navbar */}
          <nav className="bg-blue-600 text-white px-8 py-3 flex justify-between items-center shadow-md w-full max-w-screen-xl">
            {/* Transformed into a Link */}
            <Link to="/" className="text-lg font-semibold hover:underline p-4">
              Home
            </Link>
            <div className="flex space-x-4">
              <LoginButton />
              <LogoutButton />
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-grow bg-white p-6 w-full max-w-screen-xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}

export default App;
