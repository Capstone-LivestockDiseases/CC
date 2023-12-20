import requests
from PIL import Image

# Ganti 'path/to/your/image.jpg' dengan path gambar yang ingin Anda uji
image_path = '060319_pirbright.ac.uk_lumpy-skin-disease-cow-pirbright.large.jpg'

# Buat objek file
image_file = open(image_path, 'rb')

# Membuat permintaan POST ke API
response = requests.post('http://127.0.0.1:5000/predict', files={'image': image_file})

# Menutup file gambar
image_file.close()

# Menampilkan respons dari API
print(response.json())
