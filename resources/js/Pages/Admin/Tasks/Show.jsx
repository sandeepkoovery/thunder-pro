import React, { useState } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Calendar, User, Clock, MessageSquare, Send, ArrowLeft, CheckCircle, AlertCircle, Reply, Trash2 } from "lucide-react";

export default function Show({ task }) {
    const { auth } = usePage().props;
    const [replyingTo, setReplyingTo] = useState(null);

    const buildCommentTree = (comments) => {
        const commentMap = {};
        const roots = [];

        comments.forEach((comment) => {
            commentMap[comment.id] = { ...comment, replies: [] };
        });

        comments.forEach((comment) => {
            if (comment.parent_id) {
                if (commentMap[comment.parent_id]) {
                    commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
                }
            } else {
                roots.push(commentMap[comment.id]);
            }
        });

        return roots;
    };

    const commentTree = buildCommentTree(task.comments);

    const handleDeleteComment = (commentId) => {
        if (confirm("Are you sure you want to delete this comment? This will also delete all its replies.")) {
            router.delete(route("admin.tasks.comments.destroy", commentId), {
                preserveScroll: true,
            });
        }
    };

    const CommentForm = ({ parentId = null, onCancel = null }) => {
        const { data, setData, post, processing, reset, errors } = useForm({
            content: "",
            parent_id: parentId,
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            post(route("admin.tasks.comments.store", task.id), {
                onSuccess: () => {
                    reset();
                    if (onCancel) onCancel();
                },
                preserveScroll: true,
            });
        };

        return (
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <textarea
                        value={data.content}
                        onChange={(e) => setData("content", e.target.value)}
                        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
                        className={`w-full p-4 pr-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${parentId ? 'min-h-[80px]' : 'min-h-[100px]'} resize-none bg-gray-50 focus:bg-white transition-all shadow-sm`}
                        disabled={processing}
                    />
                    <button
                        type="submit"
                        disabled={processing || !data.content.trim()}
                        className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
                {errors.content && (
                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.content}
                    </p>
                )}
                {parentId && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs text-gray-500 hover:text-red-500 mt-2 transition"
                    >
                        Cancel
                    </button>
                )}
            </form>
        );
    };

    const CommentItem = ({ comment, isReply = false }) => {
        const isReplying = replyingTo === comment.id;

        return (
            <div className={`flex gap-4 group ${isReply ? 'ml-12 mt-4' : ''}`}>
                <div className="flex-shrink-0">
                    {comment.user.image_url ? (
                        <img
                            src={comment.user.image_url}
                            alt={comment.user.name}
                            className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border-2 border-white shadow-sm`}
                        />
                    ) : (
                        <div className={`${isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10'} rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm`}>
                            {comment.user.name.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 relative group-hover:bg-blue-50 transition-colors duration-200">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                                {comment.user.name}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(comment.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                        </p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                                className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-blue-600 transition"
                            >
                                <Reply size={14} />
                                Reply
                            </button>

                            <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600 transition"
                                title="Delete Comment"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>

                    {isReplying && (
                        <div className="mt-4">
                            <CommentForm
                                parentId={comment.id}
                                onCancel={() => setReplyingTo(null)}
                            />
                        </div>
                    )}

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="space-y-4">
                            {comment.replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    isReply={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const priorityColors = {
        High: "text-red-600 bg-red-50 border-red-100",
        Medium: "text-yellow-600 bg-yellow-50 border-yellow-100",
        Low: "text-green-600 bg-green-50 border-green-100",
    };

    const statusColors = {
        "not started": "bg-blue-100 text-blue-700",
        "in progress": "bg-purple-100 text-purple-700",
        "on hold": "bg-orange-100 text-orange-700",
        completed: "bg-green-100 text-green-700",
    };

    return (
        <AdminLayout>
            <Head title={`Task: ${task.name}`} />

            <div className="max-w-7xl mx-auto p-6">
                {/* Back Button */}
                <Link
                    href={task.project ? route("admin.projects.show", task.project.id) : route("admin.tasks.index")}
                    className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    {task.project ? `Back to ${task.project.name}` : "Back to Tasks"}
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Task Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                                    {task.name}
                                </h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[task.status] || "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {task.status}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-500" />
                                    <span>
                                        {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-orange-500" />
                                    <span
                                        className={`px-2 py-0.5 rounded border ${priorityColors[task.priority] || "bg-gray-50"
                                            }`}
                                    >
                                        {task.priority} Priority
                                    </span>
                                </div>
                            </div>

                            <div className="prose prose-blue max-w-none text-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {task.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <MessageSquare size={20} className="text-blue-600" />
                                Comments ({task.comments.length})
                            </h3>

                            {/* Comment List */}
                            <div className="space-y-6 mb-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {commentTree.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No comments yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    commentTree.map((comment) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            task={task}
                                            auth={auth}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Main Comment Form */}
                            <div className="mt-8 border-t pt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Leave a comment</h4>
                                <CommentForm task={task} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar Info */}
                    <div className="space-y-6">
                        {/* Project Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                Project
                            </h3>
                            {task.project ? (
                                <div>
                                    <p className="font-semibold text-gray-900 text-lg mb-1">
                                        {task.project.name}
                                    </p>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {task.project.description}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No project assigned</p>
                            )}
                        </div>

                        {/* Assignees */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                Assignees
                            </h3>
                            <div className="space-y-3">
                                {task.assignees && task.assignees.length > 0 ? (
                                    task.assignees.map((assignee) => (
                                        <div key={assignee.id} className="flex items-center gap-3">
                                            {assignee.image_url ? (
                                                <img
                                                    src={assignee.image_url}
                                                    alt={assignee.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                                                    {assignee.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-700">
                                                {assignee.name}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic text-sm">No assignees</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </AdminLayout>
    );
}
