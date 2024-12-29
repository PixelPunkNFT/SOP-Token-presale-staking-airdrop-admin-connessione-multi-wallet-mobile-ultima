import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_TOKEN_ADDRESS),
    'process.env.VITE_PRESALE_ADDRESS': JSON.stringify(process.env.VITE_PRESALE_ADDRESS),
    'process.env.VITE_STAKING_ADDRESS': JSON.stringify(process.env.VITE_STAKING_ADDRESS),
    'process.env.VITE_AIRDROP_ADDRESS': JSON.stringify(process.env.VITE_AIRDROP_ADDRESS)
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    proxy: {
      '/api/eth-price': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => '/api/v3/ticker/price?symbol=ETHUSDT',
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', 'application/json');
          });
        }
      }
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Private-Network": "true",
      "Access-Control-Allow-Credentials": "true",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "unsafe-none"
    },
    cors: true,
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('ethers') || id.includes('viem') || id.includes('wagmi') || id.includes('@web3modal')) {
              return 'web3-vendors';
            }
          }
        }
      }
    }
  }
})
