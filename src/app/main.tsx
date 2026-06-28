import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { decodeStrategy } from './utils/share.js';
import './index.css';

const params  = new URLSearchParams(window.location.search);
const encoded = params.get('s');
let pendingImport: { name: string; code: string } | null = null;
if (encoded) {
  try {
    pendingImport = decodeStrategy(encoded);
  } catch { /* ignore malformed share links */ }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App pendingImport={pendingImport} />
  </React.StrictMode>
);
