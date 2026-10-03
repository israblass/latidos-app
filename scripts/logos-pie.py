#!/usr/bin/env python3
"""
Logos institucionales del pie de la bienvenida en navy de una sola tinta
(constitution §2, v2.10.1).

Entrada: los originales en recursos/marca/pie/ (flame.png, ucv.png,
mun-ucv.png), copiados a mano del Storage (bucket imagenes-landing-ucv:
flame-logo.png, Logo-UCV.png y Logo-MUN-UCV.png). Salida: public/marca/pie/
<nombre>-navy.webp y .png, a 3x de su alto en pantalla, mas una vista a zoom
en recursos/marca/pie/revision/ para revisar bordes y detalle antes de usarlos.

Reglas (las mismas del pedido de Isra):
- Con transparencia: se conserva el canal alfa y el color pasa a navy.
- Con fondo propio opaco: el fondo se detecta en las esquinas y la distancia
  de cada pixel a ese fondo hace de mascara; el color pasa a navy.
- Nada se estira ni se redibuja: misma silueta y mismas proporciones.
- Si un archivo no da un resultado limpio (fondo de esquinas desparejo, o
  restos de halo), el script lo dice y NO lo exporta.

Uso:  python3 scripts/logos-pie.py   (requiere Pillow)
"""

from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "recursos" / "marca" / "pie"
DESTINO = RAIZ / "public" / "marca" / "pie"
REVISION = ORIGEN / "revision"

NAVY = (0x1A, 0x23, 0x32)
# Alto en pantalla (px): el sello de la UCV, redondo, va mas alto.
ALTOS = {"flame": 24, "ucv": 28, "mun-ucv": 24}
ESCALA = 3
# Tolerancia para decidir que las cuatro esquinas son el mismo fondo.
TOLERANCIA_FONDO = 24


def tiene_transparencia(im):
    if im.mode != "RGBA":
        return False
    return im.getchannel("A").getextrema()[0] < 250


def mascara_por_fondo(im):
    """Alfa a partir de la distancia de cada pixel al color del fondo."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    esquinas = [rgb.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    fondo = tuple(sum(c[i] for c in esquinas) // 4 for i in range(3))
    if any(max(abs(c[i] - fondo[i]) for i in range(3)) > TOLERANCIA_FONDO for c in esquinas):
        return None, fondo
    px = rgb.load()
    alfa = Image.new("L", (w, h), 0)
    ap = alfa.load()
    for y in range(h):
        for x in range(w):
            d = max(abs(px[x, y][i] - fondo[i]) for i in range(3))
            # Lineal entre la tolerancia (fondo) y 96 (tinta plena): suaviza el
            # antialias sin dejar halo.
            ap[x, y] = 0 if d <= TOLERANCIA_FONDO else min(255, round((d - TOLERANCIA_FONDO) * 255 / 72))
    return alfa, fondo


def a_navy(im):
    im = im.convert("RGBA")
    if tiene_transparencia(im):
        alfa = im.getchannel("A")
        origen = "transparencia propia"
    else:
        alfa, fondo = mascara_por_fondo(im)
        if alfa is None:
            return None, f"fondo opaco desparejo en las esquinas (≈{fondo}): no se recolorea a ciegas"
        origen = f"fondo opaco {fondo} usado como mascara"
    # Color uniforme: todo pixel visible es navy; el alfa da la forma.
    plano = Image.new("RGBA", im.size, (*NAVY, 255))
    plano.putalpha(alfa)
    caja = alfa.getbbox()
    if not caja:
        return None, "no se encontro ninguna forma"
    return plano.crop(caja), origen


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    REVISION.mkdir(parents=True, exist_ok=True)
    for nombre, alto in ALTOS.items():
        archivo = ORIGEN / f"{nombre}.png"
        if not archivo.exists():
            print(f"{nombre}: falta {archivo.relative_to(RAIZ)}")
            continue
        resultado, nota = a_navy(Image.open(archivo))
        if resultado is None:
            print(f"{nombre}: NO exportado — {nota}")
            continue
        final = alto * ESCALA
        ancho = round(resultado.width * final / resultado.height)
        resultado = resultado.resize((ancho, final), Image.LANCZOS)
        # El reescalado puede mover el color en los bordes semitransparentes:
        # se vuelve a navy puro y solo queda el alfa (sin halos de otro color).
        alfa = resultado.getchannel("A")
        resultado = Image.new("RGBA", resultado.size, (*NAVY, 255))
        resultado.putalpha(alfa)
        resultado.save(DESTINO / f"{nombre}-navy.png", optimize=True)
        resultado.save(DESTINO / f"{nombre}-navy.webp", quality=92, method=6)
        # Vista para revisar a ojo: a su alto real (1x) sobre crema, ampliada 4x.
        vista = Image.new("RGBA", (round(ancho / ESCALA) + 8, alto + 8), (255, 255, 245, 255))
        vista.alpha_composite(resultado.resize((round(ancho / ESCALA), alto), Image.LANCZOS), (4, 4))
        vista.resize((vista.width * 4, vista.height * 4), Image.NEAREST).save(REVISION / f"{nombre}-1x-zoom.png")
        print(f"{nombre}: {ancho} x {final} ({nota})")


if __name__ == "__main__":
    main()
