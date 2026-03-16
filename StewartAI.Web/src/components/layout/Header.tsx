import { Brain, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';

import { cn } from '@/lib/utils';

const navItems = [
    { path: '/documents', label: 'Document Analysis', icon: FileText },
    { path: '/chat', label: 'Knowledge Assistant', icon: MessageSquare },
    { path: '/dashboard', label: 'Risk Dashboard', icon: BarChart3 },
];

export function Header() {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 mr-8">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stewart-blue">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-stewart-blue leading-tight">
                            Stewart AI
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                            Title Intelligence Platform
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const isActive = currentPath.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-stewart-blue text-white'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side - API status indicator */}
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        API Connected
                    </div>
                </div>
            </div>
        </header>
    );
}
