import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import '@fontsource-variable/inter';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/noto-sans-devanagari';
import 'katex/dist/katex.min.css';
import './index.css';
import { router } from './router.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => count < 2 && ![400, 401, 403, 404].includes(error?.status),
    },
  },
});

// Remove server-rendered SEO tags once React takes over head management.
document.querySelectorAll('[data-ssr]').forEach((node) => node.remove());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
