# 作业大师（Homework Master）

作业大师是一套面向互动式学习场景的网页应用。它将实时音视频、图像识别与大语言模型能力组合在一起，帮助学生上传题目、与 AI 对话并获取解题步骤，让在线辅导更加高效、直观。

## 核心功能

- **聊天对话 + 实时语音**：基于 Agora RTC/RTM 建立房间，支持文本聊天、语音听写与语音播报，AI 回答会自动进入消息流。
- **图片上传与显示**：拖拽或选择本地/网络图片自动上传，并在画面中与摄像头共享，可切换为“图片信号”让 AI 直接“看到”题目。
- **AI 图像识别解题**：一键触发多种提问模版或自定义问题，AI 会基于实时画面调用视觉能力进行分析并返回解释、解题步骤或答案检查。
- **答案输出面板**：右下角的“解题答案”区域自动同步 AI 的最终文本回复，可复制、下载或清空，便于保存和整理学习笔记。
- **主题与布局优化**：提供夜间/日间主题切换，自适应桌面与移动布局，保障长时使用的阅读体验。

## 使用流程

1. 进入页面后使用顶栏的“选择文件”或“网络图片”上传题目截图；需要重新拍摄时可切回摄像头。
2. 在左侧聊天窗口向 AI 提问，例如“请帮我解这道题”。也可以点击图片面板下方的快捷提问按钮。
3. 系统会先确保图像被投送到 RTC 视频流，再通过 RTM 下发分析请求，AI 解析完成后结果会显示在聊天区与“解题答案”面板。
4. 若想保存内容，可在答案面板点击“复制”或“下载”；上传新题时面板会自动清空旧答案。

## 技术架构概览

- **前端框架**：Next.js + React + TypeScript，组件位于 `playground/src/components`。
- **状态管理**：Redux Toolkit（`playground/src/store/reducers/global.ts`），集中处理连接状态、聊天记录、解题答案等。
- **实时通信**：Agora RTC/RTM（`playground/src/manager/rtc`、`playground/src/manager/rtm`），实现音视频流控制及消息传输。
- **AI 能力**：TEN Framework 工具链与 OpenAI Vision 接口（`agents/ten_packages/extension/vision_analyze_tool_python` 等）。

## 代码目录提示

- `playground/src/components/SimpleTest.tsx`：图片上传与 AI 分析入口。
- `playground/src/components/SolutionOutput/index.tsx`：解题答案展示面板。
- `playground/src/components/Dynamic/RTCCard.tsx`：音视频卡片，负责摄像头/屏幕/图片源切换。
- `agents/examples/voice-assistant-video`：TEN graph 与主控逻辑，串联语音、视觉与 LLM。

## 未来可拓展方向

- **多轮上下文记忆**：将历史题目与答案存入知识库，提供复习或关联讲解。
- **题型分类与难度推荐**：自动识别题型并推荐类似练习或讲解视频。
- **多模态输出**：支持生成板书 PDF、语音讲解音频等多种复习资料。
- **协作模式**：允许老师端实时标注或与多名学生同时互动。

欢迎根据业务需求继续扩展。若在部署或二次开发中遇到问题，可在项目结构对应目录下查阅相关组件与扩展包的注释。

