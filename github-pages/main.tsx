import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MochiApp from '@/app/mochi-app';
import '@/app/globals.css';
// GitHub Pages serves static files only: no ChatGPT sign-in, and records stay on this device.
createRoot(document.getElementById('root')!).render(<StrictMode><MochiApp signedIn storage="device"/></StrictMode>);
