const btn = document.getElementById("summarizeBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");
const summaryText = document.getElementById("summaryText");

btn.addEventListener("click", async () => {
    // Disable button and show loading
    btn.disabled = true;
    status.className = "loading";
    status.textContent = "⟳ Extracting page text...";
    result.style.display = "none";

    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Inject content script to extract text
        const [{ result: pageText }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractText,
        });

        if (!pageText || pageText.length < 100) {
            throw new Error("Not enough text found on this page");
        }

        status.textContent = "⟳ Summarizing...";

        // Call our FastAPI backend
        const response = await fetch("http://127.0.0.1:8000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: pageText }),
        });

        if (!response.ok) throw new Error("API error");

        const data = await response.json();

        // Show result
        status.className = "";
        status.textContent = "✓ Done";
        summaryText.textContent = data.summary;
        result.style.display = "block";

    } catch (err) {
        status.className = "error";
        status.textContent = "✗ " + err.message;
    } finally {
        btn.disabled = false;
    }
});

// This function runs inside the page to extract text
function extractText() {
    // Try Gmail first
    const gmailBody = document.querySelector(".a3s");
    if (gmailBody) return gmailBody.innerText;

    // Try article tags
    const article = document.querySelector("article");
    if (article) return article.innerText;

    // Fallback to body text
    const body = document.body.innerText;
    return body.slice(0, 3000);
}