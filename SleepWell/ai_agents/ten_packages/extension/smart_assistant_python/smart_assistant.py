import json
import requests
from datetime import datetime
from ten import (
    AudioFrame,
    VideoFrame,
    Extension,
    TenEnv,
    Cmd,
    StatusCode,
    CmdResult,
)


class SmartAssistantExtension(Extension):
    def __init__(self, name: str):
        super().__init__(name)
        self.api_base = ""
        self.api_key = ""

    def on_init(self, ten_env: TenEnv) -> None:
        ten_env.log_info("SmartAssistantExtension on_init")

        # Get configuration
        config = ten_env.get_property_json("api")
        if config:
            self.api_base = config.get("api_base", "")
            self.api_key = config.get("api_key", "")

        ten_env.log_info(f"API base: {self.api_base}")

    def on_start(self, ten_env: TenEnv) -> None:
        ten_env.log_info("SmartAssistantExtension on_start")

    def on_stop(self, ten_env: TenEnv) -> None:
        ten_env.log_info("SmartAssistantExtension on_stop")

    def on_deinit(self, ten_env: TenEnv) -> None:
        ten_env.log_info("SmartAssistantExtension on_deinit")

    def on_cmd(self, ten_env: TenEnv, cmd: Cmd) -> None:
        cmd_name = cmd.get_name()
        ten_env.log_info(f"SmartAssistantExtension on_cmd: {cmd_name}")

        if cmd_name == "analyze_conversation":
            self._handle_analyze_conversation(ten_env, cmd)
        elif cmd_name == "retrieve_context":
            self._handle_retrieve_context(ten_env, cmd)
        else:
            ten_env.return_result(CmdResult.create(StatusCode.ERROR), cmd)

    def _handle_analyze_conversation(self, ten_env: TenEnv, cmd: Cmd):
        try:
            # Get conversation data
            conversation_text = cmd.get_property_string("conversation_text")
            session_id = cmd.get_property_string("session_id")

            ten_env.log_info(f"Analyzing conversation for session {session_id}")

            # Call backend API to analyze conversation
            analysis_result = self._analyze_conversation_with_api(
                conversation_text, session_id
            )

            # Create response command
            result_cmd = Cmd.create("conversation_analyzed")
            result_cmd.set_property_from_json("todos", json.dumps(analysis_result.get("todos", [])))
            result_cmd.set_property_from_json("mood", json.dumps(analysis_result.get("mood", {})))
            result_cmd.set_property_string("diary_summary", analysis_result.get("diary_summary", ""))

            ten_env.send_cmd(result_cmd)
            ten_env.return_result(CmdResult.create(StatusCode.OK), cmd)

        except Exception as e:
            ten_env.log_error(f"Error analyzing conversation: {str(e)}")
            ten_env.return_result(CmdResult.create(StatusCode.ERROR), cmd)

    def _handle_retrieve_context(self, ten_env: TenEnv, cmd: Cmd):
        try:
            query = cmd.get_property_string("query")
            ten_env.log_info(f"Retrieving context for query: {query}")

            # Call backend API to retrieve context
            context_result = self._retrieve_context_with_api(query)

            # Create response command
            result_cmd = Cmd.create("context_retrieved")
            result_cmd.set_property_from_json("relevant_todos", json.dumps(context_result.get("todos", [])))
            result_cmd.set_property_from_json("relevant_diaries", json.dumps(context_result.get("diaries", [])))
            result_cmd.set_property_from_json("relevant_moods", json.dumps(context_result.get("moods", [])))

            ten_env.send_cmd(result_cmd)
            ten_env.return_result(CmdResult.create(StatusCode.OK), cmd)

        except Exception as e:
            ten_env.log_error(f"Error retrieving context: {str(e)}")
            ten_env.return_result(CmdResult.create(StatusCode.ERROR), cmd)

    def _analyze_conversation_with_api(self, conversation_text: str, session_id: str) -> dict:
        """Enhanced AI analysis with sophisticated prompts"""
        try:
            # Create AI analysis prompt
            analysis_prompt = self._create_analysis_prompt(conversation_text)
            
            # Call backend API with enhanced analysis
            url = f"{self.api_base}/api/analyze-conversation-ai"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            data = {
                "conversation_text": conversation_text,
                "session_id": session_id,
                "analysis_prompt": analysis_prompt,
                "extract_todos": True,
                "analyze_mood": True,
                "create_diary": True
            }

            response = requests.post(url, json=data, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                # Fallback to simple analysis
                return self._fallback_analysis(conversation_text)

        except Exception as e:
            print(f"Enhanced AI analysis failed: {str(e)}")
            return self._fallback_analysis(conversation_text)

    def _create_analysis_prompt(self, conversation_text: str) -> str:
        """Create sophisticated analysis prompt for better AI understanding"""
        return f"""
请分析以下对话内容，并提取以下信息：

对话内容：
{conversation_text}

请按照以下格式返回JSON：
{{
    "todos": [
        {{
            "title": "任务标题",
            "description": "任务描述",
            "priority": "high|medium|low",
            "due_date": "如果提到时间则填写，否则为null",
            "category": "工作|生活|学习|其他"
        }}
    ],
    "mood": {{
        "score": 1-10,
        "emotion": "具体情绪词汇",
        "notes": "情绪分析说明",
        "confidence": "分析置信度0-1"
    }},
    "diary_summary": "对话的核心内容总结，包括重要信息和情感变化",
    "insights": "从对话中获得的深层洞察",
    "suggestions": "基于对话内容的建议"
}}

分析要求：
1. 识别明确的任务和计划
2. 分析情绪状态和变化  
3. 提取关键信息和上下文
4. 提供有价值的洞察
"""

    def _fallback_analysis(self, conversation_text: str) -> dict:
        """Enhanced fallback analysis using rule-based approach"""
        todos = []
        mood = {"score": 5, "emotion": "neutral", "notes": ""}
        diary_summary = ""

        text_lower = conversation_text.lower()
        
        # Extract todos using enhanced keyword detection
        todo_keywords = [
            "需要做", "要做", "计划", "安排", "任务", "工作", 
            "todo", "task", "need to", "should", "must",
            "明天", "下周", "稍后", "记住"
        ]
        
        for keyword in todo_keywords:
            if keyword in text_lower:
                todos.append({
                    "title": f"从对话提取的任务：{keyword}",
                    "description": "基于对话内容自动识别的任务",
                    "priority": "medium",
                    "category": "生活"
                })
                break

        # Enhanced mood analysis
        positive_words = ["开心", "高兴", "兴奋", "满意", "快乐", "great", "happy", "excited", "good"]
        negative_words = ["难过", "沮丧", "生气", "焦虑", "担心", "sad", "angry", "worried", "bad"]
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            mood = {
                "score": min(8, 5 + positive_count),
                "emotion": "积极",
                "notes": "对话中表现出积极情绪",
                "confidence": 0.7
            }
        elif negative_count > positive_count:
            mood = {
                "score": max(2, 5 - negative_count),
                "emotion": "消极", 
                "notes": "对话中表现出消极情绪",
                "confidence": 0.7
            }

        # Create enhanced diary summary
        if len(conversation_text) > 20:
            diary_summary = f"对话记录 - {datetime.now().strftime('%Y-%m-%d')}：{conversation_text[:200]}..."

        return {
            "todos": todos,
            "mood": mood,
            "diary_summary": diary_summary,
            "insights": "基于关键词分析的初步洞察",
            "suggestions": "建议使用更多上下文来提升分析准确性"
        }

    def _retrieve_context_with_api(self, query: str) -> dict:
        """Call backend API to retrieve relevant context"""
        try:
            url = f"{self.api_base}/api/retrieve-context"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            data = {"query": query}

            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()

            return response.json()

        except Exception as e:
            print(f"Context retrieval failed: {str(e)}")
            # Return default empty result
            return {
                "todos": [],
                "diaries": [],
                "moods": []
            }