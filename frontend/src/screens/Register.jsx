/* eslint-disable no-unused-vars */
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../Config/axios';
import { toast } from 'react-toastify';
import { UserContext } from '../context/user.context';


const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext)

    const submitHandler = (e) => {
        e.preventDefault();

        axiosInstance
            .post('/users/register', { email, password })
            .then((res) => {
                console.log(res.data);
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                toast.success('Registered successfully!')
                navigate('/')
            })
            .catch((err) => {
                console.log(err);
                toast.error('Registration failed. Please try again.');
            });
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6 text-center animate-pulse font-primary">
                    Register
                </h2>
                <form onSubmit={submitHandler}>
                    <div className="mb-4 group">
                        <label
                            className="block text-gray-400 mb-2 transition-all duration-300 group-hover:text-white"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500"
                            required
                        />
                    </div>
                    <div className="mb-6 group">
                        <label
                            className="block text-gray-400 mb-2 transition-all duration-300 group-hover:text-white"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-green-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition duration-300 hover:scale-105 focus:ring-2 focus:ring-green-300 hover:animate-wiggle"
                    >
                        Register
                    </button>
                </form>
                <p className="text-gray-400 mt-4 text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-500 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
