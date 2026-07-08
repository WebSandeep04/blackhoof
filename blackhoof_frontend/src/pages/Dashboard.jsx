import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, Users, FileText, BookOpen, Layers, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDashboardData();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!stats) return <div className="text-center text-gray-500 mt-10">Failed to load dashboard.</div>;

    const statCards = [
        { label: 'Total Products', value: stats.stats.products, icon: Package, color: 'bg-blue-500' },
        { label: 'Active Users', value: stats.stats.users, icon: Users, color: 'bg-brand-primary' },
        { label: 'Saved Catalogues', value: stats.stats.catalogues, icon: BookOpen, color: 'bg-purple-500' },
        { label: 'Published Blogs', value: stats.stats.blogs, icon: FileText, color: 'bg-orange-500' },
        { label: 'Total Categories', value: stats.stats.categories, icon: Layers, color: 'bg-pink-500' },
        { label: 'System Roles', value: stats.stats.roles, icon: Shield, color: 'bg-gray-700' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="text-brand-primary" /> Overview
                </h1>
                <p className="text-gray-500 text-sm mt-1">Here is what's happening in your application today.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
                        <div className={`p-4 rounded-xl text-white shadow-sm ${card.color}`}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest Products */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" /> Recent Products
                        </h3>
                        <a href="/admin/products" className="text-sm font-medium text-brand-primary hover:underline flex items-center">
                            View All <ArrowUpRight className="w-4 h-4 ml-1" />
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Name</th>
                                    <th className="px-6 py-3 font-medium">Category</th>
                                    <th className="px-6 py-3 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recent.products.length === 0 ? (
                                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-400">No products found</td></tr>
                                ) : (
                                    stats.recent.products.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-[150px]">{product.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{product.category ? product.category.name : '-'}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Latest Catalogues */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-purple-500" /> Recent Catalogues
                        </h3>
                        <a href="/admin/catalogue" className="text-sm font-medium text-brand-primary hover:underline flex items-center">
                            View All <ArrowUpRight className="w-4 h-4 ml-1" />
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Catalogue Name</th>
                                    <th className="px-6 py-3 font-medium">Created By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recent.catalogues && stats.recent.catalogues.length === 0 ? (
                                    <tr><td colSpan="2" className="px-6 py-4 text-center text-gray-400">No catalogues found</td></tr>
                                ) : (
                                    stats.recent.catalogues && stats.recent.catalogues.map(catalogue => (
                                        <tr key={catalogue.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
                                                    {catalogue.name ? catalogue.name.charAt(0).toUpperCase() : 'C'}
                                                </div>
                                                {catalogue.name || 'Unnamed Catalogue'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{catalogue.user ? catalogue.user.name : 'Unknown User'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
