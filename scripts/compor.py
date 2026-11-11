"""Trilha sonora original do Reino Quebrado Online.

Compõe as músicas em MIDI (orquestra General MIDI) e grava com o FluidSynth
usando o banco MuseScore General (MIT). Cada música é gerada duas vezes em
sequência e cortada na segunda volta, para o laço não ter emenda.

Uso: python3 scripts/compor.py <banco.sf3> <pasta de saída>
"""
import os, subprocess, sys, random
import mido

SF, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TPB = 480
MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]
HARM = [0, 2, 3, 5, 7, 8, 11]
PHRY_DOM = [0, 1, 4, 5, 7, 8, 10]
DOR = [0, 2, 3, 5, 7, 9, 10]


class Peca:
    def __init__(self, bpm, beats_por_compasso, tom, escala):
        self.bpm, self.bpc, self.tom, self.esc = bpm, beats_por_compasso, tom, escala
        self.ev = []          # (tick, tipo, canal, a, b)
        self.canais = {}

    def nota_grau(self, g, oit=0):
        o, i = divmod(g, 7)
        return self.tom + 12 * (o + oit) + self.esc[i]

    def instrumento(self, nome, canal, programa, vol=100, pan=64, reverb=70):
        self.canais[nome] = canal
        self.ev += [(0, 'pc', canal, programa, 0), (0, 'cc', canal, 7, vol), (0, 'cc', canal, 10, pan), (0, 'cc', canal, 91, reverb)]

    def nota(self, nome, inicio, dur, nota, vel):
        c = self.canais[nome]
        t0, t1 = int(inicio * TPB), int((inicio + dur) * TPB) - 8
        vel = max(1, min(127, int(vel + random.uniform(-6, 6))))
        self.ev += [(t0, 'on', c, nota, vel), (t1, 'off', c, nota, 0)]

    def acorde(self, nome, inicio, dur, notas, vel):
        for n in notas: self.nota(nome, inicio, dur, n, vel)

    def cc(self, nome, inicio, ctrl, val):
        self.ev.append((int(inicio * TPB), 'cc', self.canais[nome], ctrl, val))

    def melodia(self, nome, inicio, frase, oit=1, vel=88):
        """frase: [(grau ou None, beats)]"""
        t = inicio
        for g, d in frase:
            if g is not None: self.nota(nome, t, d * 0.98, self.nota_grau(g, oit), vel + (6 if d >= 2 else 0))
            t += d
        return t

    def salvar_midi(self, caminho, total_beats, vezes=2):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack(); mid.tracks.append(tr)
        tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(self.bpm)))
        tr.append(mido.MetaMessage('time_signature', numerator=self.bpc, denominator=4))
        L = int(total_beats * TPB)
        evs = []
        for v in range(vezes):
            for (t, k, c, a, b) in self.ev:
                if v > 0 and t == 0 and k in ('pc', 'cc'): continue
                evs.append((t + v * L, 0 if k == 'off' else 1, k, c, a, b))
        evs.sort()
        last = 0
        for (t, _, k, c, a, b) in evs:
            dt = t - last; last = t
            if k == 'on': tr.append(mido.Message('note_on', channel=c, note=a, velocity=b, time=dt))
            elif k == 'off': tr.append(mido.Message('note_off', channel=c, note=a, velocity=0, time=dt))
            elif k == 'pc': tr.append(mido.Message('program_change', channel=c, program=a, time=dt))
            else: tr.append(mido.Message('control_change', channel=c, control=a, value=b, time=dt))
        tr.append(mido.MetaMessage('end_of_track', time=int(L * vezes) - last + TPB * 8))
        mid.save(caminho)
        return total_beats * 60 / self.bpm


def triade(p, grau, oit=0, inv=0):
    ns = [p.nota_grau(grau + 2 * i, oit) for i in range(3)]
    for _ in range(inv): ns = ns[1:] + [ns[0] + 12]
    return ns


# ---------------------------------------------------------------- Vila de Solmira
def solmira():
    random.seed(1)
    p = Peca(84, 3, 53, MAJ)                      # Fá maior, valsa
    p.instrumento('cordas', 0, 48, 78, 54, 90); p.instrumento('harpa', 1, 46, 92, 76, 80)
    p.instrumento('flauta', 2, 73, 100, 60, 80); p.instrumento('oboe', 3, 68, 88, 70, 80)
    p.instrumento('cello', 4, 42, 92, 44, 70); p.instrumento('trompa', 5, 60, 70, 50, 90)
    A = [0, 4, 5, 3, 0, 4, 1, 4]                   # F C Dm Bb F C Gm C
    B = [5, 3, 0, 4, 5, 3, 1, 4]                   # Dm Bb F C Dm Bb Gm C
    prog = A + B + A + [5, 3, 0, 4, 5, 3, 4, 0]
    mel_A = [[(4, 2), (5, 1)], [(6, 2), (4, 1)], [(5, 2), (7, 1)], [(5, 3)],
             [(4, 1), (2, 1), (4, 1)], [(6, 2), (5, 1)], [(3, 2), (1, 1)], [(4, 3)]]
    mel_B = [[(7, 2), (9, 1)], [(8, 2), (7, 1)], [(6, 1), (7, 1), (4, 1)], [(4, 3)],
             [(7, 2), (9, 1)], [(10, 2), (8, 1)], [(6, 1), (5, 1), (3, 1)], [(4, 3)]]
    mel_F = [[(7, 2), (9, 1)], [(8, 2), (7, 1)], [(6, 1), (7, 1), (4, 1)], [(4, 3)],
             [(5, 1), (4, 1), (2, 1)], [(3, 2), (1, 1)], [(4, 1), (2, 1), (1, 1)], [(0, 3)]]
    for i, g in enumerate(prog):
        t = i * 3
        p.acorde('cordas', t, 3, triade(p, g, 0), 52 + (8 if i % 8 in (3, 7) else 0))
        p.nota('cello', t, 2.9, p.nota_grau(g, -2), 74)
        for k, s in enumerate([0, 2, 4, 7, 4, 2]):
            p.nota('harpa', t + k * 0.5, 0.9, p.nota_grau(g + s, -1), 64 if k else 74)
        sec = i // 8
        frase = (mel_A if sec in (0, 2) else mel_B if sec == 1 else mel_F)[i % 8]
        inst = 'flauta' if sec in (0, 3) else 'oboe'
        p.melodia(inst, t, frase, 1, 84)
        if sec == 1: p.melodia('trompa', t, [(g + 2, 3)], 0, 56)
        if sec == 2 and i % 2 == 0: p.melodia('flauta', t, [(g + 4, 3)], 1, 52)
    return p, len(prog) * 3


# ---------------------------------------------------------------- Campos Dourados
def campos():
    random.seed(2)
    p = Peca(104, 4, 50, MAJ)                     # Ré maior
    p.instrumento('cordas', 0, 48, 82, 50, 70); p.instrumento('ostinato', 1, 49, 74, 78, 60)
    p.instrumento('trompas', 2, 60, 100, 56, 80); p.instrumento('flauta', 3, 73, 82, 72, 80)
    p.instrumento('baixo', 4, 43, 96, 50, 60); p.instrumento('timp', 5, 47, 92, 64, 60)
    p.instrumento('trompete', 6, 56, 74, 70, 80)
    prog = [0, 4, 5, 3, 0, 4, 3, 4, 5, 3, 0, 4, 5, 3, 1, 4, 0, 4, 5, 3, 0, 4, 3, 0]
    tema = [[(4, 1.5), (5, 0.5), (4, 1), (2, 1)], [(1, 2), (4, 2)], [(5, 1.5), (6, 0.5), (7, 1), (5, 1)], [(3, 4)],
            [(4, 1.5), (5, 0.5), (4, 1), (7, 1)], [(8, 2), (6, 2)], [(5, 1), (4, 1), (3, 1), (5, 1)], [(4, 4)]]
    ponte = [[(5, 2), (7, 2)], [(8, 2), (7, 1), (5, 1)], [(4, 2), (2, 2)], [(4, 4)],
             [(5, 2), (7, 2)], [(10, 2), (8, 2)], [(8, 1), (7, 1), (6, 1), (5, 1)], [(4, 4)]]
    for i, g in enumerate(prog):
        t = i * 4
        p.acorde('cordas', t, 4, triade(p, g, 0, 1), 58)
        for k in range(8):
            s = [0, 4, 7, 4][k % 4]
            p.nota('ostinato', t + k * 0.5, 0.4, p.nota_grau(g + [0, 2, 4, 2][k % 4], 0), 60 + (10 if k % 2 == 0 else 0))
        p.nota('baixo', t, 1.5, p.nota_grau(g, -2), 84); p.nota('baixo', t + 2, 1.5, p.nota_grau(g, -2), 74)
        if i % 4 == 0: p.nota('timp', t, 1, p.nota_grau(g if g in (0, 4) else 0, -2), 90)
        if i % 4 == 3: [p.nota('timp', t + 3 + k * 0.25, 0.25, p.nota_grau(4, -2), 60 + k * 8) for k in range(4)]
        sec = i // 8
        frase = (tema if sec != 1 else ponte)[i % 8]
        p.melodia('trompas', t, frase, 0, 92 if sec != 1 else 84)
        if sec == 1: p.melodia('flauta', t, [(g + 4, 2), (g + 2, 2)], 2, 66)
        if sec == 2: p.melodia('trompete', t, frase, 1, 70)
    return p, len(prog) * 4


# ---------------------------------------------------------------- Areias Rubras
def areias():
    random.seed(3)
    p = Peca(92, 4, 52, PHRY_DOM)                 # Mi frígio dominante
    p.instrumento('drone', 0, 49, 70, 64, 90); p.instrumento('oboe', 1, 68, 100, 60, 90)
    p.instrumento('harpa', 2, 46, 86, 80, 70); p.instrumento('cello', 3, 42, 90, 46, 70)
    p.instrumento('flauta', 4, 72, 80, 72, 90)   # piccolo/flauta de madeira
    p.instrumento('perc', 9, 0, 96, 64, 50)
    prog = [0, 0, 1, 0, 6, 5, 1, 0] * 3
    frases = [[(4, 1), (5, 0.5), (4, 0.5), (2, 1), (1, 1)], [(0, 3), (None, 1)], [(1, 1), (2, 1), (4, 1.5), (2, 0.5)], [(1, 2), (0, 2)],
              [(7, 1.5), (6, 0.5), (5, 1), (4, 1)], [(5, 1), (4, 0.5), (2, 0.5), (1, 2)], [(2, 1), (1, 1), (0, 1), (-1, 1)], [(0, 4)]]
    for i, g in enumerate(prog):
        t = i * 4
        p.acorde('drone', t, 4, [p.nota_grau(0, -1), p.nota_grau(4, -1), p.nota_grau(g, 0)], 50)
        p.nota('cello', t, 1.5, p.nota_grau(g, -2), 80); p.nota('cello', t + 2.5, 1.5, p.nota_grau(0, -2), 70)
        for k, s in enumerate([0, 1, 2, 4, 2, 1, 0, 1]):
            p.nota('harpa', t + k * 0.5, 0.5, p.nota_grau(g + s, 0), 58 + (12 if k in (0, 3) else 0))
        for b, nota, vel in [(0, 62, 96), (1, 63, 70), (1.5, 64, 74), (2, 62, 88), (2.75, 63, 66), (3, 64, 80), (3.5, 63, 70)]:
            p.nota('perc', t + b, 0.25, nota, vel)
        sec = i // 8
        if sec == 0 or sec == 2: p.melodia('oboe', t, frases[i % 8], 1, 88)
        else: p.melodia('flauta', t, frases[i % 8], 1 if i % 8 < 4 else 2, 76)
    return p, len(prog) * 4


# ---------------------------------------------------------------- Kharum / Cidadela (mistério)
def kharum():
    random.seed(4)
    p = Peca(70, 4, 57, DOR)                      # Lá dórico
    p.instrumento('coro', 0, 52, 84, 50, 110); p.instrumento('cordas', 1, 49, 80, 74, 100)
    p.instrumento('sinos', 2, 14, 70, 64, 110); p.instrumento('harpa', 3, 46, 80, 70, 90)
    p.instrumento('baixo', 4, 43, 86, 52, 80); p.instrumento('clarinete', 5, 71, 86, 60, 90)
    prog = [0, 6, 3, 4, 0, 6, 2, 4, 5, 3, 0, 4, 5, 6, 3, 0]
    mel = [[(4, 2), (2, 1), (3, 1)], [(4, 3), (None, 1)], [(5, 2), (4, 1), (2, 1)], [(1, 4)],
           [(4, 2), (6, 1), (7, 1)], [(6, 3), (4, 1)], [(5, 1), (4, 1), (2, 1), (1, 1)], [(0, 4)]]
    for i, g in enumerate(prog):
        t = i * 4
        p.acorde('coro', t, 4, triade(p, g, 0, 1), 54 + (10 if i % 4 == 0 else 0))
        p.acorde('cordas', t, 4, [p.nota_grau(g, -1), p.nota_grau(g + 4, -1)], 50)
        p.nota('baixo', t, 4, p.nota_grau(g, -2), 72)
        if i % 2 == 0: p.nota('sinos', t, 2, p.nota_grau(g + 4, 1), 52)
        for k, s in enumerate([0, 4, 7, 9, 7, 4]):
            p.nota('harpa', t + 1 + k * 0.5, 0.6, p.nota_grau(g + s, -1), 52)
        if i >= 4: p.melodia('clarinete', t, mel[i % 8], 0, 80)
    return p, len(prog) * 4


# ---------------------------------------------------------------- Kravenox (épico e sombrio)
def kravenox():
    random.seed(5)
    p = Peca(132, 4, 50, HARM)                    # Ré menor harmônico
    p.instrumento('ost', 0, 48, 92, 64, 50); p.instrumento('coro', 1, 52, 96, 50, 90)
    p.instrumento('metais', 2, 61, 104, 56, 70); p.instrumento('trombones', 3, 57, 98, 46, 70)
    p.instrumento('baixo', 4, 43, 104, 52, 50); p.instrumento('timp', 5, 47, 110, 64, 60)
    p.instrumento('tuba', 6, 58, 96, 50, 60); p.instrumento('perc', 9, 0, 104, 64, 60)
    prog = [0, 0, 5, 4, 0, 0, 5, 6, 3, 3, 0, 4, 5, 3, 1, 4, 0, 0, 5, 4, 0, 0, 3, 4]
    # motivo do Kravenox: Ré–Fá–Mi–Lá(grave), repetido e elevado
    motivo = [[(0, 1.5), (2, 0.5), (1, 2)], [(-3, 3), (None, 1)], [(5, 1.5), (4, 0.5), (2, 2)], [(1, 4)],
              [(0, 1.5), (2, 0.5), (1, 2)], [(-3, 3), (None, 1)], [(3, 1), (4, 1), (5, 1), (6, 1)], [(7, 4)]]
    ponte = [[(2, 2), (3, 2)], [(4, 3), (2, 1)], [(0, 2), (1, 2)], [(-1, 4)],
             [(5, 2), (4, 2)], [(3, 2), (2, 2)], [(1, 2), (2, 1), (1, 1)], [(-1, 4)]]
    for i, g in enumerate(prog):
        t = i * 4
        for k in range(16):                      # semicolcheias das cordas
            off = [0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 2, 0, 3, 2, 1, 0][k]
            p.nota('ost', t + k * 0.25, 0.22, p.nota_grau(g + off, -1), 70 + (18 if k % 4 == 0 else 0))
        p.nota('baixo', t, 2, p.nota_grau(g, -2), 96); p.nota('baixo', t + 2, 2, p.nota_grau(g, -2), 86)
        p.nota('tuba', t, 4, p.nota_grau(g, -3), 70)
        p.acorde('coro', t, 4, triade(p, g, 0), 60 + (20 if i % 8 >= 4 else 0))
        p.nota('timp', t, 0.5, p.nota_grau(0, -2), 104)
        if i % 2: p.nota('timp', t + 2.5, 0.25, p.nota_grau(0, -2), 80); p.nota('timp', t + 3, 0.5, p.nota_grau(4, -3), 92)
        if i % 8 == 0: p.nota('perc', t, 2, 49, 100)           # prato
        p.nota('perc', t, 0.5, 35, 110); p.nota('perc', t + 2, 0.5, 35, 96)
        sec = i // 8
        frase = (motivo if sec != 1 else ponte)[i % 8]
        p.melodia('metais', t, frase, 1, 104)
        p.melodia('trombones', t, frase, 0, 92)
    return p, len(prog) * 4


PECAS = {'solmira': solmira, 'campos': campos, 'areias': areias, 'kharum': kharum, 'kravenox': kravenox}
for nome, fn in PECAS.items():
    p, beats = fn()
    mid = os.path.join(OUT, nome + '.mid')
    dur = p.salvar_midi(mid, beats, 2)
    wav = os.path.join(OUT, nome + '.wav')
    subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.7', '-r', '44100', '-R', '1', '-C', '1',
                    '-o', 'synth.reverb.room-size=0.75', '-o', 'synth.reverb.width=0.9', '-o', 'synth.reverb.level=0.6',
                    '-F', wav, SF, mid], check=True)
    # corta a 2ª volta (já com a cauda da reverberação da 1ª): laço sem emenda
    m4a = os.path.join(OUT, nome + '.m4a')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{dur:.4f}', '-t', f'{dur:.4f}', '-i', wav,
                    '-af', 'loudnorm=I=-18:TP=-2', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', m4a], check=True)
    os.remove(wav)
    print(f'{nome}: {dur:.1f}s')
