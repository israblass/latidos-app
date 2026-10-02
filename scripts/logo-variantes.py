#!/usr/bin/env python3
"""
Variantes del logo de Latidos UCV para la bienvenida (constitution §2, v2.10.0).

Parte del logo oficial (recursos/marca/logo-latidos-ucv-oficial.png) y genera,
en public/marca/ (webp y png de respaldo):

  logo-latidos-aro.*         el oficial, con un aro blanco detras del sello UCV
  logo-latidos-blanco-aro.*  wordmark blanco (para el amarillo pleno) + aro
  logo-latidos-navy-aro.*    wordmark navy #1A2332 (alternativa) + aro

Como se separa el wordmark del sello: el sello es la zona amarilla con sus
huecos rellenos (las letras UCV quedan adentro). Todo pixel azul dentro de esa
zona es del sello y se queda azul; todo pixel azul fuera es del wordmark y se
recolorea. No se usa un circulo: el remate de la S que asoma bajo el sello
quedaba partido por el borde del circulo y dejaba un fragmento azul.

Uso:  python3 scripts/logo-variantes.py   (requiere Pillow)
"""

from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "recursos" / "marca" / "logo-latidos-ucv-oficial.png"
DESTINO = RAIZ / "public" / "marca"

BLANCO = (255, 255, 255)
NAVY = (0x1A, 0x23, 0x32)
# El aro: un circulo blanco 1.12 veces el radio del sello, detras del logo.
# El radio del sello es 0.079 del ancho: incluye el hueco transparente que el
# logo oficial deja alrededor del sello (el amarillo solo llega a ~0.069).
RADIO_SELLO = 0.079
FACTOR_ARO = 1.12
# Alto final: el logo se muestra a 52px; se exporta a 3x para pantallas densas.
ALTO_FINAL = 156
# Margen transparente alrededor del recorte, en px del original.
MARGEN = 4


def es_amarillo(p):
    r, g, b, a = p
    return a > 128 and r > 190 and g > 190 and b < 170


def es_azul(p):
    r, g, b, a = p
    return a > 0 and b > 150 and b > r + 60


def mascara_sello(im):
    """La zona del sello: el amarillo con los huecos (letras UCV) rellenos."""
    w, h = im.size
    px = im.load()
    caja = None
    amarillos = [(x, y) for y in range(h) for x in range(w) if es_amarillo(px[x, y])]
    xs = [p[0] for p in amarillos]
    ys = [p[1] for p in amarillos]
    caja = (min(xs) - 2, min(ys) - 2, max(xs) + 3, max(ys) + 3)

    m = Image.new("L", (w, h), 0)
    mp = m.load()
    for x, y in amarillos:
        mp[x, y] = 255
    # Relleno de huecos: se inunda el fondo desde una esquina de la caja y lo
    # que no se alcanzo (rodeado de amarillo) es parte del sello.
    sub = m.crop(caja)
    ImageDraw.floodfill(sub, (0, 0), 128)
    sp = sub.load()
    for y in range(sub.height):
        for x in range(sub.width):
            sp[x, y] = 0 if sp[x, y] == 128 else 255
    m = Image.new("L", (w, h), 0)
    m.paste(sub, caja[:2])
    # Un pixel de margen para el antialias del canto del sello.
    m = m.filter(__import__("PIL.ImageFilter", fromlist=["MaxFilter"]).MaxFilter(3))
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2
    radio = max(max(xs) - min(xs), max(ys) - min(ys)) / 2
    return m, (cx, cy, radio)


def recolorear(im, sello, color):
    out = im.copy()
    op = out.load()
    sp = sello.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            p = op[x, y]
            if sp[x, y] == 0 and es_azul(p):
                op[x, y] = (*color, p[3])
    return out


def con_aro(im, centro):
    """Circulo blanco (con antialias, a 4x) detras del logo."""
    cx, cy, _ = centro
    w, h = im.size
    r = RADIO_SELLO * w * FACTOR_ARO
    # El aro puede salirse del lienzo original: se amplia lo justo.
    izq = max(0, int(-(cx - r)) + 1)
    arr = max(0, int(-(cy - r)) + 1)
    der = max(0, int(cx + r - w) + 1)
    aba = max(0, int(cy + r - h) + 1)
    lienzo = Image.new("RGBA", (w + izq + der, h + arr + aba), (0, 0, 0, 0))
    k = 4
    capa = Image.new("RGBA", (lienzo.width * k, lienzo.height * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    ccx, ccy = (cx + izq) * k, (cy + arr) * k
    d.ellipse((ccx - r * k, ccy - r * k, ccx + r * k, ccy + r * k), fill=(*BLANCO, 255))
    capa = capa.resize(lienzo.size, Image.LANCZOS)
    lienzo.alpha_composite(capa)
    lienzo.alpha_composite(im, (izq, arr))
    return lienzo


def exportar(im, nombre):
    caja = im.getbbox()
    caja = (
        max(0, caja[0] - MARGEN),
        max(0, caja[1] - MARGEN),
        min(im.width, caja[2] + MARGEN),
        min(im.height, caja[3] + MARGEN),
    )
    im = im.crop(caja)
    ancho = round(im.width * ALTO_FINAL / im.height)
    im = im.resize((ancho, ALTO_FINAL), Image.LANCZOS)
    DESTINO.mkdir(parents=True, exist_ok=True)
    im.save(DESTINO / f"{nombre}.png", optimize=True)
    im.save(DESTINO / f"{nombre}.webp", quality=92, method=6)
    print(f"{nombre}: {im.width} x {im.height}")
    return im


def fragmentos_sueltos(im, sello):
    """Cuenta pixeles azules del wordmark que quedan pegados al sello tras el
    recolor (lo que en los recolores simulados quedaba como fragmento)."""
    px = im.load()
    sp = sello.load()
    w, h = im.size
    return sum(1 for y in range(h) for x in range(w) if sp[x, y] == 0 and es_azul(px[x, y]))


def main():
    oficial = Image.open(ORIGEN).convert("RGBA")
    sello, centro = mascara_sello(oficial)
    w = oficial.width
    print(
        f"sello: centro ({centro[0]:.0f}, {centro[1]:.0f}) = ({centro[0] / w:.3f}w, {centro[1] / w:.3f}w),"
        f" radio {centro[2]:.0f} = {centro[2] / w:.3f}w"
    )
    exportar(con_aro(oficial, centro), "logo-latidos-aro")
    for nombre, color in (("blanco", BLANCO), ("navy", NAVY)):
        recolor = recolorear(oficial, sello, color)
        sobrantes = fragmentos_sueltos(recolor, sello)
        print(f"  {nombre}: pixeles azules fuera del sello tras recolorear: {sobrantes}")
        exportar(con_aro(recolor, centro), f"logo-latidos-{nombre}-aro")


if __name__ == "__main__":
    main()
