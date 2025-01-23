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
import { getWebContainer } from '../Config/webcontainer';



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
    const [webContainer, setWebContainer] = useState(null)
    const [iFrameUrl, setIFrameUrl] = useState(null)


    

    useEffect(() => {
        const projectId = project?._id;

        if (projectId) {
            const initializeWebContainer = async () => {
                if (!webContainer) {
                    const container = await getWebContainer();
                    setWebContainer(container);
                    console.log("WebContainer started");
                    return container;
                }
                return webContainer;
            };

            // Step 2: Initialize the socket connection
            initializeSocket(projectId);

            // Step 3: Message listener
            const messageListener = async (data) => {
                const cleanMessage = data.message.trim();
                const message = JSON.parse(cleanMessage);
                console.log("Received message:", message);

                if (message.fileTree) {
                    console.log("Found fileTree:", message.fileTree);

                    // Wait for WebContainer to initialize
                    const container = await initializeWebContainer();

                    if (container) {
                        console.log("WebContainer is ready, mounting file tree");
                        try {
                            await container.mount(message.fileTree);
                            setFileTree(message.fileTree);
                        } catch (error) {
                            console.error("Failed to mount file tree:", error);
                        }
                    } else {
                        console.log("WebContainer is still not ready.");
                    }
                } else {
                    console.log("No fileTree found or WebContainer is not ready.");
                }

                setMessages((prev) => [...prev, data]);
            };

            // Step 4: Attach the listener
            receivedMessage('project-message', messageListener);

            // Cleanup on component unmount
            return () => {
                receivedMessage('project-message', null);
            };
        }
    }, [project?._id, initializeSocket, webContainer]);




    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await axiosInstance.get(`/project/get-project/${project._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setProject(response.data.project);
                setFileTree(response.data.project.fileTree);
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

    let currentRunProcess = null;

    const handleRunCode = async () => {
        try {
            // Save the editor content to the fileTree immediately
            if (currentFile && fileTree[currentFile]?.file?.contents) {
                console.log("Saving editor content to fileTree...");
                await setFileTree((prevTree) => ({
                    ...prevTree,
                    [currentFile]: {
                        ...prevTree[currentFile],
                        file: {
                            ...prevTree[currentFile].file,
                            contents: editorOptions, // Ensure this is the actual editor content
                        },
                    },
                }));
            }

            // If there's an ongoing run process, terminate it
            if (currentRunProcess) {
                console.log("Stopping the previous process...");
                await currentRunProcess.kill();
                currentRunProcess = null; // Reset the process tracker
                setIFrameUrl(""); // Clear iframe URL
            }

            // Mount the updated file system to the container with the latest code
            console.log("Mounting updated file system...");
            await webContainer.mount(fileTree);

            // Install dependencies (if needed)
            const installProcess = await webContainer.spawn("npm", ["install"]);
            installProcess.output.pipeTo(
                new WritableStream({
                    write(chunk) {
                        console.log("[Install Output]", chunk);
                    },
                })
            );

            // Start the new process
            console.log("Starting the new process...");
            currentRunProcess = await webContainer.spawn("npm", ["start"]);
            currentRunProcess.output.pipeTo(
                new WritableStream({
                    write(chunk) {
                        console.log("[Server Output]", chunk);
                    },
                })
            );

            // Update iframe URL when the server is ready
            webContainer.on("server-ready", (port, url) => {
                console.log(`Server running at ${url}`);
                setIFrameUrl(url); // Update iframe URL with the new address
            });
        } catch (error) {
            console.error("Error running code:", error);
        }
    };



    async function saveFileTree(ft) {
        try {
            const response = await axiosInstance.put(
                '/project/update-file-tree',
                {
                    projectId: project._id,
                    fileTree: ft,
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                }
            );
            
        } catch (error) {
            console.error('Error saving file tree:', error);
        }
    }





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


            <section className="right bg-red-50 flex-grow flex overflow-hidden">
                {/* File Explorer */}
                <div className="explorer w-1/4 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
                    <div className="files flex flex-col">
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
                                    className="tree-element cursor-pointer p-2 px-4 w-full text-left hover:bg-gray-200 rounded"
                                >
                                    <p className="font-semibold text-lg text-gray-700">{file}</p>
                                </button>
                            ))}
                        </div>
                        <div className="action mt-4">
                            <button
                                onClick={async () => {
                                    alert("Please increase the number by one every time you update the code");
                                    await webContainer.mount(fileTree);
                                    const installProcess = await webContainer?.spawn("npm", ["install"]);
                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            
                                        }
                                    }));
                                    const runProcess = await webContainer?.spawn("npm", ["start"]);
                                    runProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                           
                                        }
                                    }));

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url);
                                        setIFrameUrl(url);
                                    });
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full"
                            >
                                Run
                            </button>
                        </div>
                    </div>
                </div>


                {/* Code Editor */}
                <div className="code-editor-container flex-grow overflow-auto p-4 bg-gray-800">
                    {fileTree[currentFile] && fileTree[currentFile].file ? (
                        <MonacoEditor
                            width="100%"
                            height="600"
                            language="javascript"
                            theme="vs-dark"
                            value={fileTree[currentFile]?.file?.contents || ""}
                            onChange={(newValue) => {
                                const updatedFileTree = {
                                    ...fileTree,
                                    [currentFile]: {
                                        ...fileTree[currentFile],
                                        file: {
                                            ...fileTree[currentFile].file,
                                            contents: newValue, // Update the fileTree with editor content
                                        },
                                    },
                                };
                                setFileTree(updatedFileTree);

                                // Save the updated fileTree to the database
                                saveFileTree(updatedFileTree);
                            }}
                            options={{
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                minimap: { enabled: false },
                                automaticLayout: true,
                            }}
                        />
                    ) : (
                        <div className="text-white text-center">Nothing to showcase</div>
                    )}
                </div>


                {/* Iframe Section */}
                <div className="iframe-container w-1/3 bg-white flex flex-col border-l border-gray-300">
                    <div className="address-bar flex items-center p-2 bg-gray-100 border-b border-gray-300">
                        <input
                            type="text"
                            value={iFrameUrl}
                            onChange={(e) => setIFrameUrl(e.target.value)} // Update iFrameUrl as the user types
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    console.log("Updating iframe URL to:", iFrameUrl);
                                    setIFrameUrl(e.target.value); // Set the iframe URL when the user presses Enter
                                }
                            }}
                            className="w-full p-2 bg-gray-200 text-gray-800 border border-gray-400 rounded"
                            title="Server URL"
                        />
                        <button
                            onClick={async () => {
                                try {
                                    if (currentRunProcess) {
                                        console.log("Stopping the current process...");
                                        await currentRunProcess.kill(); // Kill the running process
                                        currentRunProcess = null;
                                    }
                                    setIFrameUrl(""); // Clear the iframe URL
                                    console.log("Stopped successfully. Ready for updates.");
                                } catch (error) {
                                    console.error("Error stopping the process:", error);
                                }
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition ml-4"
                        >
                            Stop
                        </button>
                    </div>
                    {iFrameUrl ? (
                        <iframe
                            src={iFrameUrl}
                            className="w-full h-full border-0 overflow-auto rounded shadow-md"
                            title="App Preview"
                        ></iframe>
                    ) : (
                        <div className="flex justify-center items-center h-full bg-gray-100 text-gray-500">
                            <p>Server not available. Please start the server again.</p>
                        </div>
                    )}
                </div>
            </section>







            {/* Right Panel */}



        </main>
    );
};

export default Project;
