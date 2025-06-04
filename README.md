# CognitiveChess 🧠♟️

A modern, AI-powered chess application built with React, TypeScript, Electron, and Vite. Play against DeepSeek AI with different difficulty levels and get strategic insights through an interactive chat interface. 🚀

![Chess Application](https://img.shields.io/badge/Chess-AI%20Powered-blue) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue) ![Electron](https://img.shields.io/badge/Electron-30.0.1-lightgrey)

## ✨ Features

- 🤖 **AI-Powered Opponent**: Play against DeepSeek AI with three difficulty levels (Easy, Medium, Hard)
- 🎯 **Interactive Chess Board**: Drag-and-drop interface using react-chessboard
- 💬 **Chat Interface**: Ask questions and get strategic advice from the AI during gameplay
- ✅ **Game Validation**: Full chess rules enforcement using chess.js
- 🖥️ **Cross-Platform**: Desktop application powered by Electron
- 🎨 **Modern UI**: Clean, responsive interface with dark/light theme support
- 🔄 **Game Management**: Restart games, track move history, and detect game end conditions

## 🛠️ Tech Stack

- ⚛️ **Frontend**: React 18 + TypeScript
- ♟️ **Chess Engine**: chess.js for game logic and validation
- 🎮 **Chess UI**: react-chessboard for interactive board display
- 🖥️ **Desktop App**: Electron 30
- ⚡ **Build Tool**: Vite with Hot Module Replacement
- 🤖 **AI Integration**: DeepSeek via OpenRouter API
- 🎨 **Styling**: CSS3 with modern design patterns

## 📋 Prerequisites

Before running the application, you need:

1. 📦 **Node.js** (version 16 or higher)
2. 🔧 **npm** or **yarn** package manager
3. 🔑 **OpenRouter API Key** - Get yours at [openrouter.ai](https://openrouter.ai/)

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CognitiveChess
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your API key**:
   - 🚀 Launch the application
   - ⚙️ Click the gear icon (⚙️) in the top-right corner
   - 🔑 Enter your OpenRouter API key in the settings panel
   - ⚡ Choose your preferred difficulty level

## 🎮 Usage

### 🔥 Running in Development Mode

```bash
npm run dev
```

This starts the Vite development server with hot reloading enabled.

### 📦 Building the Application

```bash
npm run build
```

This compiles TypeScript, builds the React app, and packages it with Electron using electron-builder.

### 🔍 Running Linter

```bash
npm run lint
```

### 👀 Preview Production Build

```bash
npm run preview
```

## 🎯 How to Play

1. 🚀 **Start the Application**: The app launches in fullscreen mode with a chess board on the left and chat interface on the right.

2. ⚙️ **Configure Settings**: 
   - Click the gear icon (⚙️) to open settings
   - Enter your OpenRouter API key
   - Select difficulty level:
     - 🟢 **Easy**: AI plays like a beginner, makes occasional mistakes
     - 🟡 **Medium**: Intermediate level with good moves and some inaccuracies
     - 🔴 **Hard**: Expert level, finds optimal moves and exploits opponent errors

3. ♟️ **Make Your Move**: 
   - You play as White (bottom of the board)
   - Drag and drop pieces to make moves
   - The AI (playing as Black) will respond automatically

4. 💬 **Chat with AI**:
   - Use the chat interface to ask questions about the position
   - Get strategic advice and move explanations
   - Learn chess concepts during gameplay

5. 🎲 **Game Management**:
   - Use the gear menu to start a new game
   - Game automatically detects checkmate, stalemate, and draws
   - Move history is displayed in the chat

## 🔧 API Configuration

The application uses OpenRouter to access DeepSeek AI models:

- ♟️ **Chess Moves**: `deepseek-chat` model for move generation
- 💬 **Chat Responses**: `openai/gpt-4-1106-preview` model for conversations

Make sure your OpenRouter API key has sufficient credits for both models.

## 📁 File Structure

```
CognitiveChess/
├── src/
│   ├── App.tsx              # Main application component
│   ├── openTouterClient.ts    # OpenRouter API integration
│   ├── components/          # CSS files for UI components
│   └── assets/              # Static assets
├── electron/
│   ├── main.ts              # Electron main process
│   └── preload.ts           # Electron preload script
├── public/                  # Public assets
└── dist-electron/           # Built electron files
```

## 🔧 Development Notes

- 🎯 The application uses chess.js for move validation and game state management
- ✅ All moves are validated both client-side and by the AI
- 📍 The AI receives detailed position information including all pieces and their locations
- 🔄 Game state is maintained in React state and synchronized with the chess.js instance

## 🚨 Troubleshooting

**🔑 API Key Issues**:
- Ensure your OpenRouter API key is valid and has sufficient credits
- Check that the key is properly saved in the settings

**❌ Move Validation Errors**:
- The AI occasionally suggests invalid moves; the app automatically retries with additional context
- All moves are validated using chess.js before being applied

**⚡ Performance**:
- AI response time depends on OpenRouter API latency
- The application shows a "thinking" indicator during AI processing

## 🤝 Contributing

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌟 Create a feature branch
3. ✏️ Make your changes
4. 🧪 Run tests and linting
5. 📤 Submit a pull request

## 📄 License

This project is open source. Please check the license file for details.

## 🙏 Acknowledgments

- ♟️ Chess validation powered by [chess.js](https://github.com/jhlywa/chess.js)
- 🎮 Chess board UI by [react-chessboard](https://github.com/Clariity/react-chessboard)
- 🤖 AI capabilities provided by [DeepSeek](https://www.deepseek.com/) via [OpenRouter](https://openrouter.ai/)
- ⚡ Built with [electron-vite](https://electron-vite.org/) template
