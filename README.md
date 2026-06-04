# Vinum AI - Wine Quality Predictor

基于 PyTorch 神经网络的红酒品质二分类预测器，搭配 React 控制面板与 AI 侍酒师品鉴意见。

## 项目结构

```
├── frontend/          # React + Vite + Express (TypeScript)
│   ├── src/           # React 组件与类型定义
│   ├── server.ts      # Express 中间层 (API 代理 + AI 侍酒师)
│   └── package.json
├── backend/           # Python ML 后端
│   ├── src/           # PyTorch 模型、训练脚本、FastAPI 服务
│   ├── data/          # 红酒数据集
│   └── requirements.txt
├── start.bat          # Windows 一键启动脚本
└── README.md
```

## 快速开始

### 前置条件

- Python 3.9+
- Node.js 18+

### 一键启动 (Windows)

双击运行 `start.bat`

### 手动启动

**1. 后端 (Python)**

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# 训练模型
python -m src.train

# 启动 FastAPI 服务 (port 8000)
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

**2. 前端 (Node.js)**

```bash
cd frontend
cp .env.example .env        # 编辑 .env 填入 API Key
npm install
npm run dev                  # 启动开发服务器 (port 3000)
```

打开浏览器访问 `http://localhost:3000`

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 UI | React 19, Tailwind CSS 4, Radix UI, Recharts, Motion |
| 中间层 | Express (TypeScript), Vite |
| ML 后端 | PyTorch, FastAPI, scikit-learn |
| AI 品鉴 | DeepSeek API (OpenAI 兼容) |
