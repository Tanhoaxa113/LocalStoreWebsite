
import os
import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def convert_to_webp(root_dir):
    print(f"Scanning {root_dir}...")
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(dirpath, filename)
                webp_path = os.path.splitext(file_path)[0] + ".webp"
                
                print(f"Converting {file_path} to {webp_path}...")
                try:
                    with Image.open(file_path) as img:
                        # Resize if width > 2560
                        if img.width > 2560:
                            ratio = 2560 / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((2560, new_height), Image.Resampling.LANCZOS)
                            print(f"Resized to width 2560")

                        img.save(webp_path, "WEBP", quality=80)
                        print(f"Saved {webp_path}")
                except Exception as e:
                    print(f"Error converting {filename}: {e}")

if __name__ == "__main__":
    # Target directories
    dirs = [
        "public/images",
        "public/images/decor"
    ]
    
    base_path = os.getcwd()
    for d in dirs:
        full_path = os.path.join(base_path, d)
        if os.path.exists(full_path):
            convert_to_webp(full_path)
        else:
            print(f"Directory not found: {full_path}")
