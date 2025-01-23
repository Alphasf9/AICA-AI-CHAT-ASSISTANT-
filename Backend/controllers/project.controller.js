import { addUsersToProject, createProjectService, getProjectByprojectId, getUserProjects, updateFileTreeByUser } from "../services/project.service.js";
import { validationResult } from 'express-validator'
import User from "../models/user.model.js";



export const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await User.findOne({ email: req.user.email });
        const userId = loggedInUser._id;

        const project = await createProjectService({ name, userId });
        return res.status(201).json({ message: "Project created successfully", project });
    } catch (error) {
        console.error(`Error creating project: ${error.message}`);

        if (error.message.includes("already exists")) {
            return res.status(409).json({ message: error.message });
        }

        return res.status(500).json({ message: "Error creating project" });
    }
};



export const getAllProjects = async (req, res) => {
    try {
        const loggedInUser = await User.findOne({ email: req.user.email });
        const allUsersProjects = await getUserProjects({
            userId: loggedInUser.id,
        })
        return res.status(200).json({ projects: allUsersProjects });
    } catch (error) {
        console.error(`Error getting all projects: ${error.message}`);
        return res.status(500).json({ message: "Error getting all projects" });
    }
}




export const addUserToProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const loggedInUsers = await User.findOne({ email: req.user.email });

        const { projectId, users } = req.body;

        const project = await addUsersToProject({
            projectId,
            users,
            userId: loggedInUsers._id
        })

        return res.status(200).json({ message: "User added to project successfully", project });
    } catch (error) {
        console.error(`Error adding user to project: ${error.message}`);
        return res.status(400).json({ message: "Error adding user to project" });
    }
}



export const getProjectById = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await getProjectByprojectId({ projectId })
        return res.status(200).json({ project });
    } catch (error) {
        console.error(`Error getting project by ID: ${error.message}`);
        return res.status(500).json({ message: "Error getting project by ID" });
    }
}



export const updateFileTree= async(req,res)=>{
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {

        const { projectId, fileTree } = req.body;
        const project = await updateFileTreeByUser({
            projectId,
            fileTree
    });

        return res.status(200).json({ message: "File tree updated successfully", project });
    } catch (error) {
        console.error(`Error updating file tree: ${error.message}`);
        return res.status(500).json({ message: "Error updating file tree" });
    }
}