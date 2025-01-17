import 'dotenv/config';
import app from "./app.js";
import http from "http";

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
