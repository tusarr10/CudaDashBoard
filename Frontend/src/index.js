// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Optional: Global CSS (you can create this file or omit it)
import App from './App';
import reportWebVitals from './reportWebVitals';

// Get the root element from your index.html
const rootElement = document.getElementById('root');

// Create a root for React 18+ and render the App
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Measure performance (you can remove this if not needed)
reportWebVitals();