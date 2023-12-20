from flask import Flask, request, jsonify
from PIL import Image
import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions

app = Flask(__name__)

# Ganti 'model_mobilenetv2.h5' dengan nama file model Anda
model = load_model('Model.h5')

def process_image(img_path):
    img = image.load_img(img_path, color_mode="rgb", target_size=(150, 150))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    return img_array


@app.route('/')
def home():
    return 'Welcome to the API!'

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Dapatkan file gambar dari request
        img = request.files['image']
        
        # Simpan file gambar sementara
        img_path = 'temp_image.jpg'
        img.save(img_path)
        
        # Proses gambar
        processed_img = process_image(img_path)
        
        # Lakukan prediksi dengan model MobileNetV2
        prediction = model.predict(processed_img)

        # Interpretasi prediksi
        if prediction[0][0] > 0.5:  # Assuming a threshold of 0.5 for binary classification
            result = {
                'prediction': 'Lumpy',
                'description': "Lumpy Skin Disease (LSD) adalah penyakit pada hewan sapi, kerbau, dan beberapa hewan ruminansia liar yang disebabkan oleh virus pox. Cara penularan Lumpy Skin Disease yang terkenal adalah melalui serangga , seperti kutu, lalat, dan nyamuk. Lumpy Skin Disease adalah penyakit yang disebabkan oleh virus. Oleh karena itu, zat antivirus sangat penting sebagai sarana pengobatan utama. Namun hal tersebut masih perlu dikembangkan. Oleh karena itu, untuk menangani penyakit ini, kita harus mengatasi gejalanya, yang biasanya melibatkan pemberian perawatan suportif untuk ternak yang sakit, seperti: Semprotan perawatan luka adalah produk perawatan kulit hebat yang dikemas dalam wadah aerosol yang mudah digunakan. Intra Repiderma Semprotan ini mengobati lesi kulit untuk mencegah infeksi. Antibiotik. Dokter hewan mungkin akan meresepkan antibiotik untuk mencegah infeksi dan pneumonia, komplikasi fatal akibat Lumpy Skin Disease. Obat pereda nyeri anti inflamasi. Ini mengurangi rasa sakit, sehingga mendorong ternak yang sakit untuk makan lagi. Cairan Intravena. Ini dapat memberikan nutrisi tambahan dan meringankan gejala, namun banyak dokter hewan tidak merekomendasikannya karena kurangnya kepraktisan dan efisiensi."
            }
        else:
            result = {'prediction': 'Healthy'}
        
        # Hapus file gambar sementara
        os.remove(img_path)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(port=8080)
