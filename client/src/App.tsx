import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider } from '@/lib/auth';
import AppRoutes from '@/routes';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App Component
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <AuthProvider>
          <Router>
            <div className="App min-h-screen bg-background text-foreground dark">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
};

export default App;
