import React, { useState, useEffect, useRef } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import UserLayout from '@/Layouts/UserLayout';
import { Search, MoreVertical, Send, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import moment from 'moment';

export default function ChatIndex() {
    const { auth, users: initialUsers } = usePage().props;
    const currentUser = auth.user;

    const [users, setUsers] = useState(initialUsers);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);
    const pollInterval = useRef(null);
    const usersPollInterval = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Filter + sort users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (a.last_message && b.last_message)
            return new Date(b.last_message.created_at) - new Date(a.last_message.created_at);
        if (a.last_message) return -1;
        if (b.last_message) return 1;
        return 0;
    });

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const fetchUsers = async () => {
        try {
            const res = await axios.get(route('chat.users'));
            setUsers(res.data.users);
        } catch (e) { console.error(e); }
    };

    const fetchMessages = async () => {
        if (!selectedUser) return;
        try {
            const res = await axios.get(route('chat.messages', selectedUser.id));
            setMessages(res.data.messages);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unread_count: 0 } : u));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        usersPollInterval.current = setInterval(fetchUsers, 5000);
        return () => clearInterval(usersPollInterval.current);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages();
            clearInterval(pollInterval.current);
            pollInterval.current = setInterval(fetchMessages, 3000);
        }
        return () => clearInterval(pollInterval.current);
    }, [selectedUser]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;
        try {
            const res = await axios.post(route('chat.send'), {
                receiver_id: selectedUser.id,
                message: newMessage,
                type: 'text'
            });
            setMessages(prev => [...prev, res.data.message]);
            setNewMessage('');
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, last_message: res.data.message } : u
            ));
        } catch (e) { console.error(e); }
    };

    const avatar = (name, url) => url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8f4fd&color=26c6da&bold=true`;

    const formatTime = (dt) => {
        const m = moment(dt);
        const diffDays = moment().diff(m, 'days');
        if (diffDays === 0) return m.format('h:mm A');
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return m.format('dddd');
        return m.format('MMM D');
    };

    const Layout = ['admin', 'manager', 'editor'].includes(currentUser.role) ? AdminLayout : UserLayout;

    return (
        <Layout title="Chat">
            <Head title="Chat" />

            <div style={{
                ...styles.wrapper,
                height: isMobile ? 'calc(100vh - 140px)' : 'calc(100vh - 120px)',
            }}>

                {/* ── LEFT PANEL ── */}
                <div style={{
                    ...styles.leftPanel,
                    display: (isMobile && selectedUser) ? 'none' : 'flex',
                    width: isMobile ? '100%' : 320,
                    minWidth: isMobile ? '100%' : 280,
                }}>

                    {/* My Profile header */}
                    <div style={styles.profileHeader}>
                        <div style={styles.avatarWrap}>
                            <img src={avatar(currentUser.name, currentUser.image_url)} alt="me" style={styles.myAvatar} />
                            <span style={styles.onlineDot} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.myName}>{currentUser.name}</div>
                            <div style={styles.myRole}>{currentUser.designation || currentUser.role}</div>
                        </div>
                        <button style={styles.iconBtn}><MoreVertical size={18} color="#aaa" /></button>
                    </div>

                    {/* Search */}
                    <div style={styles.searchWrap}>
                        <Search size={15} color="#aaa" style={{ marginRight: 8, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search Contact"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    {/* Section label */}
                    <div style={styles.sectionLabel}>Recent Chats</div>

                    {/* User list */}
                    <div style={styles.userList}>
                        {sortedUsers.map(user => {
                            const isActive = selectedUser?.id === user.id;
                            const hasUnread = user.unread_count > 0;
                            const lastMsg = user.last_message;
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    style={{
                                        ...styles.userRow,
                                        background: isActive ? '#f0f8ff' : 'transparent',
                                        borderLeft: isActive ? '3px solid #26c6da' : '3px solid transparent',
                                    }}
                                >
                                    <div style={styles.avatarWrap}>
                                        <img src={avatar(user.name, user.image_url)} alt={user.name} style={styles.userAvatar} />
                                        <span style={{ ...styles.statusDot, background: '#26c6da' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={styles.userRowTop}>
                                            <span style={{ ...styles.userName, fontWeight: hasUnread ? 700 : 500 }}>{user.name}</span>
                                            <span style={styles.userTime}>{lastMsg ? formatTime(lastMsg.created_at) : ''}</span>
                                        </div>
                                        <div style={{ ...styles.userPreview, fontWeight: hasUnread ? 600 : 400, color: hasUnread ? '#26c6da' : '#aaa' }}>
                                            {lastMsg
                                                ? (lastMsg.sender_id === currentUser.id ? `You: ${lastMsg.type === 'text' ? lastMsg.message : 'Sent a file'}` : (lastMsg.type === 'text' ? lastMsg.message : 'Sent a file'))
                                                : 'Tap to chat...'}
                                        </div>
                                    </div>
                                    {hasUnread && <span style={styles.badge}>{user.unread_count}</span>}
                                </div>
                            );
                        })}
                        {sortedUsers.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#ccc', fontSize: 13 }}>No contacts found</div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={{
                    ...styles.rightPanel,
                    display: (isMobile && !selectedUser) ? 'none' : 'flex',
                    width: isMobile ? '100%' : 'auto',
                }}>
                    {selectedUser ? (
                        <>
                            {/* Chat header */}
                            <div style={styles.chatHeader}>
                                {isMobile && (
                                    <button 
                                        onClick={() => setSelectedUser(null)} 
                                        style={{ ...styles.iconBtn, marginRight: 8, padding: 8, background: '#f5f7fa', borderRadius: '50%' }}
                                        title="Back"
                                    >
                                        <ArrowLeft size={18} color="#555" />
                                    </button>
                                )}
                                <div style={styles.avatarWrap}>
                                    <img src={avatar(selectedUser.name, selectedUser.image_url)} alt={selectedUser.name} style={styles.userAvatar} />
                                    <span style={{ ...styles.statusDot, background: '#26c6da' }} />
                                </div>
                                <div>
                                    <div style={styles.chatHeaderName}>{selectedUser.name}</div>
                                    <div style={styles.chatHeaderStatus}>Online</div>
                                </div>
                                <button style={{ ...styles.iconBtn, marginLeft: 'auto' }}>
                                    <MoreVertical size={18} color="#aaa" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div style={styles.messagesArea}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#ccc', marginTop: 40, fontSize: 13 }}>
                                        No messages yet. Say hello! 👋
                                    </div>
                                )}
                                {messages.map((msg, idx) => {
                                    const isMine = msg.sender_id === currentUser.id;
                                    const sender = isMine ? currentUser : selectedUser;
                                    // Show sender label + avatar only for received messages
                                    return (
                                        <div key={msg.id || idx} style={{ marginBottom: 20 }}>
                                            {!isMine && (
                                                <div style={styles.receivedLabel}>
                                                    <img src={avatar(sender.name, sender.image_url)} alt={sender.name} style={styles.msgAvatar} />
                                                    <span style={styles.msgSenderName}>{sender.name}, {moment(msg.created_at).fromNow()}</span>
                                                </div>
                                            )}
                                            {isMine && (
                                                <div style={styles.sentTime}>{moment(msg.created_at).fromNow()}</div>
                                            )}
                                            <div style={isMine ? styles.sentRow : styles.receivedRow}>
                                                {!isMine && <div style={{ width: 36, flexShrink: 0 }} />}
                                                <div style={isMine ? styles.sentBubble : styles.receivedBubble}>
                                                    {msg.type === 'text' && msg.message}
                                                    {msg.type === 'image' && (
                                                        <img src={`/storage/${msg.file_path}`} alt="img" style={{ maxWidth: 200, borderRadius: 10 }} />
                                                    )}
                                                    {msg.type === 'file' && (
                                                        <a href={`/storage/${msg.file_path}`} target="_blank" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                                            📎 View File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={styles.inputBar}>
                                <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="text"
                                        placeholder="Type a Message"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                        style={styles.msgInput}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        style={{ ...styles.sendBtn, opacity: newMessage.trim() ? 1 : 0.4 }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>💬</div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#333', margin: '16px 0 8px' }}>Your Messages</h3>
                            <p style={{ color: '#aaa', fontSize: 13, maxWidth: 240, textAlign: 'center' }}>Select a contact from the left to start a conversation.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        height: 'calc(100vh - 120px)',
        background: '#f5f7fb',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
    },

    /* LEFT */
    leftPanel: {
        width: 320,
        minWidth: 280,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 16px',
        borderBottom: '1px solid #f5f5f5',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    myAvatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' },
    userAvatar: { width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' },
    msgAvatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 10, height: 10, borderRadius: '50%',
        background: '#26c6da', border: '2px solid #fff',
    },
    statusDot: {
        position: 'absolute', bottom: 2, right: 2,
        width: 9, height: 9, borderRadius: '50%',
        border: '2px solid #fff',
    },
    myName: { fontSize: 14, fontWeight: 700, color: '#333' },
    myRole: { fontSize: 12, color: '#aaa', marginTop: 1 },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },

    searchWrap: {
        display: 'flex',
        alignItems: 'center',
        margin: '12px 16px',
        padding: '8px 14px',
        background: '#f5f7fa',
        borderRadius: 24,
        border: '1px solid #eee',
    },
    searchInput: {
        flex: 1, border: 'none', background: 'transparent', outline: 'none',
        fontSize: 13, color: '#555',
    },

    sectionLabel: {
        fontSize: 12, fontWeight: 600, color: '#888',
        padding: '4px 16px 8px', letterSpacing: '0.03em',
    },

    userList: { flex: 1, overflowY: 'auto' },
    userRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer',
        transition: 'background 0.15s',
        borderBottom: '1px solid #fafafa',
    },
    userRowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    userName: { fontSize: 13.5, color: '#333', lineHeight: 1.3 },
    userTime: { fontSize: 11, color: '#bbb', flexShrink: 0 },
    userPreview: { fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
    badge: {
        minWidth: 18, height: 18, borderRadius: 9, background: '#26c6da',
        color: '#fff', fontSize: 10, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px', flexShrink: 0,
    },

    /* RIGHT */
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        overflow: 'hidden',
    },
    chatHeader: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
    },
    chatHeaderName: { fontSize: 14, fontWeight: 700, color: '#333' },
    chatHeaderStatus: { fontSize: 11.5, color: '#26c6da', marginTop: 1 },

    messagesArea: {
        flex: 1, overflowY: 'auto',
        padding: '24px 24px 8px',
        background: '#fff',
    },

    receivedLabel: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginLeft: 0 },
    msgSenderName: { fontSize: 11.5, color: '#aaa' },
    sentTime: { textAlign: 'right', fontSize: 11, color: '#bbb', marginBottom: 4 },

    sentRow: { display: 'flex', justifyContent: 'flex-end' },
    receivedRow: { display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 },

    sentBubble: {
        maxWidth: '65%',
        background: '#e8f4fd',
        color: '#333',
        padding: '10px 16px',
        borderRadius: '18px 18px 4px 18px',
        fontSize: 13.5,
        lineHeight: 1.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    receivedBubble: {
        maxWidth: '65%',
        background: '#f5f7fa',
        color: '#333',
        padding: '10px 16px',
        borderRadius: '18px 18px 18px 4px',
        fontSize: 13.5,
        lineHeight: 1.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    },

    inputBar: {
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
    },
    inputIconBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center',
        transition: 'background 0.15s',
    },
    msgInput: {
        flex: 1, border: 'none', outline: 'none', background: 'transparent',
        fontSize: 13.5, color: '#333', padding: '4px 8px',
    },
    sendBtn: {
        background: '#26c6da', border: 'none', color: '#fff',
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center',
    },

    emptyState: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
    },
    emptyIcon: { fontSize: 48 },
};
