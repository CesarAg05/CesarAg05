"""Baixa as fotos de teste (Wikimedia Commons, licenças livres) listadas em fotos.json.

Uso: python3 -I baixar.py   -> cria fotos/ (fora do git) com cópias que têm GPS e modelo de celular falsos,
para o teste provar que o app remove esses dados antes do envio. Requer Pillow.
O Commons limita pedidos: o script espera e tenta de novo quando recebe 429.
"""
import hashlib, json, os, subprocess, time, urllib.parse
from PIL import Image

aqui = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(aqui, "fotos"), exist_ok=True)
for f in json.load(open(os.path.join(aqui, "fotos.json"), encoding="utf-8")):
    destino = os.path.join(aqui, "fotos", f["arquivo"])
    if os.path.exists(destino):
        continue
    nome = f["commons"].replace("File:", "").replace(" ", "_")
    h = hashlib.md5(nome.encode()).hexdigest()
    q = urllib.parse.quote(nome)
    url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/500px-{q}"
    for _ in range(8):
        codigo = subprocess.run(["curl", "-s", "-o", destino + ".tmp", "-w", "%{http_code}", "--max-time", "40", url], capture_output=True, text=True).stdout
        if codigo == "200":
            break
        print(f["arquivo"], codigo, "- esperando 30 s", flush=True)
        time.sleep(30)
    else:
        raise SystemExit(f"não consegui baixar {f['arquivo']}")
    im = Image.open(destino + ".tmp").convert("RGB")
    exif = Image.Exif()
    exif[0x010F] = "MarcaTeste"
    exif[0x0110] = "CelularTeste"
    exif[0x8825] = {1: "S", 2: (23.0, 33.0, 1.0), 3: "W", 4: (46.0, 38.0, 2.0)}  # GPS falso
    im.save(destino, "JPEG", quality=90, exif=exif.tobytes())
    os.remove(destino + ".tmp")
    # versão grande, para testar a redução para 1024 px
    if f["arquivo"].startswith("look-") and not os.path.exists(os.path.join(aqui, "fotos", "look-grande.jpg")):
        im.resize((3000, round(3000 * im.height / im.width))).save(os.path.join(aqui, "fotos", "look-grande.jpg"), "JPEG", quality=92, exif=exif.tobytes())
    print(f["arquivo"], "ok", flush=True)
    time.sleep(4)
