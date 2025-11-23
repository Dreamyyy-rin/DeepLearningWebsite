import os
from pathlib import Path
from PIL import Image
from io import BytesIO
import base64

MODEL_DIR = Path(__file__).resolve().parent / "models"

# Lazy-load models cache
_models_cache = {}

def get_model(model_name: str = 'YoloV11s'):
    """Lazy load and cache YOLO model. Model name should match folder under models/."""
    if model_name in _models_cache:
        return _models_cache[model_name]
    
    try:
        from ultralytics import YOLO
    except ImportError:
        raise RuntimeError("ultralytics not installed. Run: pip install ultralytics")
    
    model_path = MODEL_DIR / model_name / 'best.pt'
    if not model_path.exists():
        available = [d.name for d in MODEL_DIR.iterdir() if d.is_dir()]
        raise FileNotFoundError(
            f"Model file not found: {model_path}\n"
            f"Available models: {available}"
        )
    
    print(f"Loading model from {model_path}...")
    model = YOLO(str(model_path))
    _models_cache[model_name] = model
    return model

def run_inference(image_input, model_name: str = 'YoloV11s', conf: float = 0.25):
    """Run inference on image. 
    
    Args:
        image_input: can be file object, bytes, PIL Image, or file path (str/Path)
        model_name: model folder name (default 'YoloV11s')
        conf: confidence threshold
    
    Returns:
        dict with 'detections' (list) and 'annotated_image' (base64 PNG)
    """
    model = get_model(model_name)
    
    # Normalize input to PIL Image
    img = None
    if hasattr(image_input, 'read'):  # file object
        img = Image.open(BytesIO(image_input.read())).convert('RGB')
    elif isinstance(image_input, bytes):
        img = Image.open(BytesIO(image_input)).convert('RGB')
    elif isinstance(image_input, Image.Image):
        img = image_input.convert('RGB')
    elif isinstance(image_input, (str, Path)):
        img = Image.open(str(image_input)).convert('RGB')
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")
    
    # Run prediction
    results = model.predict(source=img, conf=conf, imgsz=640, verbose=False)
    r = results[0]
    
    detections = []
    try:
        # Parse detections from boxes
        for box in r.boxes:
            xyxy = box.xyxy.tolist()[0]  # [x1, y1, x2, y2]
            conf_val = float(box.conf.tolist()[0])
            cls = int(box.cls.tolist()[0])
            label = model.names.get(cls, str(cls)) if hasattr(model, 'names') else str(cls)
            detections.append({
                'bbox': [float(x) for x in xyxy],
                'confidence': conf_val,
                'class_id': cls,
                'label': label
            })
    except Exception as e:
        print(f"Warning: Could not parse all detections: {e}")
    
    # Generate annotated image (optional)
    annotated_image_b64 = None
    try:
        annotated = r.plot()  # returns numpy array (BGR)
        pil_img = Image.fromarray(annotated[..., ::-1])  # BGR to RGB
        buf = BytesIO()
        pil_img.save(buf, format='PNG')
        buf.seek(0)
        encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
        annotated_image_b64 = f"data:image/png;base64,{encoded}"
    except Exception as e:
        print(f"Warning: Could not generate annotated image: {e}")
    
    return {
        'detections': detections,
        'annotated_image': annotated_image_b64,
        'model_used': model_name
    }