import { useState } from "react";

function App() {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("gpt-4o-mini");  // Default to cheaper model
    const [length, setLength] = useState("Short");
    const [customPrompt, setCustomPrompt] = useState("");

    const handleSummarize = async () => {
        setLoading(true);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                alert("No active tab found!");
                setLoading(false);
                return;
            }
    
            // Dynamically inject content.js into the active tab
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ["content.js"]
                },
                () => {
                    // Now that content.js is injected, send message to extract text
                    chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, async (response) => {
                        if (response && response.text) {
                            const summary = await getSummary(response.text);
                            setSummary(summary);
                        }
                        setLoading(false);
                    });
                }
            );
        });
    };    

    const getSummary = async (text) => {
        const apiUrl = "https://api.openai.com/v1/chat/completions";
        const storedKey = await chrome.storage.local.get("openaiApiKey");
        const key = storedKey.openaiApiKey || apiKey;

        if (!key) {
            alert("Please enter an API key.");
            return "No API Key!";
        }

        // Generate the summarization prompt based on user selection
        const prompt = customPrompt
            ? customPrompt
            : `Summarize the following text in a ${length.toLowerCase()} format:\n\n${text}`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 500,
            }),
        });

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || "Error fetching summary!";
    };

    return (
        <div className="popup-container">
            <h1>Summarizer</h1>

            <label>Choose AI Model:</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gpt-4o-mini">GPT-4o-mini (Faster & Cheaper)</option>
                <option value="gpt-4o">GPT-4o (Smarter & Better Quality)</option>
            </select>

            <label>Summary Style:</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="Short">Short (Bullet Points)</option>
                <option value="Detailed">Detailed (Paragraphs)</option>
            </select>

            <label>Custom Prompt (Optional):</label>
            <input 
                type="text" 
                placeholder="Enter custom prompt..." 
                value={customPrompt} 
                onChange={(e) => setCustomPrompt(e.target.value)} 
            />

            <button onClick={handleSummarize} disabled={loading}>
                {loading ? "Summarizing..." : "Summarize Page"}
            </button>
            <textarea value={summary} readOnly />
            <input
                type="text"
                placeholder="Enter OpenAI API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            <button onClick={() => chrome.storage.local.set({ openaiApiKey: apiKey })}>
                Save API Key
            </button>
        </div>
    );
}

export default App;
