import os
from pathlib import Path
from PIL import Image
from io import BytesIO
import base64
import cv2
import numpy as np
import tempfile
from collections import OrderedDict

CURRENT_FILE = Path(__file__).resolve()
CURRENT_DIR = CURRENT_FILE.parent

if CURRENT_DIR.name == 'utils':
    BASE_DIR = CURRENT_DIR.parent
else:
    BASE_DIR = CURRENT_DIR

MODEL_DIR = BASE_DIR / "models"

print(f"DEBUG PATH: Folder models aktif di: {MODEL_DIR}")

# LRU Cache untuk model (max 1 untuk Free plan)
_models_cache = OrderedDict()

def get_model(model_name: str = 'YoloV11n'):
    """
    Load model berdasarkan nama yang dikirim dari React.
    Contoh: jika model_name='YoloV11n', dia cari 'YoloV11n.pt'
    Cache max 1 model untuk menghemat RAM (Free plan).
    """
    # Env override default model
    if model_name == 'YoloV11s' and not model_name:
        model_name = os.getenv('MODEL_NAME', 'YoloV11n')
    
    max_cache = int(os.getenv('MAX_MODEL_CACHE', '1'))
    
    if model_name in _models_cache:
        _models_cache.move_to_end(model_name)
        return _models_cache[model_name]
    
    try:
        from ultralytics import YOLO
    except ImportError:
        raise RuntimeError("ultralytics not installed. Run: pip install ultralytics")
    
    target_names = [
        f"{model_name}.pt",          
        f"{model_name.lower()}.pt",  
        f"{model_name.upper()}.pt",  
    ]
    
    model_path = None
    
    for name in target_names:
        candidate = MODEL_DIR / name
        if candidate.exists():
            model_path = candidate
            print(f"   [FOUND] File ditemukan: {name}")
            break
            
    if model_path is None:
        available = []
        if MODEL_DIR.exists():
            available = [f.name for f in MODEL_DIR.iterdir() if f.suffix == '.pt']
        
        error_msg = (
            f"CRITICAL: Model '{model_name}' tidak ditemukan di folder models!\n"
            f"Sistem mencari salah satu dari: {target_names}\n"
            f"File .pt yang tersedia saat ini: {available}\n"
            f"TIPS: Pastikan kamu sudah rename file trainingmu jadi '{model_name}.pt'"
        )
        print(error_msg)
        raise FileNotFoundError(error_msg)
    
    print(f"SUCCESS: Loading model from {model_path}...")
    
    # Evict old models if cache full (LRU)
    while len(_models_cache) >= max_cache:
        old_name, old_model = _models_cache.popitem(last=False)
        print(f"[CACHE] Evicting old model: {old_name}")
        try:
            del old_model
        except:
            pass
    
    try:
        model = YOLO(str(model_path))
        # Try half precision untuk hemat RAM (CPU biasanya skip)
        try:
            model.model.half()
        except:
            pass
        _models_cache[model_name] = model
        print(f"[CACHE] Model {model_name} loaded. Cache size: {len(_models_cache)}")
        return model
    except Exception as e:
        print(f"CRITICAL ERROR loading YOLO: {e}")
        raise e

def run_inference(image_input, model_name: str = 'YoloV11s', conf: float = 0.25):
    """Run inference on image."""
    
    try:
        model = get_model(model_name)
    except FileNotFoundError as e:
        raise e
    
    img = None
    try:
        if hasattr(image_input, 'read'):
            img = Image.open(BytesIO(image_input.read())).convert('RGB')
        elif isinstance(image_input, bytes):
            img = Image.open(BytesIO(image_input)).convert('RGB')
        elif isinstance(image_input, Image.Image):
            img = image_input.convert('RGB')
        elif isinstance(image_input, (str, Path)):
            img = Image.open(str(image_input)).convert('RGB')
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
    except Exception as e:
        raise ValueError(f"Gagal memproses gambar: {str(e)}")
    
    try:
        results = model.predict(source=img, conf=conf, imgsz=640, verbose=False)
        r = results[0]
        
        detections = []
        for box in r.boxes:
            xyxy = box.xyxy.tolist()[0]
            conf_val = float(box.conf.tolist()[0])
            cls = int(box.cls.tolist()[0])
            label = model.names.get(cls, str(cls)) if hasattr(model, 'names') else str(cls)
            detections.append({
                'bbox': [float(x) for x in xyxy],
                'confidence': conf_val,
                'class_id': cls,
                'label': label
            })

        annotated_image_b64 = None
        annotated = r.plot()
        pil_img = Image.fromarray(annotated[..., ::-1])
        buf = BytesIO()
        pil_img.save(buf, format='PNG')
        buf.seek(0)
        encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
        annotated_image_b64 = f"data:image/png;base64,{encoded}"
        
        return {
            'detections': detections,
            'annotated_image': annotated_image_b64,
            'model_used': model_name 
        }

    except Exception as e:
        print(f"Error during prediction: {e}")
        raise e

def run_video_inference(video_input, model_name: str = 'YoloV11s', conf: float = 0.25):
    """Run inference on video and return annotated video.
    
    Args:
        video_input: File-like object or path to video file
        model_name: Name of YOLO model to use
        conf: Confidence threshold
        
    Returns:
        dict with video bytes and detections_per_frame
    """
    
    try:
        model = get_model(model_name)
    except FileNotFoundError as e:
        raise e
    
    video_data = None
    if hasattr(video_input, 'read'):
        video_data = video_input.read()
    elif isinstance(video_input, bytes):
        video_data = video_input
    else:
        raise ValueError(f"Unsupported video input type: {type(video_input)}")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_input:
        tmp_input.write(video_data)
        input_video_path = tmp_input.name
    
    try:
        cap = cv2.VideoCapture(input_video_path)
        
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        if fps == 0:
            fps = 30
            
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_output:
            output_video_path = tmp_output.name
        
        fourcc = cv2.VideoWriter_fourcc(*'H264')
        if fourcc == -1:
            fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        frame_count = 0
        detections_per_frame = []
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            frame_count += 1
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_frame = Image.fromarray(frame_rgb)
            
            try:
                results = model.predict(source=pil_frame, conf=conf, imgsz=640, verbose=False)
                r = results[0]
                
                frame_detections = []
                for box in r.boxes:
                    xyxy = box.xyxy.tolist()[0]
                    conf_val = float(box.conf.tolist()[0])
                    cls = int(box.cls.tolist()[0])
                    label = model.names.get(cls, str(cls)) if hasattr(model, 'names') else str(cls)
                    
                    frame_detections.append({
                        'bbox': [float(x) for x in xyxy],
                        'confidence': conf_val,
                        'class_id': cls,
                        'label': label
                    })
                
                detections_per_frame.append({
                    'frame': frame_count,
                    'detections': frame_detections
                })
                
                annotated_frame = r.plot() 
                annotated_frame_bgr = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
                
            except Exception as e:
                print(f"Error processing frame {frame_count}: {e}")
                annotated_frame_bgr = frame
            
            out.write(annotated_frame_bgr)
        
        cap.release()
        out.release()
        
        with open(output_video_path, 'rb') as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode('utf-8')
        video_data_uri = f"data:video/mp4;base64,{video_base64}"
        
        return {
            'video': video_data_uri,
            'detections_per_frame': detections_per_frame,
            'total_frames': total_frames,
            'fps': fps,
            'model_used': model_name,
            'video_size_mb': len(video_bytes) / (1024 * 1024)
        }
        
    finally:
        try:
            os.unlink(input_video_path)
        except:
            pass
        try:
            if os.path.exists(output_video_path):
                os.unlink(output_video_path)
        except:
            pass