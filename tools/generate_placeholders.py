from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]


def gradient(size, start, end):
    width, height = size
    image = Image.new("RGB", size)
    pixels = image.load()
    for y in range(height):
        ty = y / max(height - 1, 1)
        for x in range(width):
            tx = x / max(width - 1, 1)
            t = min(1, tx * 0.65 + ty * 0.35)
            pixels[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(start, end))
    return image


def add_forms(image, seed):
    draw = ImageDraw.Draw(image, "RGBA")
    width, height = image.size
    palette = [
        (255, 255, 255, 62),
        (255, 255, 255, 28),
        (15, 12, 32, 34),
    ]
    for index in range(7):
        diameter = int(min(width, height) * (0.16 + ((seed + index * 5) % 9) * 0.035))
        x = int((width * (0.08 + ((seed * 7 + index * 19) % 83) / 100)))
        y = int((height * (0.06 + ((seed * 11 + index * 23) % 79) / 100)))
        draw.ellipse((x - diameter, y - diameter, x + diameter, y + diameter), fill=palette[index % len(palette)])
    for index in range(4):
        x = int(width * (0.08 + index * 0.23))
        y = int(height * (0.16 + ((seed + index) % 3) * 0.17))
        w = int(width * (0.28 + ((seed + index) % 4) * 0.035))
        h = int(height * (0.12 + ((seed + index * 3) % 5) * 0.025))
        draw.rounded_rectangle((x, y, x + w, y + h), radius=min(w, h) // 3, outline=(255, 255, 255, 82), width=max(3, width // 500))
    return image.filter(ImageFilter.GaussianBlur(radius=max(0.6, width / 2600)))


def save(path, size, colors, seed):
    path.parent.mkdir(parents=True, exist_ok=True)
    image = add_forms(gradient(size, *colors), seed)
    image.save(path, "WEBP", quality=82, method=6)


ACTIVITIES = {
    "partner-recruitment.webp": ((1600, 820), ((61, 37, 160), (48, 137, 255)), 3),
    "official-showcase.webp": ((1600, 820), ((187, 44, 78), (255, 139, 51)), 7),
    "community-channel.webp": ((1600, 820), ((10, 104, 104), (74, 202, 164)), 11),
}

CASES = {
    "vehicle-dashboard.webp": (((74, 53, 173), (87, 151, 255)), 2),
    "weather-widget.webp": (((16, 117, 149), (112, 215, 200)), 4),
    "dynamic-wallpaper.webp": (((110, 39, 129), (246, 108, 161)), 6),
    "audio-orbit.webp": (((27, 25, 60), (135, 98, 255)), 8),
    "image-binding-cards.webp": (((194, 84, 26), (255, 196, 86)), 10),
    "sensor-compass.webp": (((15, 105, 77), (85, 194, 99)), 12),
    "focus-controller.webp": (((47, 73, 120), (92, 188, 222)), 14),
    "liquid-switch.webp": (((139, 29, 84), (250, 95, 105)), 16),
}


for filename, (size, colors, seed) in ACTIVITIES.items():
    save(ROOT / "assets" / "activities" / filename, size, colors, seed)

for filename, (colors, seed) in CASES.items():
    save(ROOT / "assets" / "cases" / filename, (1600, 1000), colors, seed)
