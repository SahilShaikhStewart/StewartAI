import { Outlet } from '@tanstack/react-router';

import { Header } from './Header';

export function MainLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
