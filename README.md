# Nova - Your AI Memory Companion

Nova is a React-based AI companion that **remembers you**. Unlike standard chatbots that reset every session, Nova uses a simulated Retrieval-Augmented Generation (RAG) system to store and recall facts about your life, preferences, and conversations.

<div align="center">
<img width="800" alt="Nova Interface" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## ✨ Key Features

### 🧠 Long-Term Memory
- **Auto-Extraction**: Nova listens to your conversations and automatically extracts facts (e.g., "I'm allergic to peanuts", "I'm going to Tokyo next week").
- **Context-Aware**: Future responses reference these stored facts to create a personalized experience.
- **Transparency**: View, monitor, and manage stored memories in the side panel.

### 🗣️ Voice Interaction
- **Talk to Nova**: Use the microphone to speak naturally.
- **Hear Nova**: Nova replies with text-to-speech (can be muted via the speaker icon).

### ⚡ Proactive Intelligence
- **Welcome Back**: Nova greets you intelligently when you return, remembering where you left off.
- **Idle Nudges**: If the conversation stalls, Nova asks thoughtful questions to get to know you better.

### 💾 Data Control
- **Import/Export**: Your data belongs to you. Backup your entire "Brain" (memories + chat history) to a JSON file and restore it anytime.
- **Local-First**: All memories are stored in your browser's LocalStorage (simulated vector DB) and processed via Gemini API.

## 🚀 Getting Started

1.  **Clone the repo**
2.  **Install dependencies**:
    > ⚠️ **Note**: This project requires **Node.js 20+** due to `@google/genai` dependencies.
    ```bash
    npm install
    ```
3.  **Configure API Key**:
    -   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    -   Create a `.env.local` file.
    -   Add your Google Gemini API key: `GEMINI_API_KEY=your_key_here`
4.  **Run Locally**:
    ```bash
    npm run dev
    ```
5.  **Build for Production**:
    ```bash
    npm run build
    ```
    (Creates a `dist/` folder with your optimized app).

6.  **Preview Production Build**:
    ```bash
    npm run preview
    ```

## 🛠️ Architecture
Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Google Gemini 2.5 Flash**.
See [architecture.md](architecture.md) for a deep dive into the dual-thread RAG implementation.
