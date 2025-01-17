import Project from "../models/project.model.js";
import mongoose from "mongoose";



export const createProjectService = async ({ name, userId }) => {
    if (!name || !userId) {
        throw new Error("Project name or userId is required");
    }

    try {
        const project = await Project.create({ name, users: [userId] });
        return project;
    } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            throw new Error(`Project with name "${name}" already exists.`);
        }
        throw error;
    }
};



export const getUserProjects = async ({ userId }) => {
    try {
        if (!userId) {
            throw new Error("User id is required")
        }
        const projects = await Project.find({ users: userId })
        return projects
    } catch (error) {
        throw error
    }
}



export const addUsersToProject = async ({ users, projectId, userId }) => {
    try {

        if (!projectId) {
            throw new Error("projectId is required")
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new Error("Invalid projectId")
        }

        if (!users) {
            throw new Error("users are required")
        }

        if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
            throw new Error("Invalid userId(s) in users array")
        }

        if (!userId) {
            throw new Error("userId is required")
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid userId")
        }
        const project = await Project.findOne({
            _id: projectId,
            users: userId
        })

        if (!project) {
            throw new Error("You are not a member of this project")
        }

        const updatedProject = await Project.findOneAndUpdate({
            _id: projectId
        }, {
            $addToSet:
            {
                users:
                {
                    $each: users
                }
            }
        }, {
            new: true
        })

        return updatedProject

    } catch (error) {
        throw error
    }
}




export const getProjectByprojectId = async ({ projectId }) => {
    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    const project = await Project.findOne({
        _id: projectId
    }).populate('users')

    return project;
}
