// Send a message to the native app with the page's URL, title, and other metadata
// when the page has loaded.
if (window.location.href && window.location.href !== "about:blank") { // Avoid logging blank pages and ensure href exists

    // Helper function to get meta tag content by name or property
    function getMetaContent(attr, value) {
        const element = document.querySelector(`meta[${attr}='${value}']`);
        return element ? element.getAttribute('content') : null;
    }

    // Helper function to get link tag href by rel attribute
    function getLinkHref(relValue) {
        const element = document.querySelector(`link[rel='${relValue}']`);
        return element ? element.getAttribute('href') : null;
    }
    
    // Helper function to resolve a URL (potentially relative) to an absolute URL
    function resolveURL(url) {
        if (!url) return null;
        try {
            // If it's already an absolute URL, the URL constructor will handle it.
            // If it's a relative URL, it will be resolved against document.baseURI.
            return new URL(url, document.baseURI).href;
        } catch (e) {
            // If the URL is invalid or cannot be resolved (e.g., "javascript:void(0)")
            console.warn("Could not resolve URL:", url, e);
            return null;
        }
    }

    // Extract metadata
    let pageDescription = getMetaContent('name', 'description') || getMetaContent('property', 'og:description');
    let previewImageURL = getMetaContent('property', 'og:image');
    
    // Try different favicon types
    let faviconURL = getLinkHref('icon') || getLinkHref('shortcut icon') || getLinkHref('apple-touch-icon');

    // Resolve URLs to be absolute
    previewImageURL = resolveURL(previewImageURL);
    faviconURL = resolveURL(faviconURL);

   let articleText = null;
    try {
        // Clone the document because Readability modifies it
        const documentClone = document.cloneNode(true);
        // Check if Readability is available
        if (typeof Readability === 'undefined') {
            console.warn("Readability.js is not available. Article text extraction skipped.");
            throw new Error("Readability is not defined");
        }
        const reader = new Readability(documentClone);
        const article = reader.parse();
        if (article && article.textContent) {
            articleText = article.textContent.trim();
            // Truncate to a reasonable length (e.g., 2000 characters)
            const maxLength = 2000;
            if (articleText.length > maxLength) {
                articleText = articleText.substring(0, maxLength) + "...";
            }
        }
    } catch (e) {
        console.warn("Readability.js could not parse the article:", e);
    }

    browser.runtime.sendMessage({
        type: "logHistory",
        url: window.location.href,
        title: document.title,
        description: pageDescription,
        previewImageURL: previewImageURL,
        faviconURL: faviconURL,
        articleText: articleText
    }).then((response) => {
        console.log("Response from native (logHistory with metadata & article text): ", response);
    }).catch((error) => {
        console.error("Error sending message to native (logHistory with metadata & article text): ", error);
    });
}
