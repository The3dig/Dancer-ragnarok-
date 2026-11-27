"""Quatro músicas novas (pedido do Rone: "mais músicas" e trocar a da Torre, que ele não gostou).

  torre_epica: Torre do Cisma. Épica sombria e com melodia (cordas rápidas, trompas, metais, coro,
               tímpanos e sinos), no lugar do doom lento e pesado.
  mina:        Mina da Forja. Canção de trabalho: batidas de bigorna, coro grave cantarolando,
               fagote e tuba no baixo, tambor grande nos passos.
  cripta:      Cripta das Cartas. Misteriosa: celesta, harpa em arpejo, glockenspiel, cordas graves e coro.
  arena:       Arena de Solmira. Batalha: taikos, caixa, fanfarra de metais, cordas e tímpanos.

Mesmo jeito da Torre (scripts/compor_torre2.py): MIDI com mido, tocado pelo FluidR3 GM (licença MIT)
no fluidsynth; toca duas vezes e corta a segunda, para o laço não ter emenda.
Uso: python3 scripts/compor_novas.py <banco.sf2> <pasta de saída> [nome ...]
"""
import os, random, subprocess, sys, tempfile
import mido

SF, PASTA = sys.argv[1], sys.argv[2]
QUAIS = sys.argv[3:] or ['torre_epica', 'mina', 'cripta', 'arena']
TPB = 480
HARM = [0, 2, 3, 5, 7, 8, 11]      # menor harmônica
NAT = [0, 2, 3, 5, 7, 8, 10]       # menor natural
DOR = [0, 2, 3, 5, 7, 9, 10]       # dórico (menor com a sexta maior: soa de "trabalho", antigo)
K, S, CRASH, TOM1, TOM2, TOMB, TAMB, PALMA = 36, 38, 49, 48, 45, 41, 54, 39


class Peca:
    def __init__(self, bpm, tom, escala):
        self.bpm, self.tom, self.esc, self.ev, self.canais = bpm, tom, escala, [], {}

    def g(self, grau, oit=0):
        o, i = divmod(grau, 7)
        return self.tom + 12 * (o + oit) + self.esc[i]

    def instrumento(self, nome, canal, programa, vol=100, pan=64, reverb=60):
        self.canais[nome] = canal
        self.ev += [(0, 'pc', canal, programa, 0), (0, 'cc', canal, 7, vol), (0, 'cc', canal, 10, pan), (0, 'cc', canal, 91, reverb)]

    def nota(self, nome, ini, dur, nota, vel):
        c = self.canais[nome]
        t0, t1 = int(ini * TPB), int((ini + dur) * TPB) - 6
        vel = max(1, min(127, int(vel + random.uniform(-5, 5))))
        self.ev += [(t0, 'on', c, nota, vel), (t1, 'off', c, nota, 0)]

    def acorde(self, nome, ini, dur, notas, vel):
        for n in notas: self.nota(nome, ini, dur, n, vel)

    def triade(self, grau, oit=0):
        return [self.g(grau + 2 * i, oit) for i in range(3)]

    def melodia(self, nome, ini, frase, oit=1, vel=90):
        t = ini
        for gr, d in frase:
            if gr is not None: self.nota(nome, t, d * 0.95, self.g(gr, oit), vel)
            t += d
        assert abs(t - ini - 4) < 1e-6 or abs(t - ini - 8) < 1e-6, (nome, frase)   # cada frase fecha o compasso

    def salvar(self, caminho, beats, vezes=2):
        mid = mido.MidiFile(ticks_per_beat=TPB); tr = mido.MidiTrack(); mid.tracks.append(tr)
        tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm)))
        L = int(beats * TPB); evs = []
        for v in range(vezes):
            for (t, k, c, a, b) in self.ev:
                if v > 0 and t == 0 and k in ('pc', 'cc'): continue
                evs.append((t + v * L, 0 if k == 'off' else 1, k, c, a, b))
        evs.sort(); last = 0
        for (t, _, k, c, a, b) in evs:
            dt = t - last; last = t
            if k == 'on': tr.append(mido.Message('note_on', channel=c, note=a, velocity=b, time=dt))
            elif k == 'off': tr.append(mido.Message('note_off', channel=c, note=a, velocity=0, time=dt))
            elif k == 'pc': tr.append(mido.Message('program_change', channel=c, program=a, time=dt))
            else: tr.append(mido.Message('control_change', channel=c, control=a, value=b, time=dt))
        tr.append(mido.MetaMessage('end_of_track', time=int(L * vezes) - last + TPB * 8))
        mid.save(caminho)
        return beats * 60 / self.bpm


# ------------------------------------------------------------------ Torre do Cisma (épica sombria)
def torre_epica():
    random.seed(7)
    p = Peca(112, 50, HARM)                                                  # ré menor harmônica
    p.instrumento('cordas', 0, 48, 92, 40, 70); p.instrumento('trompas', 1, 60, 96, 80, 80)
    p.instrumento('metais', 2, 61, 88, 70, 70); p.instrumento('coro', 3, 52, 82, 50, 110)
    p.instrumento('baixo', 4, 43, 96, 64, 50); p.instrumento('timp', 5, 47, 100, 60, 70)
    p.instrumento('sino', 6, 14, 70, 64, 110); p.instrumento('harpa', 7, 46, 78, 30, 80)
    p.instrumento('violoncelo', 8, 42, 96, 50, 80); p.instrumento('bat', 9, 48, 92, 64, 50)
    prog = {'intro': [0, 5, 3, 4], 'A': [0, 5, 3, 4, 0, 5, 1, 4], 'B': [5, 2, 3, 4, 5, 2, 1, 4], 'ponte': [3, 0, 3, 4], 'C': [0, 5, 3, 4, 0, 5, 4, 0]}
    melA = [[(4, 2), (3, 1), (2, 1)], [(2, 1.5), (3, 0.5), (4, 2)], [(5, 1), (4, 1), (3, 1), (2, 1)], [(1, 3), (None, 1)],
            [(4, 2), (5, 1), (6, 1)], [(7, 3), (5, 1)], [(5, 1), (4, 1), (3, 1), (1, 1)], [(-1, 3), (None, 1)]]
    melB = [[(7, 2), (9, 1), (8, 1)], [(7, 1.5), (6, 0.5), (4, 2)], [(5, 2), (6, 1), (7, 1)], [(8, 3), (6, 1)],
            [(9, 2), (10, 1), (9, 1)], [(7, 1.5), (8, 0.5), (9, 2)], [(10, 1), (9, 1), (8, 1), (6, 1)], [(7, 4)]]
    melP = [[(2, 2), (3, 1), (4, 1)], [(2, 3), (0, 1)], [(3, 2), (4, 1), (5, 1)], [(4, 4)]]
    bar = 0
    for sec in ['intro', 'A', 'B', 'ponte', 'C']:
        for i, gr in enumerate(prog[sec]):
            t = bar * 4
            p.nota('baixo', t, 1.9, p.g(gr, -2), 84); p.nota('baixo', t + 2, 1.9, p.g(gr, -2), 76)
            if sec == 'intro':
                p.acorde('coro', t, 4, p.triade(gr, -1), 62); p.nota('sino', t, 4, p.g(0, 0), 70)
                for k in range(4): p.nota('harpa', t + k, 0.9, p.triade(gr, 0)[k % 3], 64)
                if i == 3: [p.nota('timp', t + 2 + k * 0.25, 0.25, p.g(0, -2), 56 + k * 7) for k in range(8)]
            if sec in ('A', 'B', 'C'):
                for k in range(8): p.nota('cordas', t + k * 0.5, 0.32, p.g(gr + [0, 2, 4, 2, 0, 2, 4, 7][k], 0), 72 if k % 2 == 0 else 58)   # ostinato
                p.nota('timp', t, 0.5, p.g(gr, -2), 84); p.nota('timp', t + 2.5, 0.5, p.g(gr, -2), 70)
                for off in (0, 1.5, 2.5): p.nota('bat', t + off, 0.3, TOMB, 70)
                p.nota('bat', t + 3, 0.3, TOM2, 62); p.nota('bat', t + 3.5, 0.3, TOM1, 66)
            if sec == 'A':
                p.melodia('trompas', t, melA[i], 1, 92); p.acorde('coro', t, 4, p.triade(gr, -1), 50)
            elif sec == 'B':
                p.melodia('metais', t, melB[i], 0, 96); p.acorde('coro', t, 4, p.triade(gr, 0), 66)
                if i in (0, 4): p.nota('bat', t, 1.5, CRASH, 72)
            elif sec == 'ponte':
                p.melodia('violoncelo', t, melP[i], 0, 88)
                for k in range(8): p.nota('harpa', t + k * 0.5, 0.45, p.triade(gr, 0)[[0, 1, 2, 1][k % 4]], 60)
                p.acorde('cordas', t, 4, p.triade(gr, -1), 48)
                if i == 3: [p.nota('timp', t + k * 0.25, 0.25, p.g(4, -2), 50 + k * 5) for k in range(16)]
            elif sec == 'C':
                p.melodia('trompas', t, melA[i], 1, 100); p.melodia('metais', t, melA[i], 0, 80)
                p.acorde('coro', t, 4, p.triade(gr, 0), 72)
                if i == 0: p.nota('bat', t, 1.5, CRASH, 80); p.nota('sino', t, 2, p.g(0, 1), 70)
            bar += 1
    return p, bar * 4


# ------------------------------------------------------------------ Mina da Forja (canção de trabalho)
def mina():
    random.seed(11)
    p = Peca(100, 50, DOR)                                                   # ré dórico
    p.instrumento('bigorna', 0, 14, 74, 84, 40); p.instrumento('coro', 1, 53, 86, 50, 80)
    p.instrumento('fagote', 2, 70, 92, 40, 50); p.instrumento('tuba', 3, 58, 94, 64, 40)
    p.instrumento('cordas', 4, 48, 70, 70, 60); p.instrumento('taiko', 5, 116, 104, 64, 40)
    p.instrumento('trompa', 6, 60, 88, 30, 70); p.instrumento('pizz', 7, 45, 84, 90, 50)
    p.instrumento('bat', 9, 0, 80, 64, 30)
    prog = [0, 0, 6, 0, 3, 3, 6, 4]                                           # i i VII i | IV IV VII v
    canto = [[(0, 1), (2, 1), (4, 1.5), (3, 0.5)], [(2, 2), (0, 2)], [(-1, 1), (0, 1), (2, 1), (1, 1)], [(0, 3), (None, 1)],
             [(3, 1), (4, 1), (5, 1.5), (4, 0.5)], [(3, 2), (2, 2)], [(1, 1), (2, 1), (3, 1), (2, 1)], [(1, 3), (None, 1)]]
    resp = [[(7, 1), (6, 0.5), (5, 0.5), (4, 2)], [(5, 1), (4, 1), (2, 2)], [(6, 1.5), (5, 0.5), (4, 1), (3, 1)], [(4, 4)],
            [(8, 1), (7, 0.5), (6, 0.5), (5, 2)], [(7, 1), (5, 1), (3, 2)], [(4, 1), (5, 1), (6, 1), (5, 1)], [(4, 4)]]
    bar = 0
    for sec in ['intro', 'A', 'B', 'A2']:
        for i, gr in enumerate(prog if sec != 'intro' else prog[:4]):
            t = bar * 4
            p.nota('taiko', t, 0.6, 50, 92); p.nota('taiko', t + 2, 0.6, 50, 80)            # os passos pesados
            p.nota('bigorna', t + 1, 0.25, p.g(0, 2), 80 if sec != 'intro' else 64)          # a bigorna: tim... tim-tim
            p.nota('bigorna', t + 3, 0.2, p.g(0, 2), 70); p.nota('bigorna', t + 3.5, 0.2, p.g(4, 1), 62)
            p.nota('tuba', t, 1.4, p.g(gr, -2), 86); p.nota('tuba', t + 2, 0.9, p.g(gr + 4, -3), 74); p.nota('tuba', t + 3, 0.9, p.g(gr, -2), 70)
            if sec == 'intro':
                p.acorde('cordas', t, 4, p.triade(gr, -1), 46)
            else:
                for k in range(4): p.nota('pizz', t + k + 0.5, 0.4, p.triade(gr, 0)[k % 3], 60)
                p.nota('bat', t + 1, 0.2, TAMB, 50); p.nota('bat', t + 3, 0.2, TAMB, 50)
            if sec in ('A', 'A2'):
                p.melodia('coro', t, canto[i], 0, 92 if sec == 'A2' else 84)
                p.melodia('fagote', t, canto[i], -1, 70)
                if sec == 'A2': p.melodia('trompa', t, resp[i], 0, 74)
            elif sec == 'B':
                p.melodia('trompa', t, resp[i], 0, 88); p.acorde('coro', t, 4, p.triade(gr, -1), 58)
                p.acorde('cordas', t, 4, p.triade(gr, 0), 52)
                p.nota('bat', t + 1, 0.2, PALMA, 58); p.nota('bat', t + 3, 0.2, PALMA, 58)
            bar += 1
    return p, bar * 4


# ------------------------------------------------------------------ Cripta das Cartas (misteriosa)
def cripta():
    random.seed(5)
    p = Peca(76, 57, HARM)                                                   # lá menor harmônica
    p.instrumento('celesta', 0, 8, 86, 60, 110); p.instrumento('harpa', 1, 46, 82, 40, 100)
    p.instrumento('glock', 2, 9, 56, 90, 120); p.instrumento('cordas', 3, 49, 70, 64, 100)
    p.instrumento('coro', 4, 52, 60, 70, 120); p.instrumento('pizz', 5, 45, 76, 50, 70)
    p.instrumento('flauta', 6, 73, 78, 80, 100)
    prog = [0, 5, 3, 4, 0, 5, 1, 4]                                           # i VI iv V | i VI ii° V
    mel = [[(4, 1.5), (5, 0.5), (4, 1), (2, 1)], [(5, 2), (4, 1), (2, 1)], [(3, 1), (2, 1), (0, 1), (2, 1)], [(1, 3), (None, 1)],
           [(4, 1), (7, 1), (6, 1), (4, 1)], [(5, 1.5), (4, 0.5), (2, 2)], [(3, 1), (1, 1), (2, 1), (-1, 1)], [(0, 3), (None, 1)]]
    bar = 0
    for sec in ['intro', 'A', 'B']:
        for i, gr in enumerate(prog if sec != 'intro' else prog[:4]):
            t = bar * 4
            tri = p.triade(gr, 0)
            for k in range(8): p.nota('harpa', t + k * 0.5, 0.5, [tri[0], tri[1], tri[2], p.g(gr + 7, 0)][k % 4], 58 if k % 4 else 66)   # arpejo
            p.acorde('cordas', t, 4, p.triade(gr, -1), 44)
            p.nota('pizz', t, 0.8, p.g(gr, -2), 70); p.nota('pizz', t + 2, 0.8, p.g(gr, -2), 60)
            if sec == 'intro':
                p.acorde('coro', t, 4, p.triade(gr, -1), 48)
                if i % 2 == 0: p.nota('glock', t + 3.5, 0.5, p.g(gr + 7, 1), 50)
            elif sec == 'A':
                p.melodia('celesta', t, mel[i], 1, 86)
                p.nota('glock', t + 3.5, 0.5, p.g(gr + 4, 2), 44)
            else:
                p.melodia('flauta', t, mel[i], 1, 80); p.melodia('celesta', t, mel[i], 2, 56)
                p.acorde('coro', t, 4, p.triade(gr, 0), 54)
            bar += 1
    return p, bar * 4


# ------------------------------------------------------------------ Arena de Solmira (batalha)
def arena():
    random.seed(3)
    p = Peca(140, 52, NAT)                                                   # mi menor
    p.instrumento('metais', 0, 61, 96, 60, 70); p.instrumento('trompete', 1, 56, 90, 80, 60)
    p.instrumento('cordas', 2, 48, 90, 40, 60); p.instrumento('taiko', 3, 116, 110, 64, 40)
    p.instrumento('timp', 4, 47, 100, 60, 60); p.instrumento('baixo', 5, 43, 96, 64, 40)
    p.instrumento('coro', 6, 52, 78, 50, 90); p.instrumento('bat', 9, 48, 90, 64, 40)
    prog = {'intro': [0, 0, 5, 6], 'A': [0, 5, 2, 6, 0, 5, 3, 4], 'B': [5, 6, 0, 0, 5, 6, 3, 4], 'A2': [0, 5, 2, 6, 0, 5, 4, 0]}
    fan = [[(0, 0.5), (0, 0.5), (0, 0.5), (2, 0.5), (4, 2)], [(5, 1), (4, 1), (2, 2)], [(2, 0.5), (2, 0.5), (2, 0.5), (4, 0.5), (6, 2)], [(7, 3), (None, 1)],
           [(7, 0.5), (7, 0.5), (7, 0.5), (6, 0.5), (4, 2)], [(5, 1), (4, 1), (2, 2)], [(3, 1), (4, 1), (5, 1), (6, 1)], [(4, 3), (None, 1)]]
    bmel = [[(9, 2), (8, 1), (7, 1)], [(8, 2), (6, 2)], [(7, 1), (6, 1), (4, 1), (6, 1)], [(7, 4)],
            [(9, 2), (10, 1), (9, 1)], [(8, 2), (6, 2)], [(5, 1), (6, 1), (7, 1), (8, 1)], [(6, 3), (None, 1)]]
    bar = 0
    for sec in ['intro', 'A', 'B', 'A2']:
        for i, gr in enumerate(prog[sec]):
            t = bar * 4
            for off in (0, 1.5, 2, 3.5): p.nota('taiko', t + off, 0.3, 48 if off in (0, 2) else 55, 96 if off == 0 else 78)
            p.nota('baixo', t, 0.9, p.g(gr, -2), 88); p.nota('baixo', t + 1.5, 0.4, p.g(gr, -2), 72); p.nota('baixo', t + 2, 0.9, p.g(gr, -2), 80)
            if sec == 'intro':
                p.acorde('metais', t, 2, p.triade(gr, -1), 80); p.acorde('coro', t, 4, p.triade(gr, -1), 64)
                if i == 3: [p.nota('bat', t + k * 0.25, 0.25, S, 50 + k * 4) for k in range(16)]
                continue
            for k in range(8): p.nota('cordas', t + k * 0.5, 0.3, p.g(gr + [0, 0, 4, 0, 2, 0, 4, 2][k], 0), 70 if k % 2 == 0 else 56)
            p.nota('bat', t + 1, 0.2, S, 70); p.nota('bat', t + 3, 0.2, S, 74)
            p.nota('timp', t, 0.5, p.g(gr, -2), 78)
            if sec in ('A', 'A2'):
                p.melodia('trompete', t, fan[i], 1, 96); p.melodia('metais', t, fan[i], 0, 82 if sec == 'A2' else 70)
                if i in (0, 4): p.nota('bat', t, 1.5, CRASH, 76)
            else:
                p.melodia('metais', t, bmel[i], 0, 92); p.acorde('coro', t, 4, p.triade(gr, 0), 70)
            bar += 1
    return p, bar * 4


os.makedirs(PASTA, exist_ok=True)
for nome in QUAIS:
    p, beats = globals()[nome]()
    tmp = tempfile.mkdtemp()
    mid, wav = os.path.join(tmp, nome + '.mid'), os.path.join(tmp, nome + '.wav')
    dur = p.salvar(mid, beats, 2)
    subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '44100', '-R', '1', '-C', '1',
                    '-o', 'synth.reverb.room-size=0.8', '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.45',
                    '-F', wav, SF, mid], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{dur:.4f}', '-t', f'{dur:.4f}', '-i', wav,
                    '-af', 'loudnorm=I=-21:TP=-3', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', os.path.join(PASTA, nome + '.mp4')], check=True)
    print(f'{nome}: {dur:.2f}s')
