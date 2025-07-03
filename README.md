# geminiCLI_onBrowser

### version 0.3.6 rebuild fully in react
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