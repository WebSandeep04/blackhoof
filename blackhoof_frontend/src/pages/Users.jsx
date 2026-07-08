import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser } from '../store/slices/usersSlice';
import { fetchRoles } from '../store/slices/rolesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';
export default function Users() {
    const dispatch = useDispatch();
    const { users, pagination, loading: usersLoading } = useSelector(state => state.users);
    const { roles: rolesList, loading: rolesLoading } = useSelector(state => state.roles);
    const loading = usersLoading || rolesLoading;
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentUser, setCurrentUser] = useState({ id: null, name: '', email: '', password: '', roles: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsFormOpen(true);
    };

    const handleRoleToggle = (roleName) => {
        const roles = currentUser.roles.includes(roleName)
            ? currentUser.roles.filter(r => r !== roleName)
            : [...currentUser.roles, roleName];
        setCurrentUser({ ...currentUser, roles });
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
                <button 
                    onClick={() => openForm()}
                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                    title="Add User"
                >
                    <Plus className="w-5 h-5" />
                </button>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {currentUser.id && <span className="text-xs text-gray-500 font-normal">(Leave blank to keep unchanged)</span>}
                                    </label>
                                    <input 
                                        type="password" 
                                        required={!currentUser.id}
                                        value={currentUser.password}
                                        onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {rolesList.map(role => (
                                            <label key={role.id} className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                                                <input 
                                                    type="checkbox"
                                                    checked={currentUser.roles.includes(role.name)}
                                                    onChange={() => handleRoleToggle(role.name)}
                                                    className="rounded text-brand-primary focus:ring-brand-primary"
                                                />
                                                <span className="text-sm font-medium text-gray-700">{role.name}</span>
                                            </label>
                                        ))}
                                    </div>
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
                                <button onClick={() => openForm(user)} className="text-brand-primary hover:text-brand-hover"><Edit2 className="w-4 h-4 inline" /></button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
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
