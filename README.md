# geminiCLI_onBrowser

### version 0.3.7 feat(context): Implement current page text analysis
This completes Phase 3, "Context-Aware Capability."

- Adds a checkbox to the UI allowing users to include text from the current webpage as context for their prompt.
- Implements a robust communication flow between the UI, background script, and the active tab using chrome.scripting.executeScript.
- The background script now orchestrates the process: it retrieves page text upon request, combines it with the user's prompt, and sends the final context-aware prompt to the native application.
- This new feature enables more powerful and contextually relevant commands, such as summarizing the current page.

### version 0.3.6 feat(ux): Implement prompt history and auto-copy features
This completes Phase 2, "User Experience Enhancements."

- Added a prompt history feature that saves recent commands to chrome.storage and displays them in a list for easy reuse.
- Implemented a feature to automatically copy the AI's response to the clipboard upon completion and display a confirmation message.
- Fixed a critical bug that caused infinite loading and disabled buttons by ensuring the native app sends a "success" signal, which stabilizes the entire feature.

### version 0.3.5 feat(ui): Complete side panel architecture and functionality
Deprecate the popup-based prototype and transition to a new, stable architecture using Chrome's sidePanel API. This approach ensures compliance with Google's policies while providing a robust user experience.

Key Changes:
- Introduce a modern frontend stack with Vite, React, and Tailwind CSS.
- Stabilize communication between the background script and UI using long-lived connections.
- Implement the prompt history feature using chrome.storage.
- Resolve numerous environment setup, build, and native messaging errors on Windows.

This commit establishes the functional baseline for version 0.3.5, enabling users to interact with the local AI engine through a stable browser interface.

### 0.3v refactoring UI to sidepanel, as React 250702

### set browser extention  0.2v 250628
### geminiCLI_onBrowser 0.1v 250628
### set gemini_ClI in python 250627