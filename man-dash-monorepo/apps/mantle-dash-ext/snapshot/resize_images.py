import os
from PIL import Image

def resize_image(input_path, output_path, target_size):
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file not found: {input_path}")
            return

        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        original_width, original_height = img.size
        target_width, target_height = target_size
        
        ratio = min(target_width / original_width, target_height / original_height)
        new_width = int(original_width * ratio)
        new_height = int(original_height * ratio)
        
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        new_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
        
        x_offset = (target_width - new_width) // 2
        y_offset = (target_height - new_height) // 2
        
        new_img.paste(resized_img, (x_offset, y_offset), resized_img)
        
        new_img.save(output_path)
        print(f"Successfully processed: {input_path} -> {output_path}")
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

base_dir = r"./"
files_to_process = [
    ("intro.png", "introN.png"),
    ("intro_1.png", "introN_1.png")
]

target_size = (640, 400)

for input_name, output_name in files_to_process:
    input_path = os.path.join(base_dir, input_name)
    output_path = os.path.join(base_dir, output_name)
    resize_image(input_path, output_path, target_size)
