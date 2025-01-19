/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import axiosInstance from '../Config/axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Project = () => {
    const location = useLocation();
    const [showContributors, setShowContributors] = useState(false);
    const [contributors, setContributors] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showUserSelection, setShowUserSelection] = useState(false);
    const [userEmail, setUserEmail] = useState(location.state?.email || 'Unknown User');
    const [userList, setUserList] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState([]);
    const [responseMessage, setResponseMessage] = useState('');
    const [project, setProject] = useState(location.state.project);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axiosInstance.get(
                    `/project/get-project/${location.state?.project?.[0]?._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                setProject(response.data.project);
                setContributors(response.data.project.users || []);
            } catch (error) {
                console.error(error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axiosInstance.get('/users/all-users', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                setUserList(response.data.users);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchProject();
        fetchUsers();
    }, [location.state]);

    const handleUserSelection = async (userId, email) => {
        const isAlreadyInProject = project.users.some((user) => user.email === email);

        if (isAlreadyInProject) {
            toast.info(`${email} is already a contributor!`);
            return;
        }

        try {
            const response = await axiosInstance.put(
                '/project/add-user',
                {
                    projectId: location.state?.project?.[0]?._id,
                    users: [userId],
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            toast.success(`${email} has been added to the project successfully!`);


            setContributors((prev) => [...prev, email]);
            setProject((prev) => ({
                ...prev,
                users: [...prev.users, { _id: userId, email }],
            }));
        } catch (error) {
            console.error('Error adding user:', error);
            toast.error('Failed to add user. Please try again.');
        }
    };

    const toggleContributorsPanel = () => {
        setShowContributors((prev) => !prev);
    };

    const handleAddContributor = () => {
        setShowUserSelection(true);
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { email: userEmail, message: newMessage },
            ]);
            setNewMessage('');
        }
    };

    return (
        <main className="h-screen w-screen flex bg-gray-900 text-white">
            <section className="left w-1/4 bg-gray-800 p-4 flex flex-col shadow-md">
                <header className="mb-4 flex justify-between items-center">
                    <button
                        className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded transition"
                        onClick={toggleContributorsPanel}
                        title="View Contributors"
                    >
                        <i className="ri-group-line text-xl"></i>
                    </button>
                    <button
                        className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded transition"
                        onClick={handleAddContributor}
                        title="Add Contributor"
                    >
                        <i className="ri-user-add-line text-xl"></i>
                    </button>
                </header>

                <div className="flex-grow flex flex-col space-y-4 overflow-y-auto bg-gray-700 p-4 rounded">
                    <h2 className="text-lg font-bold mb-2">Conversation</h2>
                    {messages.length > 0 ? (
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index}>
                                    <p className="text-sm text-blue-400 mb-1">{msg.email}</p>
                                    <div className="py-2 px-3 bg-gray-600 rounded shadow-md text-sm">
                                        {msg.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    )}
                </div>

                <div className="mt-4 flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow py-2 px-4 bg-gray-600 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-500 rounded-r hover:bg-blue-600 transition"
                    >
                        Send
                    </button>
                </div>
            </section>

            <section className="right flex-grow bg-gray-900 p-6 overflow-y-auto relative">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">Project Details</h1>
                </header>

                {showUserSelection ? (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Select a Contributor</h2>
                        {userList.length > 0 ? (
                            <ul className="space-y-2">
                                {userList.map((user, index) => {
                                    const isContributor = contributors.includes(user.email);
                                    return (
                                        <li
                                            key={index}
                                            className={`py-2 px-4 rounded shadow-md cursor-pointer transition ${isContributor
                                                ? 'bg-green-600 hover:bg-green-500'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                                }`}
                                            onClick={() => handleUserSelection(user._id, user.email)}
                                        >
                                            {user.email}
                                            {isContributor && (
                                                <span className="ml-2 text-sm text-white">(Added)</span>
                                            )}
                                        </li>
                                    );
                                })}
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
                                {project.users.map((user) => (
                                    <li
                                        key={user._id}
                                        className="py-2 px-4 rounded shadow-md transition bg-gray-700 hover:bg-gray-600"
                                    >
                                        {user.email}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No contributors found for this project.</p>
                        )}
                        <button
                            onClick={toggleContributorsPanel}
                            className="mt-4 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
                        >
                            Back to Project
                        </button>
                    </div>
                ) : (
                    <div>
                        <p>
                            This is the main content area. You can display project-specific details
                            here, like tasks, updates, or additional features.
                        </p>
                        <pre className="mt-4 bg-gray-800 p-4 rounded text-sm overflow-x-auto">
                            {JSON.stringify(location.state, null, 2)}
                        </pre>
                    </div>
                )}
                {responseMessage && (
                    <div className="mt-4 text-center text-green-500">
                        {responseMessage}
                    </div>
                )}
            </section>
        </main>
    );
};

export default Project;
