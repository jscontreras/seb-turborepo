import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'
import App from './App.tsx';
import { getConfig } from './auth0/config.ts';

const config = getConfig();

interface AppState {
  returnTo?: string;
}

const onRedirectCallback = (appState?: AppState) => {
  window.history.pushState(
    appState && appState.returnTo ? appState.returnTo : window.location.pathname,
    '',
    appState && appState.returnTo ? appState.returnTo : window.location.pathname
  );
};



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={config.authorizationParams}
      onRedirectCallback={onRedirectCallback}
    >
    <App />
    </Auth0Provider>
  </StrictMode>,
)
