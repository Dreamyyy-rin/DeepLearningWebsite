from flask import Flask, jsonify
from flask_cors import CORS
from routes.api import api
import os

app = Flask(__name__)

# CORS configuration for production
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://*.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

app.register_blueprint(api)

@app.route('/')
def home():
    return jsonify({'message': 'Welcome to Waste Detection API', 'endpoints': ['/health', '/api/predict']})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    print(f'Starting Waste Detection API server on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)