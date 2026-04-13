# Backend Connection Troubleshooting Guide

## Các bước kiểm tra khi gặp lỗi "Cannot Connect to Backend Server"

### 1️⃣ Kiểm tra Backend đã chạy chưa

```bash
# Đi vào thư mục backend
cd backend

# Chạy health check script
python check_backend_health.py
```

Nếu script báo "FAILED", hãy xử lý từng vấn đề:

---

### 2️⃣ Kiểm tra Environment Variables (AIO_USERNAME, AIO_KEY)

Tạo file `.env` trong thư mục `backend/`:

```env
# Adafruit IO Credentials (REQUIRED)
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key

# Supabase (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

**Cách lấy Adafruit IO credentials:**
1. Vào https://io.adafruit.com
2. Login vào tài khoản của bạn
3. Vào Settings -> View AIO Key
4. Copy username và key vào `.env`

---

### 3️⃣ Cài đặt Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Nếu thiếu gì, cài thêm:
```bash
pip install fastapi uvicorn python-dotenv Adafruit-IO supabase
```

---

### 4️⃣ Chạy Backend

```bash
cd backend
fastapi dev main.py
```

Nếu chạy bình thường sẽ thấy:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### 5️⃣ Test Connection từ Frontend

Mở DevTools (F12) và chạy:

```javascript
// Kiểm tra xem backend có online không
fetch('http://127.0.0.1:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Kết quả mong muốn:
```json
{
  "backend": "running",
  "adafruit_io": {
    "connected": true,
    "status": "Connected to Adafruit IO!",
    "error": null
  },
  "timestamp": "2026-04-13T..."
}
```

---

## 🔴 Các lỗi thường gặp

### ❌ "AIO_USERNAME and AIO_KEY not set"

**Giải pháp:** Thêm credentials vào `.env` file (xem mục 2)

### ❌ "Failed to connect to Adafruit IO"

**Nguyên nhân có thể:**
- Credentials sai
- Internet bị chặn Adafruit IO
- Tài khoản Adafruit bị khóa

**Giải pháp:**
1. Kiểm tra credentials lại
2. Thử ping: `ping io.adafruit.com`
3. Check tường lửa/VPN

### ❌ "Port 8000 already in use"

**Giải pháp:**
```bash
# Tìm process đang dùng port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Hoặc dùng port khác
fastapi dev main.py --port 8001
```

### ❌ CORS Error trong Console

**Giải pháp:** Backend đã có CORS setup, kiểm tra:
- Frontend URL có match không?
- Backend có đang chạy?

---

## ✅ Endpoints kiểm tra

| Endpoint | Mục đích | Response |
|----------|---------|----------|
| `GET /` | Check backend running | `{"Hello World"}` |
| `GET /health` | Check backend + Adafruit | JSON với status |
| `GET /sensor/` | Check sensor router | `{"status": "sensor is working"}` |

---

## 📱 Kiểm tra từ Frontend

### Cách 1: Dùng component BackendConnectionError
```tsx
import BackendConnectionError from '@/components/error/BackendConnectionError';

export default function MyPage() {
  return <BackendConnectionError showDebugInfo={true} />;
}
```

### Cách 2: Dùng hook useBackendConnection
```tsx
import { useBackendConnection } from '@/hooks/useBackendConnection';

export default function MyPage() {
  const { isConnected, health, checkConnection } = useBackendConnection();
  
  return (
    <div>
      Backend: {isConnected ? '✓' : '✗'}
      <button onClick={checkConnection}>Retry</button>
    </div>
  );
}
```

### Cách 3: Dùng utility functions
```tsx
import { getBackendHealthStatus, getErrorMessage } from '@/lib/backendHealth';

const health = await getBackendHealthStatus();
console.log(getErrorMessage(health));
```

---

## 🐛 Debug Script

Chạy script này để lấy thông tin chi tiết:

```bash
cd backend
python check_backend_health.py
```

Output sẽ hiển thị:
- ✓/✗ Environment variables
- ✓/✗ Dependencies  
- ✓/✗ Adafruit IO connection
- ✓/✗ Supabase connection

---

## 📞 Cần hỗ trợ thêm?

Hãy cung cấp:
1. Output của `check_backend_health.py`
2. Error message từ browser console (F12)
3. Error message từ terminal khi chạy backend
