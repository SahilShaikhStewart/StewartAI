import { Outlet } from '@tanstack/react-router';

import { Header } from './Header';

export function MainLayout() {
    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f8fbff 0%, #eef5fc 20%, #dceaF7 40%, #c5ddf0 60%, #a8cce6 80%, #8bbddc 100%)' }}>
            <Header />
            <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>
        </div>
    );
}
