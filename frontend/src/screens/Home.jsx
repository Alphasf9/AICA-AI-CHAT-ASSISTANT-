/* eslint-disable no-unused-vars */
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import 'remixicon/fonts/remixicon.css';
import axiosInstance from '../Config/axios';
import { toast } from 'react-toastify';
import '../index.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const { user } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [project, setProject] = useState([]);
    const navigate = useNavigate();

    const openModal = () => setIsModalOpen(true);

    const closeModal = () => {
        setIsModalOpen(false);
        setProjectName('');
    };

    const createProject = async (e) => {
        e.preventDefault();

        if (!projectName.trim()) {
            toast.error('Please enter a valid project name.');
            return;
        }

        try {
            const response = await axiosInstance.post(
                '/project/create-project',
                { name: projectName },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            toast.success(`Project "${response.data.project.name}" created successfully!`);
            setProject((prevProjects) => [...prevProjects, response.data.project]);
            closeModal();
        } catch (error) {
            console.error('Error creating project:', error.message);
            toast.error(
                error.response?.data?.message || 'An error occurred while creating the project.'
            );
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axiosInstance.get('/project/all-projects', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setProject(response.data.projects);
            } catch (error) {
                console.error('Error fetching projects:', error.message);
            }
        };

        fetchProjects();
    }, []);

    return (
        <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-bold mb-6 animate-pulse">
                Welcome, {user ? user.name : 'User'}!
            </h1>
            <div className="flex items-center justify-center">
                <button
                    className="flex items-center bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-600 hover:scale-105 transition-transform duration-300 ease-in-out group focus:ring-4 focus:ring-blue-300"
                    onClick={openModal}
                >
                    <i className="ri-add-line text-2xl mr-2 group-hover:animate-spin"></i>
                    Create New Project
                </button>
            </div>
            <div className="mt-12 p-6 rounded-lg bg-gray-800 shadow-lg w-full max-w-3xl">
                <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
                {project.length > 0 ? (
                    <ul className="space-y-4"
                    onClick={()=>{
                        navigate(`/project/`,{
                            state:{project}
                        })
                    }}
                    >
                        {project.map((proj) => (
                            <li
                                key={proj._id}
                                className="p-4 bg-gray-700 rounded-lg shadow-md relative animate-border"
                            >
                                <div className="flex justify-between items-center">
                                    {/* Project Name */}
                                    <h3 className="text-xl font-semibold">{proj.name}</h3>

                                    {/* Participants Info */}
                                    <div className="flex items-center">
                                        <p className="text-sm text-gray-400 mr-2">
                                            Participants: {proj.users.length}
                                        </p>
                                        
                                        <i className="ri-user-line text-gray-400 text-lg"></i>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-2">ID: {proj._id}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-lg text-gray-300">
                        Your projects will appear here once created.
                    </p>
                )}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label
                                    htmlFor="projectName"
                                    className="block text-gray-400 mb-2"
                                >
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter project name"
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Home;
