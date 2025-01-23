import { WebContainer } from '@webcontainer/api';

let webContainerInstance = null;
let webContainerReady = false;

export const getWebContainer = async () => {
    if (webContainerInstance === null) {
        try {
            webContainerInstance = await WebContainer.boot();
            webContainerReady = true;  // Mark as ready
            console.log("WebContainer initialized successfully");
        } catch (error) {
            console.error("Failed to initialize WebContainer:", error);
            webContainerReady = false;  // In case of error, mark as not ready
        }
    }
    return webContainerInstance;
};

// New function to ensure WebContainer is ready before continuing
export const waitForWebContainer = async () => {
    if (!webContainerReady) {
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (webContainerReady) {
                    clearInterval(interval);
                    resolve();
                }
            }, 500); // Check every 500ms
        });
    }
};
