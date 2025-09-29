import os
import json
import re
from datetime import datetime
from typing import Dict, List, Any
import jieba
from ten_runtime import (
    Extension,
    TenEnv,
    Cmd,
    Data,
    StatusCode,
    CmdResult,
)


class MemoirStorageExtension(Extension):
    def __init__(self, name: str):
        super().__init__(name)
        self.storage_path = "./memoir_data"
        self.user_data = {}
        self.session_id = None
        
        # 小鹿的智能状态管理
        self.xiaolu_state = {
            "mode": "idle",  # idle, memoir_creation, casual_chat
            "current_chapter": None,
            "question_round": 0,  # 当前追问轮数
            "fragment_count": 0,  # 当前章节片段数
            "last_topic": "",     # 上次聊天话题
            "pending_questions": []  # 待追问的问题
        }
        
    def on_init(self, ten_env: TenEnv) -> None:
        ten_env.log_debug("MemoirStorageExtension on_init")
        ten_env.on_init_done()

    def on_start(self, ten_env: TenEnv) -> None:
        ten_env.log_info("[MemoirStorage] Starting memoir storage extension")
        
        # 获取存储路径配置
        try:
            storage_path = ten_env.get_property_string("storage_path")
            if storage_path and isinstance(storage_path, str):
                self.storage_path = storage_path
                ten_env.log_info(f"[MemoirStorage] Using configured storage path: {self.storage_path}")
            else:
                ten_env.log_info(f"[MemoirStorage] Using default storage path: {self.storage_path}")
        except Exception as e:
            ten_env.log_error(f"[MemoirStorage] Failed to get storage_path property: {str(e)}")
            
        # 确保存储目录存在
        try:
            os.makedirs(self.storage_path, exist_ok=True)
            ten_env.log_info(f"[MemoirStorage] Storage directory ready: {self.storage_path}")
        except Exception as e:
            ten_env.log_error(f"[MemoirStorage] Failed to create storage directory: {str(e)}")
        
        ten_env.on_start_done()

    def on_stop(self, ten_env: TenEnv) -> None:
        ten_env.log_debug("MemoirStorageExtension on_stop")
        ten_env.on_stop_done()

    def on_deinit(self, ten_env: TenEnv) -> None:
        ten_env.log_debug("MemoirStorageExtension on_deinit") 
        ten_env.on_deinit_done()

    def on_data(self, ten_env: TenEnv, data: Data) -> None:
        """处理数据输入"""
        data_name = data.get_name()
        ten_env.log_info(f"[MemoirStorage] Received data: {data_name}")
        
        if data_name == "conversation_data":
            ten_env.log_info("[MemoirStorage] Processing conversation_data")
            self._handle_conversation_data(ten_env, data)
        elif data_name == "query_request":
            ten_env.log_info("[MemoirStorage] Processing query_request")
            self._handle_query_request(ten_env, data)
        else:
            ten_env.log_warn(f"[MemoirStorage] Unknown data type: {data_name}")
    
    def _handle_conversation_data(self, ten_env: TenEnv, data: Data):
        """小鹿智能处理对话数据"""
        try:
            user_message = data.get_property_string("user_message")
            assistant_message = data.get_property_string("assistant_message")
            
            ten_env.log_info(f"[小鹿] 收到对话 - 用户: '{user_message[:30] if user_message else 'None'}...', 助手: '{assistant_message[:30] if assistant_message else 'None'}...'")
            
            if not user_message or not assistant_message:
                ten_env.log_warn("[小鹿] 缺少对话内容")
                return
            
            if not self.session_id:
                self.session_id = self._generate_session_id()
                ten_env.log_info(f"[小鹿] 创建新会话: {self.session_id}")
            
            # 小鹿智能判断用户意图
            intent = self._xiaolu_analyze_intent(user_message)
            ten_env.log_info(f"[小鹿] 意图识别: {intent}")
            
            # 根据意图处理对话
            if intent == "memoir_creation":
                self._xiaolu_handle_memoir_creation(ten_env, user_message, assistant_message)
            elif intent == "casual_chat":
                self._xiaolu_handle_casual_chat(ten_env, user_message, assistant_message)
            elif intent == "view_outline":
                self._xiaolu_handle_outline_request(ten_env, user_message, assistant_message)
            else:
                # 默认按回忆录处理
                self._xiaolu_handle_memoir_creation(ten_env, user_message, assistant_message)
            
            # 检查是否需要成文
            self._xiaolu_check_writing_trigger(ten_env)
            
            ten_env.log_info("[小鹿] 对话处理完成")
            
            # 发送响应
            response_data = Data.create("storage_response")
            response_data.set_property_bool("success", True)
            response_data.set_property_from_json("data", json.dumps({
                "session_id": self.session_id,
                "xiaolu_state": self.xiaolu_state
            }))
            ten_env.send_data(response_data)
            
        except Exception as e:
            ten_env.log_error(f"[小鹿] 处理对话失败: {str(e)}")
            import traceback
            ten_env.log_error(f"[小鹿] 错误详情: {traceback.format_exc()}")
    
    def _handle_query_request(self, ten_env: TenEnv, data: Data):
        """处理查询请求"""
        try:
            query_type = data.get_property_string("query_type")
            
            if query_type == "get_outline":
                outline_data = self._get_outline()
                response = Data.create("outline_data")
                response.set_property_from_json("chapters", json.dumps(outline_data.get("chapters", {})))
                response.set_property_int("current_chapter", outline_data.get("current_chapter", 1))
                ten_env.send_data(response)
                
            elif query_type == "get_chapter":
                chapter_id = data.get_property_int("chapter_id")
                chapter_data = self._get_chapter(chapter_id)
                response = Data.create("storage_response")
                response.set_property_bool("success", True)
                response.set_property_from_json("data", json.dumps(chapter_data))
                ten_env.send_data(response)
                
        except Exception as e:
            ten_env.log_error(f"Error handling query request: {str(e)}")

    def _generate_session_id(self) -> str:
        """生成会话ID"""
        return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def _analyze_conversation(self, user_message: str, assistant_message: str) -> Dict:
        """分析对话内容，提取关键信息"""
        analysis = {
            "characters": [],
            "locations": [],
            "timeline": "",
            "emotions": [],
            "key_events": [],
            "themes": []
        }
        
        # 简单的关键词提取（可以后续用更复杂的NLP）
        text = user_message + " " + assistant_message
        
        # 人物识别 (简化版)
        character_patterns = [r'爸爸', r'妈妈', r'爷爷', r'奶奶', r'哥哥', r'姐姐', r'弟弟', r'妹妹', 
                            r'朋友', r'同学', r'老师', r'同事', r'邻居']
        for pattern in character_patterns:
            if re.search(pattern, text):
                analysis["characters"].append(pattern)
        
        # 地点识别
        location_patterns = [r'家里', r'学校', r'公园', r'医院', r'公司', r'老家', r'城市', r'村里']
        for pattern in location_patterns:
            if re.search(pattern, text):
                analysis["locations"].append(pattern)
        
        # 时间线识别
        timeline_patterns = {
            '童年': [r'小时候', r'童年', r'幼儿园', r'小学'],
            '青年': [r'中学', r'高中', r'大学', r'青年'],
            '成年': [r'工作', r'结婚', r'生子', r'成家'],
            '中年': [r'中年', r'四十', r'五十'],
            '老年': [r'退休', r'老年', r'六十', r'七十']
        }
        
        for timeline, patterns in timeline_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    analysis["timeline"] = timeline
                    break
            if analysis["timeline"]:
                break
        
        # 情感识别 (简化版)
        emotion_patterns = {
            '快乐': [r'开心', r'高兴', r'快乐', r'愉快', r'欢乐'],
            '悲伤': [r'难过', r'悲伤', r'伤心', r'痛苦'],
            '怀念': [r'怀念', r'思念', r'回忆', r'想起'],
            '感激': [r'感谢', r'感激', r'感恩'],
            '后悔': [r'后悔', r'遗憾', r'可惜']
        }
        
        for emotion, patterns in emotion_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    analysis["emotions"].append(emotion)
                    break
        
        return analysis
    
    def _save_conversation(self, user_message: str, assistant_message: str, analysis: Dict):
        """保存对话记录"""
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        conversation_record = {
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_message,
            "extracted_info": analysis
        }
        
        if "conversation_history" not in self.user_data:
            self.user_data["conversation_history"] = []
        
        self.user_data["conversation_history"].append(conversation_record)
        self._save_user_data()
    
    def _update_chapters(self, analysis: Dict):
        """根据分析结果更新章节"""
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        if "chapters" not in self.user_data:
            self.user_data["chapters"] = {}
        
        # 确定章节
        timeline = analysis.get("timeline", "未分类")
        chapter_id = self._get_chapter_id_by_timeline(timeline)
        
        if str(chapter_id) not in self.user_data["chapters"]:
            self.user_data["chapters"][str(chapter_id)] = {
                "title": f"{timeline}回忆",
                "timeline": timeline,
                "status": "进行中",
                "content": "",
                "characters": [],
                "locations": [],
                "emotions": [],
                "key_events": [],
                "conversations": []  # 添加对话存储字段
            }
        
        chapter = self.user_data["chapters"][str(chapter_id)]
        
        # 更新章节信息
        for char in analysis.get("characters", []):
            if char not in chapter["characters"]:
                chapter["characters"].append(char)
        
        for loc in analysis.get("locations", []):
            if loc not in chapter["locations"]:
                chapter["locations"].append(loc)
        
        for emotion in analysis.get("emotions", []):
            if emotion not in chapter["emotions"]:
                chapter["emotions"].append(emotion)
        
        # 更新当前章节
        self.user_data["current_chapter"] = chapter_id
        
        self._save_user_data()
    
    def _get_chapter_id_by_timeline(self, timeline: str) -> int:
        """根据时间线获取章节ID"""
        timeline_mapping = {
            "童年": 1,
            "青年": 2, 
            "成年": 3,
            "中年": 4,
            "老年": 5,
            "未分类": 6
        }
        return timeline_mapping.get(timeline, 6)
    
    def _load_user_data(self) -> Dict:
        """加载用户数据"""
        if not self.session_id:
            self.session_id = self._generate_session_id()
            
        file_path = os.path.join(self.storage_path, f"{self.session_id}.json")
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # 创建新的用户数据
            return {
                "user_profile": {
                    "session_id": self.session_id,
                    "created_at": datetime.now().isoformat(),
                    "current_chapter": 1,
                    "current_timeline": "童年"
                },
                "xiaolu_state": {
                    "mode": "idle",
                    "current_chapter": None,
                    "question_round": 0,
                    "fragment_count": 0,
                    "last_topic": "",
                    "pending_questions": []
                },
                "chapters": {},
                "conversation_history": [],
                "casual_chats": [],  # 闲聊记录
                "written_stories": []  # 已成文的故事
            }
    
    def _save_user_data(self):
        """保存用户数据"""
        if not self.session_id:
            return
            
        file_path = os.path.join(self.storage_path, f"{self.session_id}.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(self.user_data, f, ensure_ascii=False, indent=2)
    
    def _get_outline(self) -> Dict:
        """获取大纲"""
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        return {
            "chapters": self.user_data.get("chapters", {}),
            "current_chapter": self.user_data.get("current_chapter", 1),
            "user_profile": self.user_data.get("user_profile", {})
        }
    
    def _get_chapter(self, chapter_id: int) -> Dict:
        """获取特定章节"""
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        return self.user_data.get("chapters", {}).get(str(chapter_id), {})
    
    # ==================== 小鹿的智能功能 ====================
    
    def _xiaolu_analyze_intent(self, user_message) -> str:
        """小鹿分析用户意图"""
        # 确保user_message是字符串
        if isinstance(user_message, tuple):
            user_message = str(user_message[0]) if user_message else ""
        elif not isinstance(user_message, str):
            user_message = str(user_message) if user_message else ""
        
        if not user_message:
            return "casual_chat"
            
        # 回忆录创作关键词
        memoir_keywords = [
            "记录", "回忆", "想起", "小时候", "那时候", "以前", "过去", 
            "童年", "青年", "学生时代", "工作", "结婚", "生子",
            "爸爸", "妈妈", "爷爷", "奶奶", "朋友", "同学",
            "家里", "学校", "老家", "故事", "经历", "往事"
        ]
        
        # 查看大纲关键词
        outline_keywords = [
            "大纲", "进度", "目录", "章节", "看看", "查看", "显示",
            "到哪里了", "聊到哪", "现在的", "当前", "总结"
        ]
        
        # 闲聊关键词（更宽泛）
        casual_keywords = [
            "今天", "明天", "最近", "现在", "刚才", "天气", "吃饭",
            "工作怎么样", "累不累", "休息", "睡觉", "电影", "音乐"
        ]
        
        message_lower = user_message.lower()
        
        # 优先识别查看大纲
        if any(keyword in message_lower for keyword in outline_keywords):
            return "view_outline"
            
        # 识别回忆录创作
        if any(keyword in message_lower for keyword in memoir_keywords):
            return "memoir_creation"
            
        # 识别闲聊（比较宽松的判断）
        if any(keyword in message_lower for keyword in casual_keywords):
            return "casual_chat"
            
        # 如果包含"我"并且是过去式描述，默认为回忆录
        if "我" in message_lower and any(word in message_lower for word in ["了", "过", "曾经", "当时"]):
            return "memoir_creation"
            
        # 默认返回回忆录创作
        return "memoir_creation"
    
    def _xiaolu_handle_memoir_creation(self, ten_env: TenEnv, user_message, assistant_message):
        """小鹿处理回忆录创作"""
        ten_env.log_info("[小鹿] 进入回忆录创作模式")
        
        # 更新小鹿状态
        self.xiaolu_state["mode"] = "memoir_creation"
        
        # 确保消息是字符串
        user_message = str(user_message) if user_message else ""
        assistant_message = str(assistant_message) if assistant_message else ""
        
        # 分析对话内容
        analysis = self._analyze_conversation(user_message, assistant_message)
        
        # 加载用户数据
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        # 保存对话记录到全局历史
        self._save_conversation(user_message, assistant_message, analysis)
        
        # 更新章节
        self._update_chapters(analysis)
        
        # 将对话保存到具体章节中
        if analysis.get("timeline"):
            chapter_id = self._get_chapter_id_by_timeline(analysis["timeline"])
            self.xiaolu_state["current_chapter"] = chapter_id
            
            # 保存对话到章节
            self._save_conversation_to_chapter(chapter_id, user_message, assistant_message, analysis)
            
            # 增加片段计数
            self.xiaolu_state["fragment_count"] += 1
            ten_env.log_info(f"[小鹿] 当前章节片段数: {self.xiaolu_state['fragment_count']}")
        
        # 更新状态到数据中
        self.user_data["xiaolu_state"] = self.xiaolu_state
        self._save_user_data()
    
    def _xiaolu_handle_casual_chat(self, ten_env: TenEnv, user_message, assistant_message):
        """小鹿处理闲聊"""
        ten_env.log_info("[小鹿] 进入闲聊模式")
        
        # 更新小鹿状态
        self.xiaolu_state["mode"] = "casual_chat"
        
        # 确保消息是字符串
        user_message = str(user_message) if user_message else ""
        assistant_message = str(assistant_message) if assistant_message else ""
        
        # 加载用户数据
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        # 保存到闲聊记录
        casual_record = {
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_message,
            "type": "casual_chat"
        }
        
        if "casual_chats" not in self.user_data:
            self.user_data["casual_chats"] = []
        
        self.user_data["casual_chats"].append(casual_record)
        
        # 更新状态
        self.user_data["xiaolu_state"] = self.xiaolu_state
        self._save_user_data()
        
        ten_env.log_info("[小鹿] 闲聊内容已记录")
    
    def _xiaolu_handle_outline_request(self, ten_env: TenEnv, user_message, assistant_message):
        """小鹿处理大纲查看请求"""
        ten_env.log_info("[小鹿] 处理大纲查看请求")
        
        # 确保消息是字符串
        user_message = str(user_message) if user_message else ""
        assistant_message = str(assistant_message) if assistant_message else ""
        
        # 这个功能主要通过LLM的prompt来实现
        # 这里只是记录用户的查看请求
        if not self.user_data:
            self.user_data = self._load_user_data()
        
        # 记录查看请求到对话历史
        outline_record = {
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_message,
            "type": "outline_request"
        }
        
        self.user_data["conversation_history"].append(outline_record)
        self._save_user_data()
    
    def _xiaolu_check_writing_trigger(self, ten_env: TenEnv):
        """小鹿检查是否需要成文"""
        if not self.user_data:
            return
            
        current_chapter = self.xiaolu_state.get("current_chapter")
        if not current_chapter:
            return
            
        fragment_count = self.xiaolu_state.get("fragment_count", 0)
        
        # 检查成文条件：5个片段（更合理的数量）
        if fragment_count >= 5:
            ten_env.log_info(f"[小鹿] 触发成文条件：片段数={fragment_count}")
            self._xiaolu_write_story(ten_env, current_chapter)
        
        # 检查用户是否主动说完了
        # 这个通过LLM在prompt中识别，这里只是记录状态
    
    def _xiaolu_write_story(self, ten_env: TenEnv, chapter_id: int):
        """小鹿自动成文"""
        ten_env.log_info(f"[小鹿] 开始为第{chapter_id}章成文")
        
        chapters = self.user_data.get("chapters", {})
        if str(chapter_id) not in chapters:
            ten_env.log_warn(f"[小鹿] 第{chapter_id}章不存在，无法成文")
            return
        
        chapter = chapters[str(chapter_id)]
        conversations = chapter.get("conversations", [])
        
        if len(conversations) < 3:  # 至少需要3个对话片段
            ten_env.log_info(f"[小鹿] 第{chapter_id}章内容不足，暂不成文")
            return
        
        # 生成故事内容
        story_content = self._xiaolu_generate_story_content(chapter, conversations)
        
        # 创建已成文记录
        written_story = {
            "chapter_id": chapter_id,
            "title": chapter.get("title", f"第{chapter_id}章"),
            "timeline": chapter.get("timeline", "未知时期"),
            "content": story_content,
            "word_count": len(story_content),
            "created_at": datetime.now().isoformat(),
            "fragments_used": len(conversations)
        }
        
        if "written_stories" not in self.user_data:
            self.user_data["written_stories"] = []
        
        self.user_data["written_stories"].append(written_story)
        
        # 更新章节状态
        chapter["status"] = "已成文"
        chapter["written_at"] = datetime.now().isoformat()
        
        # 重置小鹿状态准备下一章
        self.xiaolu_state["fragment_count"] = 0
        self.xiaolu_state["question_round"] = 0
        self.xiaolu_state["current_chapter"] = None
        
        self.user_data["xiaolu_state"] = self.xiaolu_state
        self._save_user_data()
        
        ten_env.log_info(f"[小鹿] 第{chapter_id}章成文完成，字数: {len(story_content)}")
    
    def _xiaolu_generate_story_content(self, chapter: Dict, conversations: List[Dict]) -> str:
        """小鹿生成故事内容"""
        # 按时间顺序整理对话
        sorted_conversations = sorted(conversations, key=lambda x: x.get("turn_id", 0))
        
        story_parts = []
        
        # 开头
        timeline = chapter.get("timeline", "那个时期")
        title = chapter.get("title", "回忆")
        
        story_parts.append(f"## {title}")
        story_parts.append("")
        
        # 根据对话内容生成故事段落
        for conv in sorted_conversations:
            user_text = conv.get("user", "")
            
            # 将用户的第一人称描述转换为第三人称故事
            story_paragraph = self._xiaolu_convert_to_story_format(user_text, timeline)
            
            if story_paragraph:
                story_parts.append(story_paragraph)
                story_parts.append("")  # 段落间空行
        
        # 添加章节信息
        characters = chapter.get("characters", [])
        locations = chapter.get("locations", [])
        emotions = chapter.get("emotions", [])
        
        if characters or locations or emotions:
            story_parts.append("---")
            story_parts.append("")
            if characters:
                story_parts.append(f"**主要人物**: {', '.join(characters)}")
            if locations:
                story_parts.append(f"**主要场所**: {', '.join(locations)}")
            if emotions:
                story_parts.append(f"**情感色彩**: {', '.join(emotions)}")
        
        return "\n".join(story_parts)
    
    def _xiaolu_convert_to_story_format(self, user_text: str, timeline: str) -> str:
        """将用户的第一人称描述转换为故事格式"""
        # 这是一个简化的转换，实际可以更复杂
        if not user_text or len(user_text) < 10:
            return ""
        
        # 简单的文本处理
        story_text = user_text
        
        # 替换第一人称
        story_text = story_text.replace("我", "ta")
        story_text = story_text.replace("我们", "他们")
        
        # 添加时间背景
        if timeline and timeline not in story_text:
            story_text = f"在{timeline}时期，{story_text}"
        
        return story_text
    
    def _save_conversation_to_chapter(self, chapter_id: int, user_message: str, assistant_message: str, analysis: Dict):
        """将对话保存到具体章节中"""
        chapters = self.user_data.get("chapters", {})
        if str(chapter_id) not in chapters:
            return
            
        chapter = chapters[str(chapter_id)]
        if "conversations" not in chapter:
            chapter["conversations"] = []
            
        conversation_record = {
            "turn_id": len(chapter["conversations"]) + 1,
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "assistant": assistant_message,
            "extracted_info": analysis
        }
        
        chapter["conversations"].append(conversation_record)
        
    def _xiaolu_get_context_summary(self) -> str:
        """小鹿获取上下文摘要，用于继续对话"""
        if not self.user_data:
            return "这是我们的第一次对话。"
        
        xiaolu_state = self.user_data.get("xiaolu_state", {})
        current_chapter = xiaolu_state.get("current_chapter")
        fragment_count = xiaolu_state.get("fragment_count", 0)
        last_topic = xiaolu_state.get("last_topic", "")
        
        summary_parts = []
        
        if current_chapter:
            chapters = self.user_data.get("chapters", {})
            if str(current_chapter) in chapters:
                chapter = chapters[str(current_chapter)]
                timeline = chapter.get("timeline", "某个时期")
                summary_parts.append(f"我们正在记录您{timeline}的回忆")
                
                if fragment_count > 0:
                    summary_parts.append(f"已经收集了{fragment_count}个片段")
                
                if last_topic:
                    summary_parts.append(f"上次我们聊到了{last_topic}")
        
        # 检查是否有已成文的故事
        written_stories = self.user_data.get("written_stories", [])
        if written_stories:
            summary_parts.append(f"已经完成了{len(written_stories)}章的成文")
        
        if not summary_parts:
            return "欢迎回来！让我们继续记录您的珍贵回忆吧。"
        
        return "，".join(summary_parts) + "。"
