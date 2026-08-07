import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePage, Link } from '@inertiajs/react';
import {
    Folder,
    FolderPlus,
    Upload,
    Pencil,
    Trash2,
    ChevronRight,
    Home,
    FileText,
    Image as ImageIcon,
    Video as VideoIcon,
    Download,
    ExternalLink,
    Grid,
    List,
    Crown,
    Lock,
    RefreshCw,
    Search,
    X,
    Eye
} from 'lucide-react';

export default function Gallery() {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'superadmin' || auth?.user?.role === 'admin';
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPremiumError, setIsPremiumError] = useState(false);

    // Path & Breadcrumbs Navigation State
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Drive Root' }]);

    // Search & View Mode
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Selection & Preview
    const [selectedFile, setSelectedFile] = useState(null);

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Create Folder State
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);

    // Rename State
    const [itemToRename, setItemToRename] = useState(null);
    const [renameName, setRenameName] = useState('');
    const [renaming, setRenaming] = useState(false);

    // Delete State
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Account Connection State
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [manualClientId, setManualClientId] = useState('');
    const [manualClientSecret, setManualClientSecret] = useState('');
    const [manualToken, setManualToken] = useState('');
    const [manualFolderId, setManualFolderId] = useState('');
    const [savingManual, setSavingManual] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [accountSuccessMsg, setAccountSuccessMsg] = useState('');

    const fetchConnectionStatus = () => {
        axios.get(route('google-drive.status'))
            .then(res => {
                setConnectionStatus(res.data);
                if (res.data) {
                    if (res.data.client_id) setManualClientId(res.data.client_id);
                    if (res.data.client_secret) setManualClientSecret(res.data.client_secret);
                    if (res.data.refresh_token) setManualToken(res.data.refresh_token);
                    if (res.data.root_folder_id) setManualFolderId(res.data.root_folder_id);
                }
            })
            .catch(err => console.error("Error fetching connection status:", err));
    };

    useEffect(() => {
        fetchConnectionStatus();
    }, []);

    const handleSaveManual = (e) => {
        e.preventDefault();
        setSavingManual(true);
        setAccountSuccessMsg('');

        axios.post(route('google-drive.save-manual'), {
            client_id: manualClientId,
            client_secret: manualClientSecret,
            refresh_token: manualToken,
            root_folder_id: manualFolderId
        })
        .then(res => {
            setSavingManual(false);
            setAccountSuccessMsg('Google Drive parameters saved in database successfully!');
            fetchConnectionStatus();
            fetchFiles(currentFolderId);
            setTimeout(() => setAccountSuccessMsg(''), 3000);
        })
        .catch(err => {
            setSavingManual(false);
            alert("Error saving connection: " + (err.response?.data?.error || err.message));
        });
    };

    const handleDisconnect = () => {
        if (!confirm("Are you sure you want to disconnect this Google Drive account?")) return;
        setDisconnecting(true);

        axios.post(route('google-drive.disconnect'))
        .then(res => {
            setDisconnecting(false);
            setManualToken('');
            setManualFolderId('');
            fetchConnectionStatus();
            fetchFiles(currentFolderId);
        })
        .catch(err => {
            setDisconnecting(false);
            alert("Disconnect error: " + (err.response?.data?.error || err.message));
        });
    };

    const fetchFiles = (folderId) => {
        setLoading(true);
        setError(null);
        setIsPremiumError(false);

        axios.get(route('google-drive.files'), { params: { folder_id: folderId } })
            .then(response => {
                setFiles(response.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching files:", err);
                const status = err.response?.status;
                const errMsg = err.response?.data?.error || err.message || '';

                if (status === 403 || errMsg.toLowerCase().includes('subscription') || errMsg.toLowerCase().includes('plan')) {
                    setIsPremiumError(true);
                    setError("Google Drive is exclusive to Premium plan subscribers.");
                } else if (status === 401 || errMsg.toLowerCase().includes('re-authenticate')) {
                    setError("Google Drive authentication expired.");
                } else {
                    setError("Failed to load drive files. " + (errMsg || "Please check your connection and configuration."));
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFiles(currentFolderId);
    }, [currentFolderId]);

    // Handle Breadcrumbs Navigation
    const handleFolderClick = (folder) => {
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        setCurrentFolderId(folder.id);
        setSearchQuery('');
    };

    const handleBreadcrumbClick = (index) => {
        const targetBreadcrumb = breadcrumbs[index];
        setBreadcrumbs(prev => prev.slice(0, index + 1));
        setCurrentFolderId(targetBreadcrumb.id);
        setSearchQuery('');
    };

    // File Upload Handler
    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setShowUploadModal(true);

        for (const file of selectedFiles) {
            await uploadSingleFile(file);
        }

        setUploading(false);
        setTimeout(() => {
            setShowUploadModal(false);
            setUploadProgress({});
        }, 2000);
    };

    const uploadSingleFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
            formData.append('folder_id', currentFolderId);
        }

        try {
            setUploadProgress(prev => ({
                ...prev,
                [file.name]: { progress: 0, status: 'uploading' }
            }));

            await axios.post(route('google-drive.upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: { progress: percentCompleted, status: 'uploading' }
                    }));
                },
            });

            setUploadProgress(prev => ({
                ...prev,
                [file.name]: { progress: 100, status: 'success' }
            }));

            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadProgress(prev => ({
                ...prev,
                [file.name]: { progress: 0, status: 'error', error: err.response?.data?.error || 'Upload failed' }
            }));
        }
    };

    // Create Folder
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreatingFolder(true);
        try {
            await axios.post(route('google-drive.create-folder'), {
                folder_name: newFolderName.trim(),
                parent_folder_id: currentFolderId
            });

            setShowCreateFolderModal(false);
            setNewFolderName('');
            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Create folder error:', err);
            alert(err.response?.data?.error || 'Failed to create folder');
        } finally {
            setCreatingFolder(false);
        }
    };

    // Rename Folder or File
    const openRenameModal = (item) => {
        setItemToRename(item);
        setRenameName(item.name);
    };

    const handleRename = async () => {
        if (!itemToRename || !renameName.trim()) return;

        setRenaming(true);
        try {
            await axios.put(route('google-drive.rename'), {
                file_id: itemToRename.id,
                name: renameName.trim(),
                parent_folder_id: currentFolderId
            });

            // Update breadcrumbs if renaming current path item
            setBreadcrumbs(prev => prev.map(b => b.id === itemToRename.id ? { ...b, name: renameName.trim() } : b));

            setItemToRename(null);
            setRenameName('');
            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Rename error:', err);
            alert(err.response?.data?.error || 'Failed to rename item');
        } finally {
            setRenaming(false);
        }
    };

    // Delete Folder or File
    const openDeleteModal = (item) => {
        if (!isAdmin) {
            alert('Permission denied. Only admins can delete files or folders from Google Drive.');
            return;
        }
        setItemToDelete(item);
    };

    const confirmDelete = async () => {
        if (!isAdmin) {
            alert('Permission denied. Only admins can delete files or folders from Google Drive.');
            return;
        }
        if (!itemToDelete) return;

        setDeleting(true);
        try {
            await axios.delete(route('google-drive.delete'), {
                data: {
                    file_id: itemToDelete.id,
                    parent_folder_id: currentFolderId
                }
            });

            setItemToDelete(null);
            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.response?.data?.error || 'Failed to delete item');
        } finally {
            setDeleting(false);
        }
    };

    // Filter files by search query
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get Current Path Display String
    const currentPathString = breadcrumbs.map(b => b.name).join(' / ');

    // Render Premium Upgrade Banner if restricted
    if (isPremiumError) {
        return (
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-8 shadow-xl border border-purple-800/30 text-center flex flex-col items-center justify-center my-6">
                <div className="p-4 bg-purple-600/20 rounded-full mb-4 border border-purple-500/30">
                    <Crown className="w-12 h-12 text-amber-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Google Drive Storage - Premium Feature</h3>
                <p className="text-gray-300 max-w-lg mb-6 leading-relaxed">
                    Google Drive integration allowing directory navigation, subfolder creation, file uploading, renaming, and file management is available exclusively for Premium members.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                        href={route('pricing.public')}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Upgrade to Premium Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                {/* Top Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search in this path..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Controls: View Mode & Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* View Switcher */}
                        <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Account Connection Settings Button - Admin Only */}
                        {isAdmin && (
                        <button
                            onClick={() => setShowAccountModal(true)}
                            className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all gap-2 cursor-pointer border border-slate-200/80 shadow-sm"
                            title="Manage Google Drive Account Connection"
                        >
                            <RefreshCw className={`w-4 h-4 shrink-0 ${connectionStatus?.connected ? 'text-emerald-600' : 'text-amber-500'}`} />
                            <span>{connectionStatus?.has_custom_connection ? 'Drive Connected' : 'Connect Account'}</span>
                        </button>
                        )}

                        {/* Render Create Folder & Upload Files only if account is connected and active */}
                        {(connectionStatus?.connected && !error) && (
                            <>
                                {/* Create Folder Button */}
                                <button
                                    onClick={() => setShowCreateFolderModal(true)}
                                    className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all shadow-md shadow-emerald-600/25 gap-2 active:scale-95 cursor-pointer"
                                    style={{ color: '#ffffff' }}
                                >
                                    <FolderPlus className="w-4 h-4 shrink-0" style={{ color: '#ffffff' }} />
                                    <span className="!text-white" style={{ color: '#ffffff' }}>Create Folder</span>
                                </button>

                                {/* Upload Files Input */}
                                <input
                                    type="file"
                                    id="file-upload"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="inline-flex items-center px-5 py-2.5 bg-[var(--theme-primary,#1e88e5)] hover:bg-[var(--theme-primary-dark,#1565c0)] !text-white rounded-xl font-bold uppercase tracking-wider text-[11px] cursor-pointer transition-all shadow-md gap-2 active:scale-95 border-0"
                                    style={{ backgroundColor: 'var(--theme-primary, #1e88e5)', color: '#ffffff' }}
                                >
                                    <Upload className="w-4 h-4 shrink-0" style={{ color: '#ffffff' }} />
                                    <span className="!text-white" style={{ color: '#ffffff' }}>Upload Files</span>
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {/* Breadcrumbs Path Bar */}
                <div className="flex items-center flex-wrap gap-1 text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 overflow-x-auto">
                    {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <React.Fragment key={crumb.id || 'root'}>
                                {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                                <button
                                    onClick={() => handleBreadcrumbClick(idx)}
                                    className={`inline-flex items-center gap-1.5 font-medium transition-colors rounded px-2 py-1 ${isLast
                                            ? 'text-blue-700 font-semibold bg-blue-100/60 pointer-events-none'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-200/50'
                                        }`}
                                >
                                    {idx === 0 ? <Home className="w-4 h-4 text-slate-600" /> : <Folder className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-primary, #1e88e5)' }} />}
                                    <span className="truncate max-w-[150px]">{crumb.name}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Content Display */}
            {error && !isPremiumError ? (
                <div className="bg-amber-50/90 rounded-2xl p-8 border border-amber-200 text-center shadow-sm flex flex-col items-center justify-center space-y-4 my-2">
                    <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
                        <RefreshCw className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-amber-900 mb-1">Google Drive Connection Required</h4>
                        <p className="text-sm text-amber-800 max-w-md">{error}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                        {isAdmin && (
                        <button
                            onClick={() => setShowAccountModal(true)}
                            className="inline-flex items-center px-5 py-2.5 bg-[#1e88e5] hover:bg-[#1565c0] !text-white rounded-xl font-bold uppercase tracking-wider text-[11px] shadow-md transition-all cursor-pointer gap-2"
                            style={{ color: '#ffffff' }}
                        >
                            <RefreshCw className="w-4 h-4 text-white shrink-0" style={{ color: '#ffffff' }} />
                            <span className="!text-white" style={{ color: '#ffffff' }}>Connect Account Settings</span>
                        </button>
                        )}
                        <button
                            onClick={() => fetchFiles(currentFolderId)}
                            className="inline-flex items-center px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors gap-2 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                        </button>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading folder items...</p>
                </div>
            ) : filteredFiles.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <Folder className="w-16 h-16 mx-auto mb-3" style={{ color: 'var(--theme-primary, #1e88e5)', opacity: 0.5 }} />
                    <h4 className="text-lg font-semibold text-gray-700 mb-1">
                        {searchQuery ? 'No items match your search' : 'This folder is empty'}
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                        {searchQuery ? 'Try clearing your search term' : 'Upload files or create subfolders to get started.'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredFiles.map(file => (
                        <div
                            key={file.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-200 group relative flex flex-col justify-between"
                        >
                            {file.type === 'folder' ? (
                                <div
                                    onClick={() => handleFolderClick(file)}
                                    className="p-5 cursor-pointer flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/90 via-slate-50/50 to-slate-100/60 hover:from-slate-100/90 hover:to-slate-200/50 transition-all duration-200 h-40"
                                >
                                    <div
                                        className="p-3 rounded-2xl border group-hover:scale-105 transition-all duration-200 shadow-sm flex items-center justify-center"
                                        style={{
                                            backgroundColor: 'var(--theme-primary-soft, rgba(30, 136, 229, 0.12))',
                                            borderColor: 'var(--theme-primary-soft, rgba(30, 136, 229, 0.25))'
                                        }}
                                    >
                                        <Folder className="w-10 h-10 transition-colors" style={{ color: 'var(--theme-primary, #1e88e5)' }} />
                                    </div>
                                    <span className="mt-3 text-sm font-semibold text-slate-800 text-center truncate w-full px-2 transition-colors" title={file.name}>
                                        {file.name}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer flex flex-col h-40 relative bg-gray-50 overflow-hidden"
                                    onClick={() => setSelectedFile(file)}
                                >
                                    {file.type === 'video' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                                            <VideoIcon className="w-12 h-12 text-blue-400" />
                                            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded mt-2 text-slate-300">Video</span>
                                        </div>
                                    ) : file.thumbnailLink ? (
                                        <img
                                            src={file.thumbnailLink}
                                            alt={file.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                                            <FileText className="w-12 h-12 text-gray-400" />
                                            <span className="text-xs mt-2 uppercase font-mono">{file.mimeType.split('/').pop()}</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                                        <p className="text-xs font-medium truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Item Actions Bar */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100 text-gray-600">
                                <button
                                    onClick={() => openRenameModal(file)}
                                    className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600 transition-colors"
                                    title="Rename"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {file.webViewLink && (
                                        <a
                                            href={file.webViewLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 hover:text-blue-600 transition-colors"
                                            title="Open in Drive"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    {isAdmin && (
                                        <button
                                            onClick={() => openDeleteModal(file)}
                                            className="p-1.5 hover:bg-red-100 rounded text-gray-600 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* LIST VIEW */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredFiles.map(file => (
                                <tr key={file.id} className="hover:bg-blue-50/40 transition-colors group">
                                    <td className="py-3 px-4">
                                        {file.type === 'folder' ? (
                                            <button
                                                onClick={() => handleFolderClick(file)}
                                                className="inline-flex items-center gap-3 font-semibold text-gray-800 hover:text-blue-600 text-left"
                                            >
                                                <Folder className="w-5 h-5 shrink-0" style={{ color: 'var(--theme-primary, #1e88e5)' }} />
                                                <span>{file.name}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedFile(file)}
                                                className="inline-flex items-center gap-3 font-medium text-gray-700 hover:text-blue-600 text-left"
                                            >
                                                {file.type === 'video' ? (
                                                    <VideoIcon className="w-5 h-5 text-purple-500 shrink-0" />
                                                ) : file.mimeType.includes('image') ? (
                                                    <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                                                )}
                                                <span>{file.name}</span>
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-xs text-gray-500 capitalize">
                                        {file.type === 'folder' ? 'Folder' : file.mimeType.split('/').pop()}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {file.type !== 'folder' && (
                                                <button
                                                    onClick={() => setSelectedFile(file)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openRenameModal(file)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                                title="Rename"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {file.webViewLink && (
                                                <a
                                                    href={file.webViewLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                                    title="Open in Drive"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => openDeleteModal(file)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PREVIEW MODAL */}
            {selectedFile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedFile(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-800 text-white">
                            <h3 className="font-semibold truncate max-w-md">{selectedFile.name}</h3>
                            <div className="flex items-center gap-3">
                                {selectedFile.webViewLink && (
                                    <a
                                        href={selectedFile.webViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> Drive Link
                                    </a>
                                )}
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 w-full flex items-center justify-center min-h-[300px]">
                            {selectedFile.type === 'video' ? (
                                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                                    <iframe
                                        src={`https://drive.google.com/file/d/${selectedFile.id}/preview`}
                                        className="w-full h-full"
                                        allow="autoplay"
                                        title={selectedFile.name}
                                    ></iframe>
                                </div>
                            ) : selectedFile.thumbnailLink ? (
                                <img
                                    src={selectedFile.thumbnailLink.replace('=s220', '=s0')}
                                    alt={selectedFile.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="text-slate-300 text-center py-8">
                                    <FileText className="w-16 h-16 mx-auto mb-2 text-slate-500" />
                                    <p className="text-sm">Preview not available for this file type.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE FOLDER MODAL */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FolderPlus className="w-5 h-5 text-emerald-600" /> Create New Folder
                            </h3>
                            <button onClick={() => setShowCreateFolderModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500">
                            Location: <span className="font-semibold text-gray-700">{currentPathString}</span>
                        </p>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Folder Name</label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                placeholder="e.g., Marketing Assets"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowCreateFolderModal(false);
                                    setNewFolderName('');
                                }}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={creatingFolder}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || creatingFolder}
                                className="px-5 py-2 text-sm bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {creatingFolder ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RENAME MODAL */}
            {itemToRename && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-blue-600" /> Rename Item
                            </h3>
                            <button onClick={() => setItemToRename(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">New Name</label>
                            <input
                                type="text"
                                value={renameName}
                                onChange={(e) => setRenameName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setItemToRename(null)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={renaming}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRename}
                                disabled={!renameName.trim() || renaming}
                                className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {renaming ? 'Saving...' : 'Rename'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3 text-red-600 border-b pb-3">
                            <Trash2 className="w-6 h-6" />
                            <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{itemToDelete.name}"</span>? This item will be permanently removed.
                        </p>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setItemToDelete(null)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPLOAD PROGRESS MODAL */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" /> Uploading Files
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {Object.entries(uploadProgress).map(([fileName, info]) => (
                                <div key={fileName} className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-gray-700 truncate max-w-[220px]">{fileName}</span>
                                        <span className={`font-semibold ${info.status === 'success' ? 'text-emerald-600' :
                                                info.status === 'error' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {info.status === 'success' ? 'Completed' :
                                                info.status === 'error' ? 'Failed' : `${info.progress}%`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${info.status === 'success' ? 'bg-emerald-500' :
                                                    info.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                                                }`}
                                            style={{ width: `${info.progress}%` }}
                                        />
                                    </div>
                                    {info.error && <p className="text-[11px] text-red-600">{info.error}</p>}
                                </div>
                            ))}
                        </div>
                        {!uploading && (
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadProgress({});
                                }}
                                className="w-full py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors text-sm"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ACCOUNT CONNECTION MODAL */}
            {showAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5">
                        <div className="flex justify-between items-center border-b pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Google Drive Account Settings</h3>
                                    <p className="text-xs text-gray-500">Connect a separate Google Drive account for this company</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAccountModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${
                            connectionStatus?.connected ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' : 'bg-amber-50/80 border-amber-200 text-amber-800'
                        }`}>
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider block">Status</span>
                                <strong className="text-sm font-bold">
                                    {connectionStatus?.connected
                                        ? 'Connected & Active'
                                        : 'Not Connected (Using Default System Fallback)'}
                                </strong>
                                {connectionStatus?.root_folder_id && (
                                    <span className="block text-[11px] font-mono mt-1 opacity-80">
                                        Root Folder ID: {connectionStatus.root_folder_id}
                                    </span>
                                )}
                            </div>
                            {connectionStatus?.has_custom_connection && (
                                <button
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs rounded-lg transition-colors"
                                >
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                </button>
                            )}
                        </div>

                        {accountSuccessMsg && (
                            <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                                {accountSuccessMsg}
                            </div>
                        )}

                        {/* Database Credentials Form */}
                        <form onSubmit={handleSaveManual} className="space-y-3 border-t pt-4">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Google Drive Connection Parameters
                            </label>
                            
                            <div>
                                <label className="text-xs text-gray-600 font-medium block mb-1">GOOGLE_DRIVE_CLIENT_ID (Optional)</label>
                                <input
                                    type="text"
                                    value={manualClientId}
                                    onChange={(e) => setManualClientId(e.target.value)}
                                    placeholder="Enter Client ID (e.g. 12345...apps.googleusercontent.com)"
                                    className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 font-medium block mb-1">GOOGLE_DRIVE_CLIENT_SECRET (Optional)</label>
                                <input
                                    type="text"
                                    value={manualClientSecret}
                                    onChange={(e) => setManualClientSecret(e.target.value)}
                                    placeholder="Enter Client Secret"
                                    className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 font-medium block mb-1">GOOGLE_DRIVE_REFRESH_TOKEN (Required)</label>
                                <input
                                    type="text"
                                    value={manualToken}
                                    onChange={(e) => setManualToken(e.target.value)}
                                    placeholder="Enter 1//04... OAuth Refresh Token"
                                    className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600 font-medium block mb-1">GOOGLE_DRIVE_FOLDER_ID / Root Folder ID (Optional)</label>
                                <input
                                    type="text"
                                    value={manualFolderId}
                                    onChange={(e) => setManualFolderId(e.target.value)}
                                    placeholder="e.g. 1A2B3C4D5E6F7G8H9I0J"
                                    className="w-full text-xs font-mono p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAccountModal(false)}
                                    className="px-4 py-2 text-xs text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingManual || !manualToken.trim()}
                                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    {savingManual ? 'Saving to DB...' : 'Save Parameters to DB'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
