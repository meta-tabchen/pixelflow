# PixelFlow 🎨⚡

**PixelFlow** is a professional-grade AI visual creation engine that reimagines image generation through a node-based workflow. Designed for concept artists, designers, and prompt engineers, it leverages the power of Gemini 3 and Imagen models to turn complex ideas into structured, repeatable creative pipelines.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini_3_Flash/Pro-purple.svg)

---

## ✨ Key Features

### 🧩 Node-Based Workflow
Build complex generation chains using a flexible canvas powered by **ReactFlow**. Connect text prompts, image inputs, and generation nodes to create visual logic.
- **Node Grouping:** Organize your workspace by grouping related nodes.
- **Topological Execution:** Run entire groups in order, with data flowing from one node to the next.
- **Import/Export:** Save your best setups as templates in your local Workflow Library.

### 📸 Camera Director
The industry-first **Camera Director** panel gives you cinematic control over your generations.
- **Framing:** Extreme Wide Shot, Close-Up, Macro, and more.
- **Angles:** Overhead, Bird's Eye, Low Angle, POV.
- **Motion:** Pan, Tilt, Dolly Zoom, Handheld, Orbit.

### 🪄 Prompt Magic & Slash Commands
- **Magic Optimize:** Use Gemini 3 to expand simple ideas into detailed, high-fidelity prompts with a single click (Ctrl+1).
- **Slash Commands:** Quickly inject complex parameters like "Cinematic Lighting" or "9-Grid Storyboard" using the `/` menu.

### 🖼️ Integrated Image Tools
- **In-Canvas Editing:** Annotate or draw on generated results using the built-in Fabric.js editor.
- **Vision Analysis:** Use Gemini's multimodal capabilities to describe existing images or extract prompts from visual references.
- **Gallery & History:** Every generation is automatically saved locally with full metadata (prompt, model, camera settings).

---

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Canvas Engine:** ReactFlow
- **AI Integration:** Google GenAI SDK (Gemini 3 Pro/Flash, Imagen 4)
- **Image Processing:** Fabric.js
- **Local Storage:** IndexedDB (via idb-keyval)
- **Icons:** Lucide React

---

## 🛠️ Getting Started

### Prerequisites
You will need a Google Gemini API Key. Get one at [AI Studio](https://aistudio.google.com/).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pixelflow.git
   cd pixelflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📖 Usage Guide

1. **Creating a Project:** Start from the Dashboard and create a new Canvas.
2. **Adding Nodes:** Use the floating sidebar to add `Text`, `Generation`, or `Upload` nodes.
3. **Connecting Logic:** Drag handles to connect a prompt to a generator, or a generator result as a reference for the next one.
4. **Cinematic Control:** Click the "Camera" button on a generation node to apply specific cinematography styles.
5. **Execution:** Hit the "Generate" arrow. Watch your workflow resolve in real-time.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

- Built for the next generation of AI creators.
- Powered by Google Gemini.
- Inspired by node-based tools like ComfyUI and Blender.

---

Developed with ❤️ by the **pixelflow** team.