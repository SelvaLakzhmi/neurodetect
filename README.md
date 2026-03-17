# 🧠 Alzheimer’s Detector Project  
## 📘 Setup & Execution Guide

---

## 📦 Project Setup

1. Download and extract the project ZIP file.
2. Place it in your desired directory.

Example:
D:\Projects\Alzheimer's Detector\

---

## 🌐 Run the Frontend (Next.js)

### Prerequisites
- Install Node.js (LTS recommended)

### Verify Installation
```bash
node --version
npm --version
```

### Steps
```bash
cd "D:\Projects\Alzheimer's Detector\Web App"
npm install
npm run dev
```

### Access Application
http://localhost:3000/

---

## 🤖 Run the Backend (FastAPI AI Service)

### Prerequisites
- Install Python 3.10.x

### Verify Installation
```bash
python --version
pip --version
```

### Steps
```bash
cd "D:\Projects\Alzheimer's Detector\Backend Service"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

### API URL
http://localhost:8000/

### Swagger UI
http://localhost:8000/docs

---

## 🔗 Connect Frontend & Backend

### Steps
1. Open the Web Application:
   http://localhost:3000/

2. Navigate to:
   Settings → Integration

3. Enter Backend URL:
   http://localhost:8000

4. Save the configuration.

### Notes
- Ensure backend is running before testing.
- For remote server:
  http://<your-ip>:8000

---

## 📧 Email Configuration

### Steps
1. Open Web Application:
   http://localhost:3000/

2. Navigate to:
   Settings → Email Configuration

3. Enter:
   - Service Email → Your Gmail ID  
   - Password → Google App Password

4. Save settings.

---

## 🔐 Generate Google App Password

⚠️ Gmail password will NOT work. Use App Password.

### Prerequisite
- Enable 2-Step Verification

### Steps
1. Open:
   https://myaccount.google.com/

2. Go to:
   Security → 2-Step Verification  
   (Enable if not already)

3. Then go to:
   Security → App Passwords

4. Select:
   - App → Mail  
   - Device → Windows Computer / Other

5. Click Generate

6. Copy the 16-character password:
   xxxx xxxx xxxx xxxx

7. Paste it into your application password field.

### Notes
- Do NOT use your Gmail password
- Keep App Password secure
- Regenerate if email fails

---

## 🧪 Testing

- Open frontend → Upload MRI / trigger prediction
- Check API response via UI or Swagger
- Test email functionality

---

## ⚠️ Troubleshooting

### Port Already in Use
```bash
npm run dev -- -p 3001
uvicorn app:app --port 8001
```

### Node Modules Issue
```bash
npm install
```

### Python Dependency Issue
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Uvicorn Not Found
```bash
pip install uvicorn
```

---

## 📊 Project Overview

| Component | Technology | Port |
|----------|----------|------|
| Frontend | Next.js  | 3000 |
| Backend  | FastAPI  | 8000 |

---

## ✅ Final Notes

- Always start Backend first, then Frontend
- Ensure correct API URL is configured
- Keep dependencies updated
