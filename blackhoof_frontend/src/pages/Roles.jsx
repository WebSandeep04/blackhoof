import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, fetchPermissions, createRole, updateRole, deleteRole } from '../store/slices/rolesSlice';
import { Edit2, Trash2, Plus, Search } from 'lucide-react';
import DataTable from '../components/DataTable';
import Swal from 'sweetalert2';
export default function Roles() {
    const dispatch = useDispatch();
    const { roles, pagination, availablePermissions, loading } = useSelector(state => state.roles);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [currentRole, setCurrentRole] = useState({ id: null, name: '', permissions: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        dispatch(fetchPermissions());
    }, [dispatch]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(fetchRoles({ page, search: searchQuery }));
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, page, dispatch]);

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
            const payload = { name: currentRole.name, permissions: currentRole.permissions };
            if (currentRole.id) {
                await dispatch(updateRole({ id: currentRole.id, roleData: payload })).unwrap();
            } else {
                await dispatch(createRole(payload)).unwrap();
            }
            setIsSubmitting(false);
            setIsFormOpen(false);
            dispatch(fetchRoles());
            Swal.fire({
                title: 'Success!',
                text: 'Role saved successfully.',
                icon: 'success',
                confirmButtonColor: '#2bb69a',
                timer: 1500
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error saving role:", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was a problem saving the role.',
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
                await dispatch(deleteRole(id)).unwrap();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The role has been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#2bb69a',
                    timer: 1500
                });
            } catch (error) {
                console.error("Error deleting role:", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was a problem deleting the role.',
                    icon: 'error',
                    confirmButtonColor: '#2bb69a'
                });
            }
        }
    };

    const openForm = (role = { id: null, name: '', permissions: [] }) => {
        const permissions = role.permissions ? role.permissions.map(p => p.name) : [];
        setCurrentRole({ ...role, permissions });
        setIsFormOpen(true);
    };

    const handlePermissionToggle = (permissionName) => {
        const permissions = currentRole.permissions.includes(permissionName)
            ? currentRole.permissions.filter(p => p !== permissionName)
            : [...currentRole.permissions, permissionName];
        setCurrentRole({ ...currentRole, permissions });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setCurrentRole({ ...currentRole, permissions: availablePermissions.map(p => p.name) });
        } else {
            setCurrentRole({ ...currentRole, permissions: [] });
        }
    };

    const handleSelectGroup = (e, groupPermissions) => {
        const groupPermNames = groupPermissions.map(p => p.name);
        if (e.target.checked) {
            const newPerms = [...new Set([...currentRole.permissions, ...groupPermNames])];
            setCurrentRole({ ...currentRole, permissions: newPerms });
        } else {
            const newPerms = currentRole.permissions.filter(p => !groupPermNames.includes(p));
            setCurrentRole({ ...currentRole, permissions: newPerms });
        }
    };

    const groupedPermissions = (availablePermissions || []).reduce((acc, perm) => {
        const parts = perm.name.split(' ');
        const entity = parts.length > 1 ? parts[parts.length - 1] : 'other';
        if (!acc[entity]) acc[entity] = [];
        acc[entity].push(perm);
        return acc;
    }, {});

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
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-sm w-64 bg-white shadow-sm"
                    />
                </div>
                <button 
                    onClick={() => openForm()}
                    className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-hover transition shadow-sm"
                    title="Add Role"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentRole.id ? 'Edit' : 'Create'} Role</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={currentRole.name}
                                    onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none mb-4"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700">Permissions</label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={availablePermissions.length > 0 && currentRole.permissions.length === availablePermissions.length}
                                            onChange={handleSelectAll}
                                            className="rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Select All</span>
                                    </label>
                                </div>
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-brand">
                                    {Object.entries(groupedPermissions).map(([entity, perms]) => {
                                        const allSelected = perms.every(p => currentRole.permissions.includes(p.name));
                                        return (
                                            <div key={entity} className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-800 capitalize">{entity}</h4>
                                                    <label className="flex items-center space-x-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            onChange={(e) => handleSelectGroup(e, perms)}
                                                            className="rounded text-brand-primary focus:ring-brand-primary"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600">Select All {entity}</span>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {perms.map(permission => (
                                                        <label key={permission.id} className="flex items-center space-x-2 bg-white px-3 py-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                                                            <input 
                                                                type="checkbox"
                                                                checked={currentRole.permissions.includes(permission.name)}
                                                                onChange={() => handlePermissionToggle(permission.name)}
                                                                className="rounded text-brand-primary focus:ring-brand-primary"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700 capitalize">{permission.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover transition font-medium flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    {isSubmitting ? 'Saving...' : 'Save Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DataTable 
                columns={[
                    { header: 'ID', key: 'id' },
                    { header: 'Name', key: 'name', cellClassName: 'font-medium text-black' },
                    { 
                        header: 'Permissions', 
                        key: 'permissions', 
                        render: (role) => (
                            <span className="text-gray-600 text-xs">
                                {role.permissions && role.permissions.length > 0 
                                    ? role.permissions.map(p => p.name).join(', ') 
                                    : 'No permissions'}
                            </span>
                        )
                    },
                    {
                        header: 'Actions',
                        key: 'actions',
                        className: 'text-right',
                        cellClassName: 'text-right space-x-3',
                        render: (role) => (
                            <>
                                <button onClick={() => openForm(role)} className="text-brand-primary hover:text-brand-hover"><Edit2 className="w-4 h-4 inline" /></button>
                                <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                            </>
                        )
                    }
                ]}
                data={roles}
                keyExtractor={(role) => role.id}
                emptyMessage="No roles found."
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
            />
        </div>
    );
}
