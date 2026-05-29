import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the PWA service worker and configure the update behavior
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Uma nova versão do app está disponível. Atualizando automaticamente...');
    // Automatically apply update and refresh if there is a new version
    updateSW(true);
  },
  onOfflineReady() {
    console.log('O aplicativo Nós Dois foi carregado com sucesso e está pronto para o uso offline! 🏡✨');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
