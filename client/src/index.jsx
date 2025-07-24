import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx'

// Entry point for the React application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
