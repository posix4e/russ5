browser.runtime.sendMessage({ greeting: "hello" }).then((response) => {
    console.log("Received response: ", response);
});

// Send a message to the native app with the page's URL and title
// when the page has loaded.
if (window.location.href !== "about:blank") { // Avoid logging blank pages
    browser.runtime.sendMessage({
        type: "logHistory",
        url: window.location.href,
        title: document.title
    }).then((response) => {
        console.log("Response from native (logHistory): ", response);
    }).catch((error) => {
        console.error("Error sending message to native (logHistory): ", error);
    });
}
