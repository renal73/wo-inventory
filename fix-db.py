import json

with open('db.json', 'r') as f:
    content = f.read()

# Replace all "Open" with "OPEN"
content = content.replace('"Open"', '"OPEN"')

with open('db.json', 'w') as f:
    f.write(content)

print("Done - replaced all Open with OPEN")
