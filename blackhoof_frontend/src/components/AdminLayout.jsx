import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { Users, Shield, LogOut, Menu, Settings, ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminLayout() {
    const dispatch = useDispatch();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [openMenus, setOpenMenus] = useState({ 'Setup': true });
    const { user, loading } = useSelector((state) => state.auth);
    const logout = () => dispatch(logoutUser());
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Authenticating...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!user.roles.includes('Admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p>You do not have permission to view this area.</p>
                    <button onClick={logout} className="text-brand-primary underline">Logout</button>
                </div>
            </div>
        );
    }

    const toggleMenu = (menuName) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setOpenMenus(prev => ({ ...prev, [menuName]: true }));
        } else {
            setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
        }
    };

    const navigation = [
        { 
            name: 'Setup', 
            icon: Settings,
            children: [
                { name: 'Users', href: '/admin/users', icon: Users },
                { name: 'Roles', href: '/admin/roles', icon: Shield },
            ]
        },
    ];

    let activeRoute = 'Dashboard';
    navigation.forEach(item => {
        if (item.children) {
            const child = item.children.find(c => location.pathname.startsWith(c.href));
            if (child) activeRoute = child.name;
        } else if (item.href && location.pathname.startsWith(item.href)) {
            activeRoute = item.name;
        }
    });

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar (Green) */}
            <aside className={`bg-brand-primary text-white flex flex-col shadow-lg z-20 relative transition-all duration-300 ${isSidebarOpen ? 'w-56' : 'w-16'}`}>
                <div className="h-14 flex items-center justify-center border-b border-white/10 overflow-hidden">
                    {isSidebarOpen ? (
                        <h2 className="text-base font-bold tracking-wide truncate px-4">Admin Dashboard</h2>
                    ) : (
                        <span className="text-xl font-bold tracking-wide">AD</span>
                    )}
                </div>
                <nav className="flex-1 p-2 space-y-2 overflow-y-auto overflow-x-hidden">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        if (item.children) {
                            const isMenuOpen = openMenus[item.name];
                            const hasActiveChild = item.children.some(child => location.pathname.startsWith(child.href));
                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.name)}
                                        title={!isSidebarOpen ? item.name : undefined}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${hasActiveChild ? 'bg-brand-hover text-white font-medium shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'} ${!isSidebarOpen ? 'justify-center' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 shrink-0" />
                                            {isSidebarOpen && <span className="truncate">{item.name}</span>}
                                        </div>
                                        {isSidebarOpen && (
                                            isMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                        )}
                                    </button>
                                    
                                    {isSidebarOpen && isMenuOpen && (
                                        <div className="pl-6 space-y-1 mt-1">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;
                                                const isActive = location.pathname.startsWith(child.href);
                                                return (
                                                    <Link
                                                        key={child.name}
                                                        to={child.href}
                                                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                            isActive 
                                                                ? 'bg-brand-hover/50 text-white font-medium' 
                                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        <ChildIcon className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{child.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    title={!isSidebarOpen ? item.name : undefined}
                                    className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                        isActive 
                                            ? 'bg-brand-hover text-white font-medium shadow-sm' 
                                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    } ${!isSidebarOpen ? 'justify-center' : ''}`}
                                >
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {isSidebarOpen && <span className="truncate">{item.name}</span>}
                                </Link>
                            );
                        }
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                
                {/* Top Bar (White) */}
                <header className="h-14 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 shrink-0 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800">{activeRoute} Management</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-brand-primary font-medium">{user.roles.join(', ')}</p>
                        </div>
                        <button 
                            onClick={logout}
                            title="Logout"
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
