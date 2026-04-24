<div align="center">
  <h1>🌿 Personal Health Management System</h1>
  <p>基于 Spring Boot 3 + Vue 3 + AI 大模型的前后端分离个人健康管理平台</p>
</div>

<br />

## 📖 项目简介 (Introduction)

**Personal Health Management System** (个人健康管理系统) 是一款现代化、支持智能 AI 代理交互的前后端分离 Web 应用。系统旨在帮助用户记录、追踪并分析个人的健康数据，同时结合前沿的大语言模型（LLM）提供专属的健康咨询与规划建议。

随着该项目全新重构为包含 `feat-ai-agent` 智能助理的版本，用户不仅可以利用系统直观地通过图表查看个人的健康指标，还可以与内嵌的 AI 智能体实时对话，获得科学的饮食、作息和医疗健康辅助建议。

---

## ✨ 核心亮点 (Highlights)

- 🤖 **智能 AI 健康助理 (AI Health Agent)**
  - 基于 `LangChain4j` 接入阿里云通义千问大模型 (`Qwen-plus`)。
  - 通过 `Spring WebFlux` 支持 Server-Sent Events (SSE) 流式对话，实现类似 ChatGPT 的打字机极致丝滑体验。
- 📊 **多维健康数据可视化**
  - 前端利用 `ECharts` 构建丰富的健康数据看板（如图表分析、体重/睡眠监测、阅读学习记录等），健康轨迹一目了然。
- ⚡️ **全场景高性能技术栈**
  - 后端采用最新的 `Java 17` + `Spring Boot 3.1.x` 生态版本。
  - 前端基于 `Vue 3.5` + `Vite` (Rolldown) + `TailwindCSS v4` 打造极致响应的现代化用户界面。
- 🛡 **安全与工程化实践**
  - 采用 **JWT** 无状态认证鉴权，辅以全局异常拦截与数据安全校验设计。
  - **Redis** 提供高速的数据缓存机制；搭配 **阿里云 OSS** 完成用户头像、报告等静态安全存储。
  - 使用 **Knife4j** 标准化生成基于 OpenAPI 3 的接口调试文档。

---

## 🛠 技术栈 (Tech Stack)

### Backend (后端)

- **Core Framework**: Java 17, Spring Boot 3.1.10
- **AI Agent**: LangChain4j, Qwen-plus LLM
- **Database / ORM**: MySQL, MyBatis-Spring, PageHelper
- **Caching & Storage**: Redis, Aliyun OSS
- **Security & APIs**: JWT (java-jwt), Spring Validation, Knife4j OpenAPI 3
- **Streaming**: Spring WebFlux (SSE)

### Frontend (前端)

- **Core Framework**: Vue 3.5 (Composition API), Vue-Router 4
- **State Management**: Pinia + Pinia-plugin-persistedstate
- **Styling**: TailwindCSS 4, Element-Plus 2
- **Data Visualization**: ECharts 6
- **Network & Build tool**: Axios, Vite (rolldown-vite)

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备

- Node.js (v18+ 推荐)
- JDK 17
- MySQL 8.0+
- Redis Server
- 阿里云 DashScope / OSS 相关的 API Keys

### 2. 后端服务启动

1. 导入数据库：在 MySQL 中执行项目中的 `init_health_models.sql` (若存在) 或创建对应库表。
2. 配置参数：复制或修改 `src/main/resources/application.yaml`：
   - 配置 MySQL、Redis 密码连接。
   - 在系统环境变量中配置您的 `DASHSCOPE_API_KEY`（大模型调用必需）和阿里云 OSS 参数。
3. 启动项目：
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### 3. 前端服务启动

1. 进入前端工程目录 `health-frontend-new` 或者相关视图目录：
   ```bash
   npm install
   # 或 pnpm install
   ```
2. 运行本地开发服务器：
   ```bash
   npm run dev
   ```

---

## 🤝 贡献与支持 (Contribution & Support)

欢迎提交 issue 和 pull request。在进行任何较大更改之前，请先新开一个 issue 讨论您想要更改的内容。

如果您喜欢这个项目，欢迎给个 ⭐ **Star** 支持一下！您的鼓励是我持续优化的动力！
