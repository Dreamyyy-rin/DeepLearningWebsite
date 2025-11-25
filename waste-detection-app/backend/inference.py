import os
from pathlib import Path
from PIL import Image
from io import BytesIO
import base64
import cv2
import numpy as np
import tempfile

# --- BAGIAN PATH FIX (Sama seperti sebelumnya) ---
CURRENT_FILE = Path(__file__).resolve()
CURRENT_DIR = CURRENT_FILE.parent

if CURRENT_DIR.name == 'utils':
    BASE_DIR = CURRENT_DIR.parent
else:
    BASE_DIR = CURRENT_DIR

MODEL_DIR = BASE_DIR / "models"
# ----------------------------------------

print(f"DEBUG PATH: Folder models aktif di: {MODEL_DIR}")

# Cache untuk menyimpan model yang sudah di-load supaya tidak berat
_models_cache = {}

def get_model(model_name: str = 'YoloV11s'):
    """
    Load model berdasarkan nama yang dikirim dari React.
    Contoh: jika model_name='YoloV11n', dia cari 'YoloV11n.pt'
    """
    
    # 1. Cek Cache dulu (kalau sudah pernah diload, pakai yang ada di memori)
    if model_name in _models_cache:
        return _models_cache[model_name]
    
    try:
        from ultralytics import YOLO
    except ImportError:
        raise RuntimeError("ultralytics not installed. Run: pip install ultralytics")
    
    # 2. Tentukan kandidat nama file
    # React mengirim: "YoloV11n", "YoloV11s", dll.
    # Kita cari variasi nama filenya di folder.
    target_names = [
        f"{model_name}.pt",          # Persis: YoloV11n.pt
        f"{model_name.lower()}.pt",  # Huruf kecil semua: yolov11n.pt
        f"{model_name.upper()}.pt",  # Huruf besar semua: YOLOV11N.PT
    ]
    
    model_path = None
    
    # 3. Loop mencari file di folder models
    for name in target_names:
        candidate = MODEL_DIR / name
        if candidate.exists():
            model_path = candidate
            print(f"   [FOUND] File ditemukan: {name}")
            break
            
    # 4. Error Handling jika file tidak ada
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
    
    # 5. Load Model ke Memory
    print(f"SUCCESS: Loading model from {model_path}...")
    try:
        model = YOLO(str(model_path))
        _models_cache[model_name] = model # Simpan ke cache
        return model
    except Exception as e:
        print(f"CRITICAL ERROR loading YOLO: {e}")
        raise e

def run_inference(image_input, model_name: str = 'YoloV11s', conf: float = 0.25):
    """Run inference on image."""
    
    # Panggil get_model dengan parameter nama yang diminta user
    try:
        model = get_model(model_name)
    except FileNotFoundError as e:
        # Return error spesifik biar Frontend tau
        raise e
    
    # Normalize input to PIL Image
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
    
    # Run prediction
    try:
        # verbose=False supaya terminal bersih
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

        # Generate annotated image
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
            'model_used': model_name # Kirim balik nama model biar user tau
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
    
    # Read video file into temporary location
    video_data = None
    if hasattr(video_input, 'read'):
        video_data = video_input.read()
    elif isinstance(video_input, bytes):
        video_data = video_input
    else:
        raise ValueError(f"Unsupported video input type: {type(video_input)}")
    
    # Write to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_input:
        tmp_input.write(video_data)
        input_video_path = tmp_input.name
    
    try:
        # Open video file
        cap = cv2.VideoCapture(input_video_path)
        
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        if fps == 0:
            fps = 30  # Default fps if not detected
            
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Define output video codec and create VideoWriter
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_output:
            output_video_path = tmp_output.name
        
        # Use H264 codec which is widely supported
        fourcc = cv2.VideoWriter_fourcc(*'H264')
        if fourcc == -1:
            # Fallback to MJPG if H264 not available
            fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        if not out.isOpened():
            # Try with MP4V codec
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))
        
        frame_count = 0
        detections_per_frame = []
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            frame_count += 1
            
            # Convert BGR to RGB for YOLO
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_frame = Image.fromarray(frame_rgb)
            
            # Run inference
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
                
                # Draw bounding boxes on frame using YOLO's plot method
                annotated_frame = r.plot()  # Returns RGB format
                # Convert RGB to BGR for OpenCV
                annotated_frame_bgr = cv2.cvtColor(annotated_frame, cv2.COLOR_RGB2BGR)
                
            except Exception as e:
                print(f"Error processing frame {frame_count}: {e}")
                annotated_frame_bgr = frame
            
            # Write frame to output video
            out.write(annotated_frame_bgr)
        
        cap.release()
        out.release()
        
        # Read output video and encode to base64
        with open(output_video_path, 'rb') as f:
            video_bytes = f.read()
        
        # Encode to base64 but in smaller chunks for better compatibility
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
        # Clean up temporary files
        try:
            os.unlink(input_video_path)
        except:
            pass
        try:
            if os.path.exists(output_video_path):
                os.unlink(output_video_path)
        except:
            pass