from PIL import Image

# Path to your image on Windows (use an r-string or double backslashes)
image_path = r"E:\_PROJEKTY\2025_shooter_html_gpt_o3mini_high\v019_tactical_topdown_shop\output.png"

# 1. Load the image
img = Image.open(image_path)

# 2. Convert to grayscale
img = img.convert("L")

# 3. Resize (nearest-neighbor preserves pixel/blocky style).
#    Adjust these values if you want a different size, e.g. 32x32 or 64x64.
width, height = 64, 64
img = img.resize((width, height), Image.NEAREST)

# 4. Build the map array
#    If your image is mostly black/white, 128 is usually fine for threshold.
threshold = 128
map_data = []

for y in range(height):
    row = []
    for x in range(width):
        pixel = img.getpixel((x, y))
        # If the pixel is brighter than the threshold, call it a wall = 1
        # Otherwise, walkable = 0
        if pixel > threshold:
            row.append(1)
        else:
            row.append(0)
    map_data.append(row)

# 5. Print it out in a JavaScript-friendly format
print("const map = [")
for row in map_data:
    print("    [{}],".format(",".join(str(v) for v in row)))
print("];")
