import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para produção
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar bibliotecas grandes em chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'router-vendor': ['react-router-dom'],
        }
      }
    },
    // Aumentar limite de warning para chunks grandes
    chunkSizeWarningLimit: 1000,
    // Otimizar assets
    assetsInlineLimit: 4096,
  },
  // Configurações para desenvolvimento
  server: {
    port: 3000,
    open: true
  },
  // Configurações de preview (para testar build local)
  preview: {
    port: 4173,
    open: true
  },
  // Configurações de ambiente
  define: {
    // Remover console.log em produção
    ...(process.env.NODE_ENV === 'production' ? {
      'console.log': '(() => {})',
      'console.warn': '(() => {})',
      'console.info': '(() => {})',
    } : {})
  }
})
