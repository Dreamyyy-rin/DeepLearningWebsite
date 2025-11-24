import os
from pathlib import Path
from PIL import Image
from io import BytesIO
import base64

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