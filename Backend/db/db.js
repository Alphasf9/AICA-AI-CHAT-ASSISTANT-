import mongoose from "mongoose";

function connect() {
    mongoose.connect(process.env.MONGO_URL)
        .then(() => {
            console.log('CONNECTION TO DATABASE ESTABLISHED SUCCESSFULLY');
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error.message);
        });
}

export default connect;
