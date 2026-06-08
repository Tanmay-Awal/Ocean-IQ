import os, glob

files = glob.glob(r'd:\FullStack Projects\Tanmay\OceanIQ\frontend-next\src\components\**\*.jsx', recursive=True)
files += glob.glob(r'd:\FullStack Projects\Tanmay\OceanIQ\frontend-next\src\context\**\*.jsx', recursive=True)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    if '"use client"' not in content and "'use client'" not in content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write('"use client";\n' + content)
