$env:KMP_DUPLICATE_LIB_OK='TRUE'
$env:PYTHONPATH=(Resolve-Path "$PSScriptRoot\..\.venv\Lib\site-packages").Path
cd $PSScriptRoot
$pythonPath = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
& $pythonPath -m uvicorn main:app --reload
