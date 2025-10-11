#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网页内容提取器测试脚本
用于本地测试WebContentExtractor类的功能
"""

import sys
import os

# 添加当前目录到Python路径，确保可以导入WebContentExtractor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from WebContentExtractor import WebContentExtractor


def test_url_validation():
    """测试URL验证功能"""
    print("=== 测试URL验证功能 ===")
    extractor = WebContentExtractor()
    
    # 测试有效URL
    valid_urls = [
        "https://www.example.com",
        "http://example.com/path",
        "https://sub.domain.com"
    ]
    
    for url in valid_urls:
        result = extractor._validate_url(url)
        print(f"URL: {url} -> 验证结果: {result}")
    
    # 测试无效URL
    invalid_urls = [
        "not-a-url",
        "www.example.com",  # 缺少协议
        "ftp://example.com",  # 不支持FTP
        ""  # 空URL
    ]
    
    for url in invalid_urls:
        result = extractor._validate_url(url)
        print(f"URL: {url} -> 验证结果: {result}")
    
    print()


def test_content_extraction():
    """测试内容提取功能"""
    print("=== 测试内容提取功能 ===")
    extractor = WebContentExtractor()
    
    # 测试URL列表
    test_urls = [
        "https://httpbin.org/html",  # 简单的测试页面
        "https://httpbin.org/json",   # JSON页面（应该失败）
    ]
    
    for url in test_urls:
        print(f"\n测试URL: {url}")
        try:
            result = extractor.extract_content(url)
            print(f"提取成功:")
            print(f"  标题: {result.get('title', 'N/A')}")
            print(f"  内容长度: {result.get('content_length', 0)}")
            print(f"  内容预览: {result.get('content', '')[:200]}...")
        except Exception as e:
            print(f"提取失败: {e}")
    
    print()


def test_error_handling():
    """测试错误处理功能"""
    print("=== 测试错误处理功能 ===")
    extractor = WebContentExtractor()
    
    # 测试无效URL
    try:
        result = extractor.extract_content("invalid-url")
        print("意外成功，结果:", result)
    except ValueError as e:
        print(f"正确捕获验证错误: {e}")
    
    # 测试不存在的URL
    try:
        result = extractor.extract_content("https://this-domain-does-not-exist-12345.com")
        print("意外成功，结果:", result)
    except Exception as e:
        print(f"正确捕获网络错误: {e}")
    
    print()


def test_main_functionality():
    """测试主要功能"""
    print("=== 测试主要功能 ===")
    
    # 模拟云函数事件
    test_events = [
        {
            "body": '{"url": "https://httpbin.org/html"}'
        },
        {
            "url": "https://httpbin.org/html"
        },
        {
            "body": '{"url": ""}'  # 空URL
        },
        {
            "body": '{}'  # 缺少URL参数
        }
    ]
    
    # 导入index模块进行测试
    import index
    
    for i, event in enumerate(test_events):
        print(f"\n测试事件 {i+1}:")
        print(f"事件内容: {event}")
        
        try:
            result = index.main(event, {})
            print(f"状态码: {result.get('statusCode', 'N/A')}")
            print(f"响应体: {result.get('body', 'N/A')}")
        except Exception as e:
            print(f"执行失败: {e}")


def main():
    """主测试函数"""
    print("网页内容提取器测试脚本")
    print("=" * 50)
    
    # 运行各项测试
    test_url_validation()
    test_content_extraction()
    test_error_handling()
    test_main_functionality()
    
    print("=" * 50)
    print("测试完成")


if __name__ == "__main__":
    main()