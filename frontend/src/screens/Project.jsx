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
import MonacoEditor from 'react-monaco-editor';



const Project = () => {

    const editorOptions = {
        selectOnLineNumbers: true,
        readOnly: false,
        theme: 'Visual Studio Dark',
        fontSize: 14,
        lineHeight: 24,
        wordWrap: 'on',
        wrappingIndent: 'same',
        autoIndent: 'full',
        minimap: {
            enabled: true,
            renderCharacters: false,
        },
        renderLineHighlight: 'line',
        cursorStyle: 'block',
        fontFamily: 'Fira Code, monospace',
        fontWeight: 'normal',
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
        },
        codeLens: true,
        contextmenu: true,
        folding: true,
        formatOnType: true,
        formatOnPaste: true,
        dragAndDrop: true,
        renderWhitespace: 'all',
        quickSuggestions: true,
        autoClosingBrackets: true,
        autoClosingQuotes: true,
        autoSurround: 'languageDefined',
        hover: {
            enabled: true,
        },
        suggestOnTriggerCharacters: true,
        inlineSuggest: true,
    };



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
    const [fileTree, setFileTree] = useState({});

    const [currentFile, setCurrentFile] = useState(null)
    const [openFile, setOpenFile] = useState([]);

    useEffect(() => {
        const projectId = project?._id;

        if (projectId) {
            initializeSocket(projectId);

            const messageListener = (data) => {
                const cleanMessage = data.message.trim();
                const message = JSON.parse(cleanMessage);
                console.log(message);
                if (message.fileTree) {
                    setFileTree(message.fileTree)
                }
                else {
                    console.log("Unable to find file Tree in your response", data.message)
                }

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
                                        <div className="ai-message">
                                            <p className="ai-message-header">AI</p>
                                            <div className="ai-message-content">
                                                {/* Apply typing effect */}
                                                <span className="ai-message-typing">
                                                    <Markdown>{msg.message}</Markdown>
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4">
                                            <p className="text-sm text-blue-400 mb-1">{msg.sender?.email || 'Unknown'}</p>
                                            <div className="py-2 px-3 bg-gray-600 rounded shadow-md text-sm">
                                                {msg.message}
                                            </div>
                                        </div>
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
            {/* Tree Structure */}


            <section className="right bg-red-50 flex-grow flex">
                {/* File Explorer */}
                <div className="explorer w-1/4 bg-gray-100 border-r border-gray-300 p-4">
                    <div className="file-tree w-full">
                        {Object.keys(fileTree).map((file, index) => (
                            <button
                                onClick={() => {
                                    if (!openFile.includes(file)) {
                                        setOpenFile((prevFiles) => [...prevFiles, file]);
                                    }
                                    setCurrentFile(file); // Set this file as the current active file
                                }}
                                key={index}
                                className="tree-element cursor-pointer p-2 px-4 w-full text-left hover:bg-gray-200"
                            >
                                <p className="font-semibold text-lg text-gray-700">{file}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Editor */}
                <div className="code-editor flex-grow p-4">
                    {/* Check if file exists and render Monaco Editor */}
                    {fileTree[currentFile] && fileTree[currentFile].file ? (
                        <MonacoEditor
                            width="100%" 
                            height="600" 
                            language="javascript" 
                            theme="vs" 
                            value={fileTree[currentFile].file.contents || ''} // Initial content for the editor
                            options={editorOptions}
                            onChange={(newValue) => {
                                setFileTree((prevTree) => ({
                                    ...prevTree,
                                    [currentFile]: {
                                        ...prevTree[currentFile],
                                        file: {
                                            ...prevTree[currentFile].file,
                                            contents: newValue, // Update the file contents
                                        },
                                    },
                                }));
                            }}
                        />
                    ) : (
                        <div>Nothing to showcase</div> // Fallback if no file is available
                    )}
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
                        {/* <p>This is the main content area. Display project details or additional features here.</p>
                        <pre className="mt-4 bg-gray-800 p-4 rounded text-sm">
                            <div className="mt-4 flex items-center gap-x-2">
                                <span className="font-bold">Name of the project:</span>
                                <span>{project?.name}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-x-2">
                                <span className="font-bold">Emails:</span>
                                <span>{project?.users?.map(u => u.email).join(', ') || ''}</span>

                            </div>
                        </pre> */}
                    </div>
                )}
            </section>

        </main>
    );
};

export default Project;
