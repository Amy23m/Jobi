// --- DOM Element References ---
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessageContainer = document.getElementById('chat-message');

// UPDATED: Use relative URL for production deployment
const BACKEND_URL = window.location.origin;

// --- Initialize Markdown Converter ---
const converter = new showdown.Converter();

// --- Event Listeners ---
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
window.addEventListener('DOMContentLoaded', checkBackendStatus);

/**
 * Checks if the backend server is running and enables the chat.
 */
async function checkBackendStatus() {
    try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        
        appendMessage("Hello! I'm Jobi, your AI assistant. How can I help you today?", 'bot');
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.placeholder = "Ask me about your career concerns...";
    } catch (error) {
        console.error('Backend check failed:', error);
        displayConnectionError();
    }
}

/**
 * Main function to handle sending a message and receiving a response.
 */
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    const typingIndicator = showTypingIndicator();

    const minDelay = new Promise(resolve => setTimeout(resolve, 500));

    try {
        const [response] = await Promise.all([
            fetch(`${BACKEND_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            }),
            minDelay
        ]);

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        
        const data = await response.json();
        appendMessage(data.reply, 'bot');

    } catch (error) {
        console.error('Error sending message:', error);
        appendMessage('Sorry, I am having trouble connecting. Please try again later.', 'bot', true);
    } finally {
        typingIndicator.remove();
        scrollToBottom();
    }
}

/**
 * Appends a message bubble to the chat window.
 * @param {string} text - The message content.
 * @param {string} type - 'user' or 'bot'.
 * @param {boolean} [isError=false] - If true, applies error styling.
 */
function appendMessage(text, type, isError = false) {
    const msgElem = document.createElement('div');
    msgElem.className = `${type}-message`;
    if (isError) {
        msgElem.classList.add('error');
    }

    // UPDATED: Convert Markdown to HTML for bot messages
    if (type === 'bot') {
        const html = converter.makeHtml(text);
        msgElem.innerHTML = html;
    } else {
        msgElem.textContent = text;
    }
    
    chatMessageContainer.appendChild(msgElem);
    scrollToBottom();
}

/**
 * Creates and displays the typing indicator.
 * @returns {HTMLElement} The indicator element to be removed later.
 */
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessageContainer.appendChild(indicator);
    scrollToBottom();
    return indicator;
}

/**
 * Displays a detailed connection error message in the chat window.
 */
function displayConnectionError() {
    const errorHTML = `
        <div class="status-message error">
            <h4 style="color: #c53030; margin-bottom: 10px; font-size: 16px;">Connection Error: Cannot Reach AI Server</h4>
            <pre style="text-align: left; white-space: pre-wrap; font-size: 13px; line-height: 1.5; font-family: inherit; letter-spacing: normal;">This error means the web page cannot communicate with the Python backend.

Please follow these steps:
1. Open a terminal in your project folder.
2. Make sure all dependencies are installed by running:
   <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px; color: #2d3748;">pip install -r requirements.txt</code>
3. Start the server by running:
   <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px; color: #2d3748;">python app.py</code>
4. Check the terminal for any errors. The server must start without issues.
5. Once the server is running, refresh this page.
            </pre>
        </div>
    `;
    chatMessageContainer.innerHTML += errorHTML;
    chatInput.placeholder = "Connection failed...";
}

/**
 * Scrolls the chat window to the bottom.
 */
function scrollToBottom() {
    chatMessageContainer.scrollTop = chatMessageContainer.scrollHeight;
}

/**
* Hides the chat window (for the close button).
*/
function minimizeChat() {
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) chatWindow.style.display = 'none';
}
