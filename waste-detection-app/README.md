# Waste Detection System

AI-powered waste detection using YOLOv11 for real-time image and video analysis.

## 🚀 Quick Deploy

### 1. Backend (Render)
- Deploy with Docker from `backend/` directory
- Set Root Directory: `waste-detection-app/backend`
- Environment: Docker
- Copy backend URL after deployment

### 2. Frontend (Vercel)
- Framework: Create React App
- Root Directory: `waste-detection-app/frontend`
- Environment Variable:
  ```
  REACT_APP_API_URL = https://your-backend.onrender.com/api
  ```

## 🛠️ Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

## 📦 Tech Stack

- **Backend:** Flask, YOLOv11, OpenCV, PyTorch
- **Frontend:** React, Axios, CSS3

## 👥 Team

- Felicia Putri Setyawan (722022006)
- Yohanes Yudhistira Mahardika Putra (722022011)
- Sabrina Ayu Agustiani (722022031)

*Universitas Kristen Satya Wacana - Faculty of Information Technology*
