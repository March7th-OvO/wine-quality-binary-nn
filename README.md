# Vinum AI - Wine Quality Predictor

## 项目简介

本项目为红酒品质二分类预测器，基于 PyTorch 神经网络，输入红酒的 11 项理化指标（酸度、糖分、酒精度、pH 值等）进行品质预测。前端使用 React 搭建交互式控制面板，通过滑块调节各项指标参数；后端使用 FastAPI 提供推理接口；并接入 DeepSeek API，根据预测结果生成 AI 品鉴意见。

**主要功能**
- PyTorch 神经网络：二分类预测红酒品质
- React 控制面板：滑块调节 11 项理化指标，实时查看预测结果
- 数据可视化：指标分布雷达图与预测置信度展示
- AI 品鉴：通过 DeepSeek API 自动生成品鉴评语

**技术栈**
- 前端：React 19 + Tailwind CSS 4 + Recharts + Radix UI
- 后端：FastAPI + PyTorch + scikit-learn
- AI：DeepSeek API（OpenAI 兼容格式）
- 中间层：Express（TypeScript）+ Vite

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

## 📄 许可

本项目基于 [MIT License](LICENSE) 开源。
