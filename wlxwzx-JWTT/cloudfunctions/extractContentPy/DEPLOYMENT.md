# Python云函数部署指南

## 概述
这是v0.1.1功能的Python云函数，用于提取网页标题和正文内容。

## 标准文件结构（符合项目规范）
```
extractContentPy/
├── index.py              # 云函数入口文件，包含main方法
├── WebContentExtractor.py # 功能封装类
├── test.py               # 本地测试脚本
├── requirements.txt      # Python依赖
└── DEPLOYMENT.md        # 部署说明
```

**符合项目规则要求的标准结构：**
- `index.py`: 云函数将从index.py中的main方法开始执行
- `WebContentExtractor.py`: 功能封装类
- `test.py`: 可本地调用功能封装类的测试脚本

## 依赖说明
- `requests==2.28.2` - HTTP请求库（兼容OpenSSL 1.0.2k）
- `beautifulsoup4==4.12.2` - HTML解析库

**重要提示**：云函数环境使用的是OpenSSL 1.0.2k，因此需要使用兼容该版本的依赖包。
- requests 2.31.0+ 需要OpenSSL 1.1.1+，不兼容云函数环境
- 使用requests 2.28.2确保与OpenSSL 1.0.2k兼容

**重要修复**：⚠️ **解析器兼容性问题**：由于云函数环境中lxml解析器可能存在兼容性问题，已改用Python内置的`html.parser`解析器，确保在所有环境中稳定运行。

## 算法优化说明

### v0.1.1 内容提取算法优化

#### 1. 智能内容识别算法
- **文本密度分析**：基于文本长度和链接密度识别正文内容
- **链接密度计算**：过滤链接密度高于30%的噪音内容
- **多候选排序**：选择文本最长且链接密度最低的候选内容

#### 2. 段落密度算法
- **段落分组**：将段落按父容器分组
- **容器选择**：选择包含最多段落的容器作为正文
- **质量过滤**：过滤掉太短的段落（少于20字符）

#### 3. 特殊网站结构支持
- **政府网站**：支持 `.zw-content`, `.article-zw`, `.xxgk-content` 等政府网站特定结构
- **新闻网站**：支持 `.news-content`, `.news-detail`, `.detail-content` 等新闻网站结构
- **通用容器**：支持 `article`, `main`, `.content`, `.article-content` 等常见容器

#### 4. 标题提取优化
- **Meta标题优先**：优先提取Open Graph meta标题
- **标题清理**：自动清理标题中的网站名称和分隔符
- **备用标题**：支持从h1标签提取备用标题

#### 5. 备用提取方法
- **文本块提取**：基于文本块质量和链接密度过滤
- **列表项提取**：支持从列表项中提取内容
- **句子过滤**：基于句子长度和质量进行过滤

#### 6. 网络请求优化
- **完善请求头**：模拟真实浏览器访问
- **编码检测**：自动检测和设置正确的字符编码
- **会话管理**：使用Session对象提高请求效率
- **超时设置**：15秒超时，支持重定向

### 部署注意事项
- 确保使用Python 3.9运行时环境
- 入口函数配置为 `index.main`
- 内存配置建议256MB以上
- 超时时间建议30秒以上

## 手动部署步骤（Python云函数）

### 1. 登录云开发控制台
访问：https://console.cloud.tencent.com/tcb

### 2. 进入云函数管理
1. 选择环境：`cloud1-8grkg0ar5f169249`
2. 点击左侧菜单"云函数"
3. 点击"新建云函数"

### 3. 配置云函数
- **函数名称**：`extractContentPy`
- **运行环境**：`Python 3.9`
- **执行方法**：`index.main`
- **超时时间**：60秒
- **内存**：256MB

### 4. 上传代码
1. 选择"本地上传文件夹"
2. 选择 `d:\ai\jwtt_tcb\cloudfunctions\extractContentPy` 目录
3. 点击"上传"

### 5. 安装依赖
由于Python云函数需要手动安装依赖，请执行以下步骤：

#### 方法一：控制台在线安装
1. 在云函数详情页点击"函数代码"
2. 在终端中执行：
```bash
pip install -r requirements.txt -t .
```

#### 方法二：本地安装后上传
1. 在本地执行：
```bash
cd d:\ai\jwtt_tcb\cloudfunctions\extractContentPy
pip install -r requirements.txt -t .
```
2. 将整个目录（包含安装的依赖）打包上传

### 6. 测试函数
1. 点击"测试"
2. 使用以下测试事件：
```json
{
  "url": "https://www.example.com"
}
```
3. 检查返回结果

## 函数接口说明

### 请求参数
```json
{
  "url": "要提取内容的网页URL"
}
```

### 返回结果
```json
{
  "code": 200,
  "message": "提取成功",
  "data": {
    "url": "原始URL",
    "title": "网页标题",
    "content": "正文内容",
    "content_length": 内容长度
  }
}
```

## 错误处理
- 400：URL参数缺失或格式错误
- 500：网络请求或解析失败

## 注意事项
1. Python云函数部署后需要手动安装依赖
2. 确保依赖版本与requirements.txt一致
3. 测试时使用有效的HTTP/HTTPS URL
4. 函数超时时间设置为60秒以适应网络延迟

## 前端调用方式
前端通过云开发SDK调用：
```javascript
const result = await app.callFunction({
  name: 'extractContentPy',
  data: { url: 'https://example.com' }
});
```