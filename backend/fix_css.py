import urllib.request
with open(r'd:\FullStack Projects\Tanmay\OceanIQ\frontend\src\index.css', 'r', encoding='utf-8') as f:
    idx = f.read()
with open(r'd:\FullStack Projects\Tanmay\OceanIQ\frontend\src\App.css', 'r', encoding='utf-8') as f:
    app = f.read()

idx = idx.replace("@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Roboto:wght@400;500;700&display=swap');", "")

final = '@import "tailwindcss";\n@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Roboto:wght@400;500;700&display=swap");\n' + idx + '\n' + app

with open(r'd:\FullStack Projects\Tanmay\OceanIQ\frontend-next\src\app\globals.css', 'w', encoding='utf-8') as f:
    f.write(final)
