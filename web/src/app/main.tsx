import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrapTheme } from '../features/switch-theme/index.ts';
import { App } from './App.tsx';
import './styles/global.css';

bootstrapTheme();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root was not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
