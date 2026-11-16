"""Torre do Cisma: três versões novas para o Rone escolher (sem a "voz soprano" do sintetizador).

  a) sinfonico: metal sinfônico sombrio (órgão, coro grave, cordas rápidas, metais, guitarra e bateria)
  b) doom:      doom gótico lento (órgão, sinos, violoncelo, piano, guitarra pesada e lenta)
  c) coral:     coral épico sem guitarra (coro com a melodia, cravo, cordas, tímpanos, órgão)

Uso: python3 scripts/compor_torre2.py <banco.sf2> <saída.mp4> <a|b|c>
"""
import os, random, subprocess, sys, tempfile
import mido

SF, SAIDA, VAR = sys.argv[1], sys.argv[2], sys.argv[3]
TPB = 480
MIN = [0, 2, 3, 5, 7, 8, 10]


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

    def melodia(self, nome, ini, frase, oit=1, vel=90):
        t = ini
        for gr, d in frase:
            if gr is not None: self.nota(nome, t, d * 0.97, self.g(gr, oit), vel)
            t += d

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


def power(p, grau):            # acorde de quinta (sem terça): o som do metal
    r = p.g(grau, -2)
    return [r, r + 7, r + 12]


def triade(p, grau, oit=0):
    return [p.g(grau + 2 * i, oit) for i in range(3)]



HARM = [0, 2, 3, 5, 7, 8, 11]       # menor harmônica (o "gótico" da sétima maior)
K, S, RIDE, CRASH, HH, TOM = 36, 38, 51, 49, 42, 45


def sinfonico():
    random.seed(21)
    p = Peca(132, 50, HARM)                                    # ré menor harmônica
    p.instrumento('orgao', 0, 19, 70, 64, 100); p.instrumento('coro', 1, 52, 80, 44, 110)
    p.instrumento('cordas', 2, 48, 92, 34, 70); p.instrumento('metais', 3, 61, 84, 84, 70)
    p.instrumento('violino', 4, 40, 96, 70, 80); p.instrumento('guit', 5, 30, 74, 90, 40)
    p.instrumento('baixo', 6, 33, 90, 64, 30); p.instrumento('timp', 7, 47, 92, 60, 70)
    p.instrumento('sino', 8, 14, 74, 64, 110); p.instrumento('bat', 9, 16, 88, 64, 50)
    secs = [('intro', [0, 5, 3, 4]), ('A', [0, 5, 3, 4, 0, 5, 1, 4]), ('B', [5, 3, 0, 4, 5, 3, 1, 4]),
            ('ponte', [3, 3, 4, 4]), ('B', [5, 3, 0, 4, 5, 3, 1, 4]), ('fim', [0, 0])]
    melA = [[(4, 1.5), (5, 0.5), (4, 1), (2, 1)], [(5, 2), (4, 1), (3, 1)], [(2, 1.5), (3, 0.5), (2, 1), (0, 1)], [(1, 2), (-1, 2)],
            [(4, 1.5), (5, 0.5), (7, 1), (6, 1)], [(5, 2), (7, 2)], [(6, 1), (5, 1), (3, 1), (1, 1)], [(-1, 2), (0, 2)]]
    melB = [[(9, 2), (8, 1), (7, 1)], [(8, 1.5), (7, 0.5), (5, 2)], [(7, 2), (4, 1), (5, 1)], [(6, 4)],
            [(9, 1), (10, 1), (11, 1), (9, 1)], [(8, 2), (7, 2)], [(5, 1), (6, 1), (8, 1), (6, 1)], [(7, 4)]]
    bar = 0
    for nome, prog in secs:
        for i, gr in enumerate(prog):
            t = bar * 4
            p.acorde('orgao', t, 4, [p.g(gr, -1), p.g(gr + 2, -1), p.g(gr + 4, -1)], 52 if nome != 'fim' else 60)
            p.nota('baixo', t, 1.8, p.g(gr, -2), 84); p.nota('baixo', t + 2, 1.8, p.g(gr, -2), 76)
            if nome in ('A', 'B', 'ponte'):
                for k in range(8): p.nota('cordas', t + k * 0.5, 0.3, p.g(gr + [0, 4, 2, 4, 0, 4, 2, 4][k], 0), 70 if k % 2 == 0 else 56)   # ostinato rápido
            if nome == 'intro':
                p.acorde('coro', t, 4, [p.g(gr, -1), p.g(gr + 2, -1), p.g(gr + 4, -1)], 64); p.nota('sino', t, 4, p.g(0, 0), 72)
                if i == 3: [p.nota('timp', t + 2 + k * 0.25, 0.25, p.g(0, -2), 60 + k * 6) for k in range(8)]
            elif nome == 'A':
                p.melodia('violino', t, melA[i], 1, 92)
                for k in range(8): p.acorde('guit', t + k * 0.5, 0.4, power(p, gr)[:2], 58 if k % 2 else 66)
                for off in (0, 1.5, 2): p.nota('bat', t + off, 0.3, K, 78)
                for off in (1, 3): p.nota('bat', t + off, 0.4, S, 72)
                for k in range(8): p.nota('bat', t + k * 0.5, 0.2, HH, 44)
            elif nome == 'B':
                p.melodia('metais', t, melB[i], 0, 92); p.melodia('coro', t, melB[i], 0, 66)
                for k in range(8): p.acorde('guit', t + k * 0.5, 0.45, power(p, gr), 70)
                for k in range(8): p.nota('bat', t + k * 0.5, 0.25, K, 70)             # bumbo duplo
                for off in (1, 3): p.nota('bat', t + off, 0.4, S, 80)
                p.nota('bat', t, 1, CRASH if i % 2 == 0 else RIDE, 74)
                if i % 4 == 0: p.nota('timp', t, 1, p.g(0, -2), 90)
            elif nome == 'ponte':
                p.acorde('coro', t, 4, [p.g(gr, 0), p.g(gr + 2, 0), p.g(gr + 4, 0)], 70)
                p.melodia('violino', t, [[(4, 4)], [(5, 4)], [(6, 2), (7, 2)], [(8, 4)]][i], 1, 88)
                p.nota('timp', t, 0.5, p.g(gr, -2), 80); p.nota('timp', t + 2, 0.5, p.g(gr, -2), 70)
                p.nota('bat', t, 0.5, K, 70); p.nota('bat', t + 2, 0.5, S, 66)
            else:
                p.acorde('coro', t, 4, [p.g(0, -1), p.g(2, -1), p.g(4, -1)], 58); p.nota('sino', t, 4, p.g(0, 0), 66)
            bar += 1
    return p, bar * 4


def doom():
    random.seed(33)
    p = Peca(76, 45, HARM)                                     # lá menor harmônica, lento e pesado
    p.instrumento('orgao', 0, 19, 74, 64, 110); p.instrumento('cello', 1, 42, 98, 46, 90)
    p.instrumento('piano', 2, 0, 80, 84, 90); p.instrumento('coro', 3, 52, 66, 64, 120)
    p.instrumento('guit', 5, 30, 80, 70, 40); p.instrumento('guit2', 4, 30, 72, 40, 40)
    p.instrumento('baixo', 6, 34, 92, 64, 30); p.instrumento('sino', 8, 14, 80, 64, 120)
    p.instrumento('bat', 9, 16, 90, 64, 70)
    secs = [('intro', [0, 5, 3, 4]), ('A', [0, 5, 3, 4, 0, 5, 1, 4]), ('B', [3, 4, 0, 5, 3, 4, 1, 4]), ('fim', [0, 0])]
    mel = [[(4, 3), (3, 1)], [(2, 2), (0, 2)], [(1, 3), (2, 1)], [(-1, 4)], [(4, 2), (5, 1), (4, 1)], [(7, 3), (5, 1)], [(4, 2), (3, 1), (1, 1)], [(0, 4)]]
    melB = [[(7, 2), (6, 2)], [(4, 4)], [(5, 2), (4, 1), (2, 1)], [(4, 4)], [(7, 2), (9, 2)], [(8, 3), (7, 1)], [(6, 2), (4, 2)], [(4, 4)]]
    bar = 0
    for nome, prog in secs:
        for i, gr in enumerate(prog):
            t = bar * 4
            p.acorde('orgao', t, 4, [p.g(gr, -1), p.g(gr + 2, -1), p.g(gr + 4, -1)], 50)
            if nome == 'intro':
                p.nota('sino', t, 4, p.g(0, 0), 76)
                for k, s_ in enumerate([0, 4, 7, 9, 7, 4, 2, 4]): p.nota('piano', t + k * 0.5, 0.5, p.g(gr + s_, 0), 54)
            elif nome in ('A', 'B'):
                p.melodia('cello', t, (mel if nome == 'A' else melB)[i], 0 if nome == 'A' else 0, 92)
                p.acorde('guit', t, 1.9, power(p, gr), 84); p.acorde('guit', t + 2, 0.9, power(p, gr), 76); p.acorde('guit', t + 3, 0.9, power(p, gr + (1 if i % 2 else 0)), 76)
                p.acorde('guit2', t, 3.9, power(p, gr)[:2], 60)
                p.nota('baixo', t, 2, p.g(gr, -2), 92); p.nota('baixo', t + 2, 2, p.g(gr, -2), 84)
                p.nota('bat', t, 1, K, 92); p.nota('bat', t + 2, 1, S, 90); p.nota('bat', t + 2.5, 0.5, K, 70)
                p.nota('bat', t, 2, CRASH if i % 4 == 0 else RIDE, 70); p.nota('bat', t + 1, 0.5, RIDE, 54); p.nota('bat', t + 3, 0.5, RIDE, 54)
                if nome == 'B': p.acorde('coro', t, 4, [p.g(gr, 0), p.g(gr + 2, 0), p.g(gr + 4, 0)], 58)
                if i % 4 == 0: p.nota('sino', t, 4, p.g(0, 0), 60)
            else:
                p.nota('sino', t, 4, p.g(0, 0), 70); p.acorde('coro', t, 4, [p.g(0, 0), p.g(2, 0), p.g(4, 0)], 56)
            bar += 1
    return p, bar * 4


def coral():
    random.seed(44)
    p = Peca(96, 52, HARM)                                     # mi menor harmônica
    p.instrumento('coro', 0, 52, 100, 64, 110); p.instrumento('coro2', 1, 52, 80, 40, 110)
    p.instrumento('cravo', 2, 6, 74, 90, 70); p.instrumento('cordas', 3, 48, 86, 30, 90)
    p.instrumento('orgao', 4, 19, 60, 64, 110); p.instrumento('timp', 5, 47, 96, 60, 70)
    p.instrumento('trompas', 6, 60, 80, 80, 80); p.instrumento('baixo', 7, 43, 86, 64, 60)
    p.instrumento('sino', 8, 14, 76, 64, 120); p.instrumento('bat', 9, 16, 80, 64, 70)
    secs = [('intro', [0, 5, 3, 4]), ('A', [0, 5, 3, 4, 0, 5, 1, 4]), ('B', [5, 3, 0, 4, 5, 3, 6, 4]), ('fim', [0, 0])]
    melA = [[(4, 2), (5, 1), (4, 1)], [(2, 2), (3, 2)], [(4, 3), (2, 1)], [(1, 4)], [(4, 2), (6, 1), (5, 1)], [(4, 2), (2, 2)], [(3, 1), (2, 1), (1, 1), (-1, 1)], [(0, 4)]]
    melB = [[(7, 3), (8, 1)], [(7, 2), (5, 2)], [(4, 2), (5, 1), (7, 1)], [(6, 4)], [(9, 2), (8, 1), (7, 1)], [(8, 2), (7, 2)], [(6, 1), (7, 1), (8, 1), (6, 1)], [(7, 4)]]
    bar = 0
    for nome, prog in secs:
        for i, gr in enumerate(prog):
            t = bar * 4
            p.acorde('orgao', t, 4, [p.g(gr, -1), p.g(gr + 4, -1)], 46)
            p.nota('baixo', t, 3.8, p.g(gr, -2), 74)
            if nome != 'fim':
                for k, s_ in enumerate([0, 2, 4, 7, 9, 7, 4, 2]): p.nota('cravo', t + k * 0.5, 0.45, p.g(gr + s_, 0), 60 if k else 70)
            if nome == 'intro':
                p.acorde('cordas', t, 4, [p.g(gr, -1), p.g(gr + 2, -1), p.g(gr + 4, -1)], 54); p.nota('sino', t, 4, p.g(0, 0), 70)
            elif nome == 'A':
                p.melodia('coro', t, melA[i], 1, 86)
                p.acorde('cordas', t, 4, [p.g(gr, -1), p.g(gr + 2, -1), p.g(gr + 4, -1)], 58)
                p.nota('timp', t, 0.5, p.g(gr, -2), 70); p.nota('bat', t + 2, 0.5, S, 50)
            elif nome == 'B':
                p.melodia('coro', t, melB[i], 0, 96); p.melodia('coro2', t, melB[i], -1, 70); p.melodia('trompas', t, melB[i], -1, 76)
                for k in range(8): p.nota('cordas', t + k * 0.5, 0.3, p.g(gr + [0, 4, 2, 4][k % 4], 0), 66)
                for off in (0, 1, 2, 3): p.nota('timp', t + off, 0.4, p.g(gr if off % 2 == 0 else gr + 4, -2), 84 if off == 0 else 66)
                p.nota('bat', t, 1, CRASH if i % 4 == 0 else RIDE, 60)
            else:
                p.acorde('coro', t, 4, [p.g(0, 0), p.g(2, 0), p.g(4, 0)], 64); p.nota('sino', t, 4, p.g(0, 0), 66)
            bar += 1
    return p, bar * 4


p, beats = {'a': sinfonico, 'b': doom, 'c': coral}[VAR]()
tmp = tempfile.mkdtemp()
mid, wav = os.path.join(tmp, 'torre.mid'), os.path.join(tmp, 'torre.wav')
dur = p.salvar(mid, beats, 2)
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '44100', '-R', '1', '-C', '1',
                '-o', 'synth.reverb.room-size=0.85', '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.5',
                '-F', wav, SF, mid], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{dur:.4f}', '-t', f'{dur:.4f}', '-i', wav,
                '-af', 'loudnorm=I=-21:TP=-3', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', SAIDA], check=True)
print(f'torre {VAR}: {dur:.2f}s')
