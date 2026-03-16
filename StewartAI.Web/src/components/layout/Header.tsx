import { Brain, FileText, MessageSquare, BarChart3, Home, Activity } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

const navItems = [
    { path: '/', label: 'Home', icon: Home, exact: true },
    { path: '/documents', label: 'Documents', icon: FileText, exact: false },
    { path: '/chat', label: 'Knowledge', icon: MessageSquare, exact: false },
    { path: '/dashboard', label: 'Risk', icon: BarChart3, exact: false },
    { path: '/metrics', label: 'Metrics', icon: Activity, exact: false },
];

export function Header() {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stewart-blue shrink-0">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col whitespace-nowrap">
                        <span className="text-sm font-bold text-stewart-blue leading-tight">
                            Stewart AI
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            Title Intelligence Platform
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 ml-8">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? currentPath === item.path
                            : currentPath.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-stewart-blue text-white'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
