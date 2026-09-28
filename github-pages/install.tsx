import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InstallGuide } from '@/app/install/install-guide';
import '@/app/globals.css';
createRoot(document.getElementById('root')!).render(<StrictMode><InstallGuide storage="device"/></StrictMode>);
