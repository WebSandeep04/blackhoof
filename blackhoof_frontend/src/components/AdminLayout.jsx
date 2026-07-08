import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import { Users, Shield, LogOut, Menu, Settings, ChevronRight, ChevronLeft, Package, ListTree, Tags, BookOpen, FileText } from 'lucide-react';

export default function AdminLayout() {
    const dispatch = useDispatch();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSetupMode, setIsSetupMode] = useState(false);
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



    const hasPermission = (permission) => {
        return user?.permissions?.includes(permission);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const mainNavigation = [
        { name: 'Products', href: '/admin/products', icon: Package, permission: 'view products' },
        { name: 'Catalogue', href: '/admin/catalogue', icon: BookOpen, permission: 'view saved catalogues' },
        { name: 'Blogs', href: '/admin/blogs', icon: FileText, permission: 'view blogs' },
    ].filter(item => !item.permission || hasPermission(item.permission));

    const setupNavigation = [
        { name: 'Users', href: '/admin/users', icon: Users, permission: 'view users' },
        { name: 'Roles', href: '/admin/roles', icon: Shield, permission: 'view roles' },
        { name: 'Categories', href: '/admin/categories', icon: ListTree, permission: 'view categories' },
        { name: 'Attributes', href: '/admin/attributes', icon: Tags, permission: 'view attributes' },
        { name: 'Blog Category', href: '/admin/blog-categories', icon: FileText, permission: 'view blog categories' },
    ].filter(item => !item.permission || hasPermission(item.permission));

    const navigation = [
        ...mainNavigation,
        ...(setupNavigation.length > 0 ? [{ name: 'Setup', children: setupNavigation }] : [])
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
                <nav className="flex-1 p-2 flex flex-col overflow-y-auto overflow-x-hidden">
                    {isSetupMode ? (
                        <>
                            <button
                                onClick={() => setIsSetupMode(false)}
                                className={`flex items-center gap-3 px-3 py-2 mb-2 text-sm rounded-lg transition-colors text-white hover:bg-white/10 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`}
                                title={!isSidebarOpen ? "Back" : undefined}
                            >
                                <ChevronLeft className="w-5 h-5 shrink-0" />
                                {isSidebarOpen && <span className="font-medium">Back to Main</span>}
                            </button>
                            
                            <div className="space-y-1">
                                {setupNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            title={!isSidebarOpen ? item.name : undefined}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                isActive 
                                                    ? 'bg-brand-hover text-white font-medium shadow-sm' 
                                                    : 'text-white hover:bg-white/10 hover:text-white'
                                            } ${!isSidebarOpen ? 'justify-center' : ''}`}
                                        >
                                            <Icon className="w-5 h-5 shrink-0" />
                                            {isSidebarOpen && <span className="truncate">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="space-y-1 flex-1">
                                {mainNavigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            title={!isSidebarOpen ? item.name : undefined}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                isActive 
                                                    ? 'bg-brand-hover text-white font-medium shadow-sm' 
                                                    : 'text-white hover:bg-white/10 hover:text-white'
                                            } ${!isSidebarOpen ? 'justify-center' : ''}`}
                                        >
                                            <Icon className="w-5 h-5 shrink-0" />
                                            {isSidebarOpen && <span className="truncate">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                            
                            {setupNavigation.length > 0 && (
                                <div className="mt-auto pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            setIsSetupMode(true);
                                            if (!isSidebarOpen) setIsSidebarOpen(true);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-white hover:bg-white/10 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`}
                                        title={!isSidebarOpen ? "Setup" : undefined}
                                    >
                                        <Settings className="w-5 h-5 shrink-0" />
                                        {isSidebarOpen && <span className="truncate">Setup</span>}
                                        {isSidebarOpen && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
