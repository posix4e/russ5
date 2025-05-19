browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received request: ", request);

    if (request.greeting === "hello") {
        return Promise.resolve({ farewell: "goodbye" });
    }
    
    // Handle other message types
    if (request.type === "logHistory") {
        console.log("Logging history for:", request.url);
        return Promise.resolve({ success: true });
    }
    
    // Default response for unhandled message types
    return Promise.resolve({ success: false, error: "Unhandled message type" });
});
