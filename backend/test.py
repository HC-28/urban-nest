import urllib.request
import json
import urllib.error

data = json.dumps({'email': 'jane.smith@example.com', 'password': 'user1'}).encode()
req = urllib.request.Request('http://localhost:8083/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    token = json.loads(response.read())['token']
    print("Token ok")
    userId = 14
    req2 = urllib.request.Request(f'http://localhost:8083/api/favorites/status?userId={userId}&propertyId=44', headers={'Authorization': 'Bearer ' + token})
    print(urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} {e.reason}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
