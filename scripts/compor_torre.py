"""Torre do Cisma: trilha de metal gótico (guitarras distorcidas, órgão de igreja,
coro, violino e bumbo duplo), em mi menor.

Mesmo jeito do scripts/compor.py: MIDI em General MIDI, gravado com o FluidSynth,
gerado duas vezes e cortado na segunda volta para o laço não ter emenda.
A trilha antiga da Torre (musica/masmorra.mp4) continua guardada.

Uso: python3 scripts/compor_torre.py <banco.sf2> <saída.mp4>
"""
import os, random, subprocess, sys, tempfile
import mido

SF, SAIDA = sys.argv[1], sys.argv[2]
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


def torre():
    random.seed(7)
    p = Peca(148, 52, MIN)                         # mi menor
    p.instrumento('guitE', 0, 30, 92, 24, 30); p.instrumento('guitD', 1, 30, 92, 104, 30)   # duas guitarras, uma em cada lado
    p.instrumento('baixo', 2, 34, 104, 64, 20); p.instrumento('orgao', 3, 19, 70, 64, 100)
    p.instrumento('coro', 4, 52, 92, 56, 110); p.instrumento('violino', 5, 40, 96, 74, 90)
    p.instrumento('sino', 6, 14, 84, 64, 110); p.instrumento('solo', 7, 29, 84, 64, 60)
    p.instrumento('bat', 9, 16, 110, 64, 40)
    K, S, HH, RIDE, CRASH, CHINA, TOM1, TOM2 = 36, 38, 42, 51, 49, 52, 48, 45

    intro = [0, 5, 3, 4]
    riff = [0, 0, 5, 6, 0, 0, 3, 4]
    verso = [0, 5, 3, 4, 0, 5, 6, 4]
    refrao = [0, 5, 3, 4, 0, 5, 6, 4]
    ponte = [3, 4, 5, 4]
    secs = [('intro', intro), ('riff', riff), ('verso', verso), ('refrao', refrao), ('ponte', ponte), ('refrao', refrao)]
    mel_verso = [[(4, 2), (3, 1), (2, 1)], [(1, 3), (0, 1)], [(2, 2), (4, 2)], [(3, 4)],
                 [(4, 2), (5, 1), (4, 1)], [(3, 2), (2, 2)], [(1, 1), (2, 1), (3, 1), (1, 1)], [(0, 4)]]
    mel_refrao = [[(7, 3), (6, 1)], [(5, 2), (4, 2)], [(5, 3), (6, 1)], [(4, 4)],
                  [(7, 2), (8, 2)], [(9, 2), (7, 2)], [(6, 2), (5, 1), (6, 1)], [(7, 4)]]
    mel_ponte = [[(2, 1), (3, 1), (4, 1), (5, 1)], [(6, 2), (4, 2)], [(5, 1), (4, 1), (3, 1), (2, 1)], [(1, 4)]]

    bar = 0
    for nome, prog in secs:
        for i, gr in enumerate(prog):
            t = bar * 4; ult = i == len(prog) - 1
            if nome == 'intro':
                p.acorde('orgao', t, 4, triade(p, gr, -1) + [p.g(gr, -2)], 84)
                p.acorde('coro', t, 4, triade(p, gr, 0), 70)
                p.nota('sino', t, 3, p.g(0, 0), 96)
                if ult:                                                    # virada de bateria para entrar o riff
                    for k in range(8): p.nota('bat', t + 2 + k * 0.25, 0.2, [S, S, TOM1, TOM1, TOM2, TOM2, S, S][k], 80 + k * 5)
            elif nome in ('riff', 'verso', 'refrao'):
                pw = power(p, gr)
                if nome == 'riff':                                         # galope: colcheia + duas semicolcheias
                    for b in range(4):
                        for off, d, v in ((0, 0.5, 112), (0.5, 0.25, 92), (0.75, 0.25, 96)):
                            for lado in ('guitE', 'guitD'): p.acorde(lado, t + b + off, d * 0.9, pw, v)
                elif nome == 'verso':                                      # abafado em colcheias, guitarras mais baixas
                    for k in range(8):
                        for lado in ('guitE', 'guitD'): p.acorde(lado, t + k * 0.5, 0.4, pw[:2], 78 if k % 2 else 92)
                else:                                                      # refrão: acordes abertos e longos
                    for lado in ('guitE', 'guitD'): p.acorde(lado, t, 3.9, pw, 108)
                for k in range(8): p.nota('baixo', t + k * 0.5, 0.45, p.g(gr, -3) + 12, 100 if k % 2 == 0 else 88)
                # bateria
                p.nota('bat', t, 1, CRASH if (i % 4 == 0 or nome == 'refrao') else RIDE, 104)
                if nome == 'refrao':
                    for k in range(16): p.nota('bat', t + k * 0.25, 0.2, K, 96 if k % 2 == 0 else 84)   # bumbo duplo
                    for k in range(1, 4): p.nota('bat', t + k, 0.5, RIDE, 80)
                else:
                    for k in range(8): p.nota('bat', t + k * 0.5, 0.4, RIDE if nome == 'riff' else HH, 78)
                    for off in (0, 1.5, 2, 2.5) if nome == 'riff' else (0, 0.75, 2, 2.5): p.nota('bat', t + off, 0.4, K, 104)
                for off in (1, 3): p.nota('bat', t + off, 0.5, S, 112)
                if ult: [p.nota('bat', t + 3 + k * 0.25, 0.2, [TOM1, TOM1, TOM2, CHINA][k], 96) for k in range(4)]
                # o que canta por cima
                if nome == 'verso':
                    p.melodia('violino', t, mel_verso[i], 1, 96)
                    p.acorde('orgao', t, 4, triade(p, gr, -1), 52)
                elif nome == 'refrao':
                    p.melodia('coro', t, mel_refrao[i], 1, 100); p.melodia('violino', t, mel_refrao[i], 1, 84)
                    p.acorde('orgao', t, 4, triade(p, gr, -1) + [p.g(gr, -2)], 66)
                    if i % 4 == 0: p.nota('sino', t, 3, p.g(gr, 0), 84)
                else:
                    p.acorde('coro', t, 4, triade(p, gr, 0), 58)
            else:                                                          # ponte: meio tempo, órgão e solo de guitarra
                p.acorde('orgao', t, 4, triade(p, gr, -1) + [p.g(gr, -2)], 80)
                for lado in ('guitE', 'guitD'): p.acorde(lado, t, 1.9, power(p, gr), 100)
                p.nota('baixo', t, 3.8, p.g(gr, -3) + 12, 100)
                p.nota('bat', t, 1, CRASH, 100); p.nota('bat', t, 0.5, K, 104); p.nota('bat', t + 2, 0.5, S, 112)
                for k in range(4): p.nota('bat', t + k, 0.5, RIDE, 72)
                p.melodia('solo', t, mel_ponte[i], 1, 100)
                if ult: [p.nota('bat', t + 2 + k * 0.25, 0.2, [S, S, TOM1, TOM1, TOM2, TOM2, S, CHINA][k], 84 + k * 4) for k in range(8)]
            bar += 1
    return p, bar * 4


p, beats = torre()
tmp = tempfile.mkdtemp()
mid, wav = os.path.join(tmp, 'torre.mid'), os.path.join(tmp, 'torre.wav')
dur = p.salvar(mid, beats, 2)
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.6', '-r', '44100', '-R', '1', '-C', '1',
                '-o', 'synth.reverb.room-size=0.85', '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.55',
                '-F', wav, SF, mid], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{dur:.4f}', '-t', f'{dur:.4f}', '-i', wav,
                '-af', 'loudnorm=I=-17:TP=-2', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', SAIDA], check=True)
print(f'torre: {dur:.2f}s')
