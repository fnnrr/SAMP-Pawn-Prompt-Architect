import React from 'react';
import { registerRootComponent } from 'expo';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

registerRootComponent(RootApp);
