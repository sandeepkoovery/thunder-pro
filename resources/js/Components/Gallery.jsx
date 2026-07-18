import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderIcon, VideoCameraIcon, ArrowLeftIcon, XMarkIcon, ArrowUpTrayIcon, FolderPlusIcon, TrashIcon } from '@heroicons/react/24/solid';

import { usePage } from '@inertiajs/react';

export default function Gallery() {
    const { auth } = usePage().props;
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderHistory, setFolderHistory] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchFiles = (folderId) => {
        setLoading(true);
        setError(null);
        axios.get(route('google-drive.files'), { params: { folder_id: folderId } })
            .then(response => {
                setFiles(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching files:", err);
                const status = err.response?.status;
                if (status === 401) {
                    setError("Google Drive authentication expired.");
                } else {
                    setError("Failed to load gallery. " + (err.response?.data?.error || "Check your connection and .env settings."));
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchFiles(currentFolderId);
    }, [currentFolderId]);

    const handleFolderClick = (folderId) => {
        setFolderHistory([...folderHistory, currentFolderId]);
        setCurrentFolderId(folderId);
    };

    const handleBackClick = () => {
        const previousFolderId = folderHistory[folderHistory.length - 1];
        setFolderHistory(folderHistory.slice(0, -1));
        setCurrentFolderId(previousFolderId);
    };

    const handleFileClick = (file) => {
        setSelectedFile(file);
    };

    const closeModal = () => {
        setSelectedFile(null);
    };

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setShowUploadModal(true);

        for (const file of selectedFiles) {
            await uploadFile(file);
        }

        setUploading(false);
        setTimeout(() => {
            setShowUploadModal(false);
            setUploadProgress({});
        }, 2000);
    };

    const uploadFile = async (file) => {
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
                        (progressEvent.loaded * 100) / progressEvent.total
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

            // Refresh gallery
            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadProgress(prev => ({
                ...prev,
                [file.name]: { progress: 0, status: 'error', error: err.response?.data?.error || 'Upload failed' }
            }));
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreatingFolder(true);
        try {
            await axios.post(route('google-drive.create-folder'), {
                folder_name: newFolderName,
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

    const handleDelete = (fileId, fileName) => {
        setFileToDelete({ id: fileId, name: fileName });
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;

        setDeleting(true);
        try {
            await axios.delete(route('google-drive.delete'), {
                data: {
                    file_id: fileToDelete.id,
                    parent_folder_id: currentFolderId
                }
            });

            setFileToDelete(null);
            fetchFiles(currentFolderId);
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.response?.data?.error || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-700 text-center mb-4 font-medium italic">
                    {error}
                </p>
                {error.includes("expired") && auth.user.role === 'admin' && (
                    <a
                        href={route('admin.google.auth')}
                        className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-semibold"
                    >
                        Re-authenticate Google Drive
                    </a>
                )}
                {!error.includes("expired") && (
                    <button
                        onClick={() => fetchFiles(currentFolderId)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    {folderHistory.length > 0 && (
                        <button
                            onClick={handleBackClick}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateFolderModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FolderPlusIcon className="h-5 w-5 mr-2" />
                        Create Folder
                    </button>
                    <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                        Upload Files
                    </label>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="text-gray-500 text-center p-4">
                    No media found in this folder.
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                    {files.map(file => (
                        <div key={file.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group relative">
                            {file.type === 'folder' ? (
                                <>
                                    <div
                                        onClick={() => handleFolderClick(file.id)}
                                        className="cursor-pointer flex flex-col items-center justify-center h-40 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <FolderIcon className="h-16 w-16 text-blue-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="mt-2 text-sm font-medium text-gray-700 px-2 text-center truncate w-full">{file.name}</span>
                                    </div>
                                    {auth.user.role === 'admin' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id, file.name);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                            title="Delete folder"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div
                                    className="relative cursor-pointer"
                                    onClick={() => handleFileClick(file)}
                                >
                                    <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                                        {file.type === 'video' ? (
                                            <div className="relative w-full h-40 flex items-center justify-center bg-gray-800 text-white">
                                                <VideoCameraIcon className="h-12 w-12 opacity-80" />
                                                <span className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">Video</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-40 overflow-hidden">
                                                <img
                                                    src={file.thumbnailLink}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2">
                                        <h3 className="text-xs font-medium text-gray-900 truncate" title={file.name}>
                                            {file.name}
                                        </h3>
                                    </div>
                                    {auth.user.role === 'admin' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id, file.name);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 z-10"
                                            title="Delete file"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={closeModal}>
                    <div className="relative max-w-5xl w-full max-h-screen flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 z-50"
                        >
                            <XMarkIcon className="h-8 w-8" />
                        </button>

                        {selectedFile.type === 'video' ? (
                            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                    src={`https://drive.google.com/file/d/${selectedFile.id}/preview`}
                                    className="w-full h-full"
                                    allow="autoplay"
                                    title={selectedFile.name}
                                ></iframe>
                            </div>
                        ) : (
                            <img
                                src={selectedFile.thumbnailLink.replace('=s220', '=s0')}
                                alt={selectedFile.name}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <div className="mt-4 text-white text-center font-medium">
                            {selectedFile.name}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Progress Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Uploading Files</h3>
                        <div className="space-y-4">
                            {Object.entries(uploadProgress).map(([fileName, progress]) => (
                                <div key={fileName} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="truncate flex-1 mr-2">{fileName}</span>
                                        <span className={`font-medium ${progress.status === 'success' ? 'text-green-600' :
                                            progress.status === 'error' ? 'text-red-600' :
                                                'text-blue-600'
                                            }`}>
                                            {progress.status === 'success' ? '✓ Complete' :
                                                progress.status === 'error' ? '✗ Failed' :
                                                    `${progress.progress}%`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${progress.status === 'success' ? 'bg-green-600' :
                                                progress.status === 'error' ? 'bg-red-600' :
                                                    'bg-blue-600'
                                                }`}
                                            style={{ width: `${progress.progress}%` }}
                                        />
                                    </div>
                                    {progress.status === 'error' && progress.error && (
                                        <p className="text-xs text-red-600">{progress.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!uploading && (
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setUploadProgress({});
                                }}
                                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {showCreateFolderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                            placeholder="Enter folder name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateFolderModal(false);
                                    setNewFolderName('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                disabled={creatingFolder}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || creatingFolder}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creatingFolder ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {fileToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Item</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <span className="font-semibold">"{fileToDelete.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setFileToDelete(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
