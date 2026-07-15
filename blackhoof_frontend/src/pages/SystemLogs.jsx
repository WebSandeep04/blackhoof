import React, { useState, useEffect } from 'react';
import { Shield, History } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuditLogs from './AuditLogs';
import LoginLogs from './LoginLogs';

export default function SystemLogs() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Default to audit logs, but check URL hash or state if we want to default to login
    const [activeTab, setActiveTab] = useState('audit');
    
    useEffect(() => {
        if (location.hash === '#login') {
            setActiveTab('login');
        } else if (location.hash === '#audit') {
            setActiveTab('audit');
        }
    }, [location]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`#${tab}`, { replace: true });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-light/20 rounded-lg">
                        {activeTab === 'audit' ? <History className="w-6 h-6 text-brand-primary" /> : <Shield className="w-6 h-6 text-brand-primary" />}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
                        <p className="text-sm text-gray-500">Track system activity and user logins</p>
                    </div>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => handleTabChange('audit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <History className="w-4 h-4" />
                        Audit Logs
                    </button>
                    <button
                        onClick={() => handleTabChange('login')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'login' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Shield className="w-4 h-4" />
                        Login Logs
                    </button>
                </div>
            </div>

            <div className="bg-transparent transition-all duration-300">
                {activeTab === 'audit' ? <AuditLogs isTab={true} /> : <LoginLogs isTab={true} />}
            </div>
        </div>
    );
}
