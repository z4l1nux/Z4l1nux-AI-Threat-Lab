import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Inicializar Mermaid
import mermaid from 'mermaid';

mermaid.initialize({
  theme: 'dark',
  themeVariables: {
    primaryColor: '#ff6b35',
    primaryTextColor: '#e8eaed',
    primaryBorderColor: '#ff6b35',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f1419',
    background: '#0f1419',
    mainBkg: '#1e293b',
    secondBkg: '#334155',
    tertiaryBkg: '#475569',
    nodeBkg: '#1e293b',
    nodeBorder: '#ff6b35',
    clusterBkg: '#334155',
    clusterBorder: '#475569',
    defaultLinkColor: '#94a3b8',
    titleColor: '#ff6b35',
    edgeLabelBackground: '#1e293b',
    edgeLabelColor: '#e8eaed',
    gridColor: 'rgba(148, 163, 184, 0.2)'
  }
});

// Tornar Mermaid disponível globalmente
(window as any).mermaid = mermaid;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
