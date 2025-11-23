from flask import Flask, jsonify
from flask_cors import CORS
from routes.api import api

app = Flask(__name__)
CORS(app)

app.register_blueprint(api)

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to Waste Detection API', 'endpoints': ['/health', '/api/predict']})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print('Starting Waste Detection API server on http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)