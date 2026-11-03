"""Remove fundo branco ou quase branco; requer Pillow e NumPy.
Uso: python remover_fundo.py entrada.png saida.png
Atenção: partes brancas do personagem também podem ficar transparentes.
"""
import sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter


def remover_fundo(origem, destino, inicio=210, fim=230, reduzir_borda=3):
    imagem = Image.open(origem).convert('RGBA')
    pixels = np.asarray(imagem, dtype=np.float32).copy()
    rgb = pixels[..., :3]
    # A menor componente garante que somente cores próximas do branco sejam removidas.
    minimo = rgb.min(axis=2)
    # Componentes grandes quase brancos são candidatos a fundo; pequenos brilhos
    # isolados no personagem permanecem opacos.
    candidatos = minimo >= 245
    altura, largura = candidatos.shape
    visitados = np.zeros_like(candidatos, dtype=bool)
    fundo = np.zeros_like(candidatos, dtype=np.uint8)
    for y, x in zip(*np.nonzero(candidatos)):
        if visitados[y, x]:
            continue
        fila = deque([(int(y), int(x))])
        visitados[y, x] = True
        componente = []
        while fila:
            cy, cx = fila.popleft()
            componente.append((cy, cx))
            for ny, nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                if 0 <= ny < altura and 0 <= nx < largura and candidatos[ny, nx] and not visitados[ny, nx]:
                    visitados[ny, nx] = True
                    fila.append((ny, nx))
        if len(componente) >= 200:
            ys, xs = zip(*componente)
            fundo[ys, xs] = 255
    # Inclui a transição da borda sem alterar áreas claras internas da figura.
    regiao = np.asarray(Image.fromarray(fundo).filter(ImageFilter.MaxFilter(9))) > 0
    cobertura = np.where(regiao, np.clip((fim - minimo) / (fim - inicio), 0, 1), 1)
    alfa_original = pixels[..., 3] / 255.0
    pixels[..., 3] = np.round(255 * alfa_original * cobertura)
    # Desconta o branco misturado às bordas semitransparentes.
    parcial = (cobertura > 0) & (cobertura < 1)
    rgb[parcial] = np.clip((rgb[parcial] - 255 * (1 - cobertura[parcial, None])) / cobertura[parcial, None], 0, 255)
    # Encolhe a máscara somente na borda; o desfoque suaviza o novo contorno.
    if reduzir_borda > 0:
        alfa = Image.fromarray(pixels[..., 3].astype(np.uint8))
        tamanho = 2 * int(reduzir_borda) + 1
        reduzido = alfa.filter(ImageFilter.MinFilter(tamanho)).filter(ImageFilter.GaussianBlur(0.35))
        pixels[..., 3] = np.minimum(pixels[..., 3], np.asarray(reduzido))
    Image.fromarray(np.uint8(np.clip(pixels, 0, 255)), 'RGBA').save(destino)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Uso: python remover_fundo.py entrada.png saida.png')
    remover_fundo(Path(sys.argv[1]), Path(sys.argv[2]))
