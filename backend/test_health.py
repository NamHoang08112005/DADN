import urllib.request
try:
    with urllib.request.urlopen('http://127.0.0.1:8000/health') as response:
        print("Health:", response.read().decode())
except Exception as e:
    print("Error:", e)
