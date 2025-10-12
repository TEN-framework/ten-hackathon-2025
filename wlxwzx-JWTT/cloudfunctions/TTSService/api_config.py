#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API配置文件
存储API Key和其他API相关配置
"""

# 云开发API Key（从环境变量读取，避免硬编码泄露）
import os
CLOUDBASE_API_KEY = os.environ.get('CLOUDBASE_API_KEY', '')

# API网关基础URL模板
# 根据云开发文档，云函数HTTP API调用格式为 {env-id}.api.tcloudbasegateway.com
API_GATEWAY_URL_TEMPLATE = "https://{env_id}.api.tcloudbasegateway.com"

# content-api云函数名称
CONTENT_API_FUNCTION_NAME = "content-api"