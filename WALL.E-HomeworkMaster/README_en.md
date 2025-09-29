# Homework Master

Homework Master is a web application designed for interactive learning scenarios. It combines real-time audio/video, image understanding, and large language model capabilities so students can upload questions, talk with an AI tutor, and receive step-by-step explanations right away.

## Highlights

- **Conversational tutoring with voice** – Uses Agora RTC/RTM to create live rooms that support text chat, speech input/output, and streaming AI responses.
- **Image upload & presentation** – Drag-and-drop or pick local/remote images. The app can switch the RTC video source to the uploaded picture so the AI literally “sees” the problem.
- **Vision-powered solving** – Built-in prompts (“Explain”, “Check answer”, etc.) and custom questions trigger the AI to analyze the shared frame and produce reasoning or corrections.
- **Answer panel** – The bottom-right “Solution Output” view mirrors the AI’s final textual response and lets users copy, download, or clear it for record keeping.
- **Polished UX** – Light/Night themes, responsive layout, and guided tips help learners focus during long study sessions.

## Typical Workflow

1. Upload a problem image via the upper-right controls (`Choose File` or `Image URL`). Switch back to the camera if you need a new capture.
2. Ask the AI in the chat panel (e.g., “Can you solve this problem?”) or click one of the quick analysis presets below the image area.
3. The system streams the image through RTC, dispatches an RTM request, and the AI returns explanations that appear both in chat and the Solution Output panel.
4. Copy or download the answer as needed. When you upload a new image, the previous solution is cleared automatically.

## Tech Stack Overview

- **Frontend** – Next.js + React + TypeScript (`playground/src/components`).
- **State management** – Redux Toolkit (`playground/src/store/reducers/global.ts`) handles connection status, chat history, and the shared solution text.
- **Realtime infrastructure** – Agora RTC/RTM managers (`playground/src/manager/rtc`, `.../rtm`) coordinate video tracks, image feeds, and messaging.
- **AI integrations** – TEN Framework extensions plus OpenAI Vision (`agents/ten_packages/extension/vision_analyze_tool_python`, etc.).

## Key Directories

- `playground/src/components/SimpleTest.tsx` – Image upload and AI analysis entry point.
- `playground/src/components/SolutionOutput/index.tsx` – Solution display widget.
- `playground/src/components/Dynamic/RTCCard.tsx` – Video module for switching between camera/screen/image sources.
- `agents/examples/voice-assistant-video` – TEN graph and agent logic wiring audio, vision, and LLM capabilities.

## Future Enhancements

- **Session memory** – Persist solved problems and answers for revision.
- **Problem classification** – Detect categories/difficulty and recommend related practice.
- **Multi-format exports** – Generate PDFs, audio walk-throughs, or slides for study packs.
- **Collaborative mode** – Allow teachers or multiple students to interact in the same room.

Feel free to extend the platform based on your scenario. Consult the referenced files if you need to tweak specific features.

