#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTS文本分段处理器
负责将网页内容处理成适合TTS的分段格式
"""

import re
from typing import List, Dict, Any
from config import TTS_CONFIG, LOGGING_CONFIG


class TTSTextProcessor:
    """TTS文本分段处理器类"""
    
    def __init__(self):
        self.max_segment_length = TTS_CONFIG['MAX_SEGMENT_LENGTH']
        self.min_segment_length = TTS_CONFIG['MIN_SEGMENT_LENGTH']
        self.separators = TTS_CONFIG['SEGMENT_SEPARATORS']
        self.cleanup_chars = TTS_CONFIG['CLEANUP_CHARS']
        self.punctuation_normalize = TTS_CONFIG['PUNCTUATION_NORMALIZE']
        self.verbose = LOGGING_CONFIG['VERBOSE']
    
    def process_content(self, content: str) -> List[str]:
        """
        处理内容为TTS分段格式
        
        Args:
            content: 原始内容文本
            
        Returns:
            List[str]: 分段后的文本数组，每段≤500字符
        """
        try:
            if not content or not isinstance(content, str):
                print("错误：内容为空或格式不正确")
                return []
            
            print(f"开始TTS文本处理，原始长度：{len(content)}字符")
            
            # 1. 文本清洗和规范化
            cleaned_content = self._clean_text(content)
            print(f"文本清洗完成，清洗后长度：{len(cleaned_content)}字符")
            
            # 2. 语音优化处理
            optimized_content = self._optimize_for_speech(cleaned_content)
            print(f"语音优化完成，优化后长度：{len(optimized_content)}字符")
            
            # 3. 智能分段
            segments = self._segment_text(optimized_content)
            print(f"文本分段完成，共{len(segments)}段")
            
            # 4. 段落后处理
            final_segments = self._post_process_segments(segments)
            print(f"后处理完成，最终{len(final_segments)}段")
            
            # 5. 验证分段结果
            self._validate_segments(final_segments)
            
            return final_segments
            
        except Exception as e:
            print(f"TTS文本处理失败: {str(e)}")
            return []
    
    def _clean_text(self, text: str) -> str:
        """
        清洗文本内容
        
        Args:
            text: 原始文本
            
        Returns:
            str: 清洗后的文本
        """
        # 移除特殊字符
        for char in self.cleanup_chars:
            text = text.replace(char, '')
        
        # 规范化标点符号
        for old_punct, new_punct in self.punctuation_normalize.items():
            text = text.replace(old_punct, new_punct)
        
        # 移除多余的空白字符
        text = re.sub(r'\s+', ' ', text)
        
        # 移除行首行尾空白
        text = text.strip()
        
        # 移除重复的标点符号
        text = re.sub(r'([。！？])\1+', r'\1', text)
        text = re.sub(r'([，；：])\1+', r'\1', text)
        
        return text
    
    def _optimize_for_speech(self, text: str) -> str:
        """
        语音合成优化处理
        
        Args:
            text: 清洗后的文本
            
        Returns:
            str: 优化后的文本
        """
        # 数字处理 - 将阿拉伯数字转换为中文读音
        text = self._convert_numbers_to_chinese(text)
        
        # 英文处理 - 在英文单词前后添加空格
        text = re.sub(r'([a-zA-Z]+)', r' \1 ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # URL处理 - 简化URL表达
        text = re.sub(r'https?://[^\s]+', '网址链接', text)
        
        # 特殊符号处理
        symbol_replacements = {
            '&': '和',
            '%': '百分之',
            '@': '艾特',
            '#': '井号',
            '$': '美元',
            '€': '欧元',
            '¥': '人民币',
            '©': '版权',
            '®': '注册商标',
            '™': '商标',
            '°': '度',
            '±': '正负',
            '×': '乘以',
            '÷': '除以',
            '≤': '小于等于',
            '≥': '大于等于',
            '≠': '不等于',
            '≈': '约等于'
        }
        
        for symbol, replacement in symbol_replacements.items():
            text = text.replace(symbol, replacement)
        
        # 移除过多的标点符号
        text = re.sub(r'[^\w\s\u4e00-\u9fff。！？，；：""''（）【】《》]', '', text)
        
        # 清理多余空格
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _convert_numbers_to_chinese(self, text: str) -> str:
        """
        将阿拉伯数字转换为中文读音
        
        Args:
            text: 包含数字的文本
            
        Returns:
            str: 转换后的文本
        """
        # 简单的数字转换（可以根据需要扩展）
        def number_to_chinese(match):
            number = match.group()
            try:
                num = int(number)
                if num == 0:
                    return '零'
                elif num == 1:
                    return '一'
                elif num == 2:
                    return '二' 
                elif num == 3:
                    return '三'
                elif num == 4:
                    return '四'
                elif num == 5:
                    return '五'
                elif num == 6:
                    return '六'
                elif num == 7:
                    return '七'
                elif num == 8:
                    return '八'
                elif num == 9:
                    return '九'
                elif num == 10:
                    return '十'
                else:
                    # 对于复杂数字，保持原样或实现更复杂的转换逻辑
                    return number
            except:
                return number
        
        # 转换单独的数字
        text = re.sub(r'\b\d+\b', number_to_chinese, text)
        
        return text
    
    def _segment_text(self, text: str) -> List[str]:
        """
        智能文本分段
        
        Args:
            text: 待分段的文本
            
        Returns:
            List[str]: 分段后的文本列表
        """
        if len(text) <= self.max_segment_length:
            return [text] if text.strip() else []
        
        segments = []
        current_segment = ""
        
        # 按段落分割
        paragraphs = text.split('\n')
        if len(paragraphs) == 1:
            # 如果没有自然段落，按句子分割
            paragraphs = self._split_by_sentences(text)
        
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            
            # 如果当前段落加上当前段会超出长度限制
            if current_segment and len(current_segment + paragraph) > self.max_segment_length:
                if current_segment.strip():
                    segments.append(current_segment.strip())
                current_segment = paragraph
            else:
                if current_segment:
                    current_segment += " " + paragraph
                else:
                    current_segment = paragraph
            
            # 如果当前段落本身就很长，需要进一步分割
            if len(current_segment) > self.max_segment_length:
                sub_segments = self._split_long_segment(current_segment)
                segments.extend(sub_segments[:-1])
                current_segment = sub_segments[-1] if sub_segments else ""
        
        # 添加最后一段
        if current_segment.strip():
            segments.append(current_segment.strip())
        
        return [seg for seg in segments if len(seg.strip()) >= self.min_segment_length]
    
    def _split_by_sentences(self, text: str) -> List[str]:
        """
        按句子分割文本
        
        Args:
            text: 待分割的文本
            
        Returns:
            List[str]: 句子列表
        """
        # 按句号、感叹号、问号分割
        sentences = re.split(r'[。！？]+', text)
        return [sent.strip() for sent in sentences if sent.strip()]
    
    def _split_long_segment(self, segment: str) -> List[str]:
        """
        分割过长的段落
        
        Args:
            segment: 过长的段落
            
        Returns:
            List[str]: 子段落列表
        """
        if len(segment) <= self.max_segment_length:
            return [segment]
        
        sub_segments = []
        current_pos = 0
        
        while current_pos < len(segment):
            # 计算当前段的结束位置
            end_pos = current_pos + self.max_segment_length
            
            if end_pos >= len(segment):
                # 剩余部分
                sub_segments.append(segment[current_pos:])
                break
            
            # 寻找最佳分割点
            best_split_pos = self._find_best_split_position(
                segment, current_pos, end_pos
            )
            
            sub_segments.append(segment[current_pos:best_split_pos])
            current_pos = best_split_pos
        
        return sub_segments
    
    def _find_best_split_position(self, text: str, start: int, max_end: int) -> int:
        """
        寻找最佳分割位置
        
        Args:
            text: 文本
            start: 开始位置
            max_end: 最大结束位置
            
        Returns:
            int: 最佳分割位置
        """
        # 在指定范围内寻找最佳分割点
        search_range = text[start:max_end]
        
        # 按分隔符优先级寻找分割点
        for separator in self.separators:
            # 从后往前找，优先选择靠后的分割点
            pos = search_range.rfind(separator)
            if pos != -1:
                # 确保分割后的段落不会太短
                split_pos = start + pos + len(separator)
                if split_pos - start >= self.min_segment_length:
                    return split_pos
        
        # 如果找不到合适的分割点，就在最大长度处强制分割
        return max_end
    
    def _post_process_segments(self, segments: List[str]) -> List[str]:
        """
        段落后处理
        
        Args:
            segments: 原始段落列表
            
        Returns:
            List[str]: 处理后的段落列表
        """
        processed_segments = []
        
        for segment in segments:
            segment = segment.strip()
            
            # 跳过空段落
            if not segment:
                continue
            
            # 跳过过短的段落
            if len(segment) < self.min_segment_length:
                # 尝试合并到前一段
                if processed_segments and len(processed_segments[-1] + segment) <= self.max_segment_length:
                    processed_segments[-1] += segment
                    continue
                else:
                    # 如果无法合并且过短，跳过这一段
                    continue
            
            # 确保段落以适当的标点结尾
            if not segment.endswith(('。', '！', '？', '，', '；', '：')):
                segment += '。'
            
            processed_segments.append(segment)
        
        return processed_segments
    
    def _validate_segments(self, segments: List[str]) -> None:
        """
        验证分段结果
        
        Args:
            segments: 分段结果
        """
        if self.verbose:
            total_length = sum(len(seg) for seg in segments)
            max_length = max(len(seg) for seg in segments) if segments else 0
            min_length = min(len(seg) for seg in segments) if segments else 0
            
            print(f"分段验证结果:")
            print(f"  总段数: {len(segments)}")
            print(f"  总字符数: {total_length}")
            print(f"  最长段: {max_length}字符")
            print(f"  最短段: {min_length}字符")
            print(f"  平均长度: {total_length/len(segments):.1f}字符" if segments else "  平均长度: 0字符")
            
            # 检查是否有超长段落
            over_limit = [i for i, seg in enumerate(segments) if len(seg) > self.max_segment_length]
            if over_limit:
                print(f"  警告: 发现{len(over_limit)}个超长段落: {over_limit}")
            
            # 检查是否有过短段落
            under_limit = [i for i, seg in enumerate(segments) if len(seg) < self.min_segment_length]
            if under_limit:
                print(f"  警告: 发现{len(under_limit)}个过短段落: {under_limit}")
    
    def get_segment_statistics(self, segments: List[str]) -> Dict[str, Any]:
        """
        获取分段统计信息
        
        Args:
            segments: 分段列表
            
        Returns:
            Dict: 统计信息
        """
        if not segments:
            return {
                'total_segments': 0,
                'total_characters': 0,
                'average_length': 0,
                'max_length': 0,
                'min_length': 0,
                'over_limit_count': 0,
                'under_limit_count': 0
            }
        
        lengths = [len(seg) for seg in segments]
        
        return {
            'total_segments': len(segments),
            'total_characters': sum(lengths),
            'average_length': sum(lengths) / len(segments),
            'max_length': max(lengths),
            'min_length': min(lengths),
            'over_limit_count': sum(1 for length in lengths if length > self.max_segment_length),
            'under_limit_count': sum(1 for length in lengths if length < self.min_segment_length)
        }