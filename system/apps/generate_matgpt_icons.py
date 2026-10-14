from pathlib import Path
from PIL import Image, ImageDraw

root = Path("system/apps")
png_dir = root / "png"
chat_dir = png_dir / "chatbot"
chat_dir.mkdir(parents=True, exist_ok=True)
png_dir.mkdir(parents=True, exist_ok=True)


def save(path: Path, img: Image.Image):
    img.save(path, format="PNG")
    print(f"saved {path}")


def glass_icon(size: int = 256):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # soft glass badge
    d.rounded_rectangle((26, 26, size - 26, size - 26), radius=52, fill=(92, 104, 170, 210))
    d.rounded_rectangle((42, 42, size - 42, size - 42), radius=38, fill=(28, 32, 54, 160), outline=(255, 255, 255, 90), width=3)

    # stylized M / G form
    d.line((80, 170, 80, 98), fill=(220, 235, 255, 245), width=16)
    d.line((80, 98, 116, 134), fill=(220, 235, 255, 245), width=16)
    d.line((116, 134, 150, 98), fill=(220, 235, 255, 245), width=16)
    d.line((150, 98, 150, 170), fill=(220, 235, 255, 245), width=16)
    d.arc((112, 98, 182, 168), start=200, end=360, fill=(132, 240, 200, 255), width=12)
    d.arc((110, 94, 186, 170), start=200, end=360, fill=(255, 255, 255, 120), width=4)

    return img


def glass_button_icon(size: int = 64, base=(120, 144, 255, 255)):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((8, 8, size - 8, size - 8), radius=18, fill=base)
    d.rounded_rectangle((12, 12, size - 12, size - 12), radius=15, fill=(255, 255, 255, 18), outline=(255, 255, 255, 160), width=2)
    return img


def newchat_icon():
    img = glass_button_icon(64, (120, 144, 255, 255))
    d = ImageDraw.Draw(img)
    d.line((32, 18, 32, 46), fill=(255, 255, 255, 235), width=6)
    d.line((18, 32, 46, 32), fill=(255, 255, 255, 235), width=6)
    return img


def chats_icon():
    img = glass_button_icon(64, (108, 190, 255, 255))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((15, 19, 38, 40), radius=8, fill=(255, 255, 255, 235))
    d.rounded_rectangle((26, 28, 49, 49), radius=8, fill=(255, 255, 255, 185))
    return img


def send_icon():
    img = glass_button_icon(64, (110, 220, 150, 255))
    d = ImageDraw.Draw(img)
    d.polygon([(18, 34), (42, 28), (28, 26), (28, 18), (46, 30), (28, 42), (28, 34)], fill=(255, 255, 255, 245))
    return img


def stop_icon():
    img = glass_button_icon(64, (235, 96, 110, 255))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((20, 20, 44, 44), radius=6, fill=(255, 255, 255, 240))
    return img


def copilot_icon():
    img = glass_button_icon(64, (160, 120, 230, 255))
    d = ImageDraw.Draw(img)
    d.polygon([(32, 14), (38, 26), (50, 32), (38, 38), (32, 50), (26, 38), (14, 32), (26, 26)], fill=(255, 255, 255, 235))
    d.ellipse((24, 24, 40, 40), outline=(255, 255, 255, 200), width=2)
    return img


if __name__ == "__main__":
    save(png_dir / "icon.png", glass_icon())
    save(chat_dir / "newchat.png", newchat_icon())
    save(chat_dir / "chats.png", chats_icon())
    save(chat_dir / "send.png", send_icon())
    save(chat_dir / "stoprepond.png", stop_icon())
    save(chat_dir / "copilot.png", copilot_icon())

    print("Transparent PNGs created in system/apps/png and system/apps/png/chatbot")
    print("Install with: pip install pillow")
