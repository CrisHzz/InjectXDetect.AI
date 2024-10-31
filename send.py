import requests

csv_file_path = 'Data\pruebasetNotHuman.csv'

url = 'http://localhost:5000/predict'

with open(csv_file_path, 'rb') as f:
    files = {'file': f}
    response = requests.post(url, files=files)

print(response.json())
