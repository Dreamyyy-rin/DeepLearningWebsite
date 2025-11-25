from flask import Blueprint, request, jsonify, send_file
from inference import run_inference, run_video_inference
from io import BytesIO
import base64
import os
import tempfile

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/predict', methods=['POST'])
def predict():
    """Run inference on uploaded image.
    
    Request:
        image: file (required)
        model: string (optional, default='YoloV11s')
        conf: float (optional, default=0.25)
    """
    if 'image' not in request.files and 'file' not in request.files:
        return jsonify({'error': 'No image file provided (use field: image or file)'}), 400
    
    file = request.files.get('image') or request.files.get('file')
    model_name = request.form.get('model', 'YoloV11s')
    conf = float(request.form.get('conf', 0.25))
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        result = run_inference(file, model_name=model_name, conf=conf)
        return jsonify(result), 200
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': f'Inference failed: {str(e)}'}), 500

@api.route('/predict-video', methods=['POST'])
def predict_video():
    """Run inference on uploaded video.
    
    Request:
        video: file (required)
        model: string (optional, default='YoloV11s')
        conf: float (optional, default=0.25)
    """
    if 'video' not in request.files and 'file' not in request.files:
        return jsonify({'error': 'No video file provided (use field: video or file)'}), 400
    
    file = request.files.get('video') or request.files.get('file')
    model_name = request.form.get('model', 'YoloV11s')
    conf = float(request.form.get('conf', 0.25))
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        result = run_video_inference(file, model_name=model_name, conf=conf)
        return jsonify({
            'detections_per_frame': result['detections_per_frame'],
            'total_frames': result['total_frames'],
            'fps': result['fps'],
            'model_used': result['model_used'],
            'video_size_mb': result['video_size_mb'],
            'video': result['video'] 
        }), 200
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Video inference failed: {str(e)}'}), 500

@api.route('/models', methods=['GET'])
def list_models():
    """List available models."""
    from pathlib import Path
    model_dir = Path(__file__).resolve().parents[1] / 'models'
    if not model_dir.exists():
        return jsonify({'error': 'Models directory not found'}), 404
    models = [d.name for d in model_dir.iterdir() if d.is_dir() and (d / 'best.pt').exists()]
    return jsonify({'available_models': models}), 200