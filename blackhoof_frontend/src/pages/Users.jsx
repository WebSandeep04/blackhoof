import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser } from '../store/slices/usersSlice';
import { fetchRoles } from '../store/slices/rolesSlice';
import { Edit2, Trash2, Plus, Search, Key, Eye, EyeOff } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';
export default function Users() {
    const dispatch = useDispatch();
    const { users, pagination, loading: usersLoading } = useSelector(state => state.users);
    const { roles: rolesList, loading: rolesLoading } = useSelector(state => state.roles);
    const { user: authUser } = useSelector(state => state.auth);
    const loading = usersLoading || rolesLoading;
    
    const hasPermission = (permission) => authUser?.permissions?.includes(permission);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ id: null, password: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '', password: '', roles: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchUsers({ page, search: searchQuery }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, page, dispatch]);

    useEffect(() => {
        dispatch(fetchRoles());
    }, [dispatch]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...currentUser };
            if (!payload.password) delete payload.password; // Don't send empty password on update
            
            if (currentUser.id) {
                await dispatch(updateUser({ id: currentUser.id, userData: payload })).unwrap();
            } else {
                await dispatch(createUser(payload)).unwrap();
            }
            setIsSubmitting(false);
            setIsFormOpen(false);
            dispatch(fetchUsers());
            Swal.fire({
                title: 'Success!',
                text: 'User saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving user:", error);
            Swal.fire({
                title: 'Error!',
                text: 'Error saving user. Please check the form data.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2bb69a',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await dispatch(deleteUser(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The user has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting user:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the user.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    const openForm = (user = { id: null, name: '', email: '', password: '', roles: [] }) => {
        const roles = user.roles ? user.roles.map(r => r.name) : [];
        setCurrentUser({ ...user, roles, password: '' });
        setShowPassword(false);
        setIsFormOpen(true);
    };

    const handleRoleToggle = (roleName) => {
        const roles = currentUser.roles.includes(roleName)
            ? currentUser.roles.filter(r => r !== roleName)
            : [...currentUser.roles, roleName];
        setCurrentUser({ ...currentUser, roles });
    };

    const openPasswordForm = (user) => {
        setPasswordData({ id: user.id, password: '' });
        setShowChangePassword(false);
        setIsPasswordFormOpen(true);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await dispatch(updateUser({ id: passwordData.id, userData: { password: passwordData.password } })).unwrap();
            setIsSubmitting(false);
            setIsPasswordFormOpen(false);
            dispatch(fetchUsers());
            Swal.fire({
                title: 'Success!',
                text: 'Password updated successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error updating password:", error);
            Swal.fire({
                title: 'Error!',
                text: 'Error updating password. Please try again.',
                icon: 'error',
                confirmButtonColor: '#2bb69a'
            });
        }
    };

    // Removed local filter, handled by backend now

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                {hasPermission('create users') && (
                    <button 
                        onClick={() => openForm()}
                        className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                        title="Add User"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentUser.id ? 'Edit' : 'Create'} User</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input 
                                        type="text" required
                                        value={currentUser.name}
                                        onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" required
                                        value={currentUser.email}
                                        onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                {!currentUser.id && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                required
                                                value={currentUser.password}
                                                onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none pr-10"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                    <select
                                        value={currentUser.roles.length > 0 ? currentUser.roles[0] : ''}
                                        onChange={(e) => setCurrentUser({ ...currentUser, roles: e.target.value ? [e.target.value] : [] })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                                        required
                                    >
                                        <option value="">Select a role</option>
                                        {rolesList.map(role => (
                                            <option key={role.id} value={role.name}>{role.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPasswordFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input 
                                        type={showChangePassword ? "text" : "password"} 
                                        required
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none pr-10"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowChangePassword(!showChangePassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showChangePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsPasswordFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'Name', key: 'name' },
                    { header: 'Email', key: 'email' },
                    { 
                        header: 'Roles', 
                        key: 'roles', 
                        render: (user) => (
                            <span className="text-black">
                                {user.roles && user.roles.map(r => r.name).join(', ')}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (user) => (
                            <>
                                {hasPermission('edit users') && (
                                    <>
                                        <button onClick={() => openForm(user)} className="text-brand-primary hover:text-brand-hover" title="Edit User"><Edit2 className="w-4 h-4 inline" /></button>
                                        <button onClick={() => openPasswordForm(user)} className="text-blue-600 hover:text-blue-900" title="Change Password"><Key className="w-4 h-4 inline" /></button>
                                    </>
                                )}
                                {hasPermission('delete users') && (
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900" title="Delete User"><Trash2 className="w-4 h-4 inline" /></button>
                                )}
                            </>
                        )
                    }
                ]} 
                data={users} 
                keyExtractor={(user) => user.id} 
                emptyMessage="No users found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
