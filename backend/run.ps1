$env:KMP_DUPLICATE_LIB_OK='TRUE'
cd $PSScriptRoot
python -m uvicorn main:app --reload
