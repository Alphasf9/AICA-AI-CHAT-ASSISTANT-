/* eslint-disable no-unused-vars */
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Ensure toastify CSS is imported
import Project from '../screens/Project';
import UserAuth from '../auth/UserAuth';

const AppRoutes = () => {
    return (
        <Router>
            <ToastContainer />
            <Routes>
                <Route path="/" element={
                    <UserAuth>
                        <Home />
                    </UserAuth>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/project" element={
                    <UserAuth>
                        <Project />
                    </UserAuth>
                } />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
