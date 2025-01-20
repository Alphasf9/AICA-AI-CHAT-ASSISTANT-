/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import axiosInstance from '../Config/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initializeSocket, receivedMessage, sendMessage } from '../Config/socket';
import { UserContext } from '../context/user.context';
import Markdown from 'markdown-to-jsx'

const Project = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();

    const [showContributors, setShowContributors] = useState(false);
    const [contributors, setContributors] = useState([]);
    const [messages, setMessages] = useState([]);
    const [socketMessage, setSocketMessage] = useState('');
    const [showUserSelection, setShowUserSelection] = useState(false);
    const [userList, setUserList] = useState([]);
    const [project, setProject] = useState(location.state?.project[0] || {});
    const messageBoxRef = useRef(null);

    useEffect(() => {
        const projectId = project?._id;

        if (projectId) {
            initializeSocket(projectId);

            const messageListener = (data) => {
                setMessages((prev) => [...prev, data]);
            };

            receivedMessage('project-message', messageListener);

            return () => {
                receivedMessage('project-message', null);
            };
        }
    }, [project?._id, initializeSocket, receivedMessage]);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await axiosInstance.get(`/project/get-project/${project._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setProject(response.data.project);
                setContributors(response.data.project.users || []);
            } catch (error) {
                console.error('Error fetching project details:', error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/users/all-users', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setUserList(response.data.users);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (project?._id) {
            fetchProjectDetails();
            fetchUsers();
        }
    }, [project?._id]);

    const handleUserSelection = async (userId, email) => {
        const isAlreadyInProject = contributors.some((user) => user.email === email);
        if (isAlreadyInProject) {
            toast.info(`${email} is already a contributor!`);
            return;
        }

        try {
            await axiosInstance.put(
                '/project/add-user',
                { projectId: project._id, users: [userId] },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            toast.success(`${email} has been added to the project successfully!`);
            setContributors((prev) => [...prev, { _id: userId, email }]);
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error('Failed to add user. Please try again.');
        }
    };

    const send = () => {
        if (socketMessage.trim()) {
            const messageData = { sender: user, message: socketMessage };
            sendMessage('project-message', messageData);
            setMessages((prev) => [...prev, messageData]);
            setSocketMessage('');
        }
    };

    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <main className="h-screen w-screen flex bg-gray-900 text-white">
            {/* Left Panel */}
            <section className="w-1/4 bg-gray-800 p-4 flex flex-col shadow-md">
                <header className="mb-4 flex justify-between items-center">
                    <button
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-center"
                        onClick={() => setShowContributors((prev) => !prev)}
                        title="View Contributors"
                    >
                        <i className="ri-group-line text-xl"></i>
                    </button>
                    <button
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded transition flex items-center justify-center"
                        onClick={() => setShowUserSelection(true)}
                        title="Add Contributor"
                    >
                        <i className="ri-user-add-line text-xl"></i>
                    </button>
                </header>

                {/* Messages Panel */}
                <div
                    ref={messageBoxRef}
                    className="flex-grow flex flex-col space-y-4 overflow-y-auto bg-gray-700 p-4 rounded"
                >
                    <h2 className="text-lg font-bold mb-2">Conversation</h2>
                    {messages.length > 0 ? (
                        messages.map((msg, index) => (
                            <div key={index} className="mb-4">
                                <p className="text-sm text-blue-400 mb-1">{msg.sender?.email || 'Unknown'}</p>
                                <div className="py-2 px-3 bg-gray-600 rounded shadow-md text-sm">
                                    {/* Check if the message is from AI */}
                                    {msg.sender?._id === 'aica' ? (
                                        <Markdown>{msg.message}</Markdown> // Render AI message in Markdown
                                    ) : (
                                        msg.message // For other users, render the message as plain text
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    )}
                </div>

                {/* Message Input */}
                <div className="mt-4 flex items-center">
                    <input
                        type="text"
                        value={socketMessage}
                        onChange={(e) => setSocketMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow py-2 px-4 bg-gray-600 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={send}
                        className="px-4 py-2 bg-blue-500 rounded-r hover:bg-blue-600 transition"
                    >
                        Send
                    </button>
                </div>
            </section>

            {/* Right Panel */}
            <section className="flex-grow bg-gray-900 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">Project Details</h1>
                </header>

                {showUserSelection ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Select a Contributor</h2>
                        {userList.length > 0 ? (
                            <ul className="space-y-2">
                                {userList.map((user) => (
                                    <li
                                        key={user._id}
                                        className={`py-2 px-4 rounded shadow-md cursor-pointer transition ${contributors.some((u) => u.email === user.email) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                        onClick={() => handleUserSelection(user._id, user.email)}
                                    >
                                        {user.email}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No users found.</p>
                        )}
                        <button
                            onClick={() => setShowUserSelection(false)}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                ) : showContributors ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Contributors</h2>
                        {contributors.length > 0 ? (
                            <ul className="space-y-2">
                                {contributors.map((user) => (
                                    <li key={user._id} className="py-2 px-4 rounded shadow-md bg-gray-700">
                                        {user.email}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No contributors found for this project.</p>
                        )}
                        <button
                            onClick={() => setShowContributors(false)}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                        >
                            Back to Project
                        </button>
                    </div>
                ) : (
                    <div>
                        <p>This is the main content area. Display project details or additional features here.</p>
                        <pre className="mt-4 bg-gray-800 p-4 rounded text-sm">
                            {JSON.stringify(project, null, 2)}
                        </pre>
                    </div>
                )}
            </section>
        </main>
    );
};

export default Project;
