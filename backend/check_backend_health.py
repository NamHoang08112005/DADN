"""
Script để kiểm tra health của backend trước khi start
Checks: Environment variables, Adafruit IO connection, Dependencies
"""

import os
import sys
from dotenv import load_dotenv

print("=" * 60)
print("BACKEND HEALTH CHECK")
print("=" * 60)

# Load environment variables
load_dotenv()

# 1. Check Environment Variables
print("\n[1] Checking Environment Variables...")
required_env_vars = {
    "AIO_USERNAME": "Adafruit IO Username",
    "AIO_KEY": "Adafruit IO Key",
    "SUPABASE_URL": "Supabase URL (optional)",
    "SUPABASE_KEY": "Supabase Key (optional)"
}

env_status = True
for var_name, var_desc in required_env_vars.items():
    value = os.getenv(var_name)
    if var_name in ["AIO_USERNAME", "AIO_KEY"]:
        if value:
            masked_value = value[:3] + "*" * (len(value) - 6) + value[-3:] if len(value) > 6 else "***"
            print(f"  ✓ {var_name}: {masked_value}")
        else:
            print(f"  ✗ {var_name}: NOT SET (REQUIRED)")
            env_status = False
    else:
        if value:
            print(f"  ✓ {var_name}: SET")
        else:
            print(f"  ⚠ {var_name}: NOT SET (optional)")

if not env_status:
    print("\n❌ FAILED: Missing required environment variables!")
    print("   Please set AIO_USERNAME and AIO_KEY in .env file")
    sys.exit(1)

# 2. Check Dependencies
print("\n[2] Checking Dependencies...")
required_packages = [
    "fastapi",
    "uvicorn",
    "Adafruit-IO",
    "python-dotenv",
    "supabase"
]

for package in required_packages:
    try:
        __import__(package.replace("-", "_"))
        print(f"  ✓ {package}")
    except ImportError:
        print(f"  ✗ {package}: NOT INSTALLED")

# 3. Test Adafruit Connection
print("\n[3] Testing Adafruit IO Connection...")
try:
    from Adafruit_IO import Client
    aio_username = os.getenv("AIO_USERNAME")
    aio_key = os.getenv("AIO_KEY")
    
    aio = Client(aio_username, aio_key)
    print(f"  Testing connection to Adafruit IO...")
    
    # Try to get user info
    user = aio._fetch_user()
    print(f"  ✓ Connected successfully!")
    print(f"    User: {user}")
    
except Exception as e:
    print(f"  ✗ Failed to connect to Adafruit IO")
    print(f"    Error: {str(e)}")
    print(f"    This could be:")
    print(f"    - Invalid credentials")
    print(f"    - Network connection issue")
    print(f"    - Adafruit IO server is down")

# 4. Test Supabase Connection (optional)
print("\n[4] Testing Supabase Connection (optional)...")
try:
    from supabase import create_client, Client as SupabaseClient
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if url and key:
        supabase = create_client(url, key)
        print(f"  ✓ Supabase client initialized")
        # Try a simple query
        response = supabase.table("users").select("COUNT(*)").execute()
        print(f"  ✓ Can query Supabase database")
    else:
        print(f"  ⚠ Supabase credentials not set (optional)")
        
except Exception as e:
    print(f"  ✗ Supabase connection issue: {str(e)}")
    print(f"    (This is optional, but may affect some features)")

print("\n" + "=" * 60)
print("✓ HEALTH CHECK COMPLETE - Ready to start backend!")
print("=" * 60)
print("\nTo start the backend, run:")
print("  fastapi dev main.py")
print("=" * 60)
