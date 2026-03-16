import {
    RouterProvider,
    createRouter,
    createRootRoute,
    createRoute,
    redirect,
    NotFoundRoute,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MainLayout } from './components/layout/MainLayout';
import DocumentAnalysisPage from './app/documents/DocumentAnalysisPage';
import ChatPage from './app/chat/ChatPage';
import RiskDashboardPage from './app/dashboard/RiskDashboardPage';

// ─── Root Route (with layout) ────────────────────────────────────────────────

const rootRoute = createRootRoute({
    component: MainLayout,
});

// ─── Index Route (redirect to /documents) ────────────────────────────────────

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => {
        throw redirect({ to: '/documents' });
    },
});

// ─── Feature Routes ──────────────────────────────────────────────────────────

const documentsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/documents',
    component: DocumentAnalysisPage,
});

const chatRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/chat',
    component: ChatPage,
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: RiskDashboardPage,
});

// ─── 404 Route ───────────────────────────────────────────────────────────────

const NotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground">Page not found</p>
    </div>
);

const notFoundRoute = new NotFoundRoute({
    getParentRoute: () => rootRoute,
    component: NotFound,
});

// ─── Route Tree & Router ─────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
    indexRoute,
    documentsRoute,
    chatRoute,
    dashboardRoute,
]);

const router = createRouter({ routeTree, notFoundRoute, scrollRestoration: true });

// ─── React Query Client ──────────────────────────────────────────────────────

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
});

// ─── App Component ───────────────────────────────────────────────────────────

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );
};

export default App;
