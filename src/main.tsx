
import { createRoot } from 'react-dom/client'
import React from 'react'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './index.css'

const root = document.getElementById("root");
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
