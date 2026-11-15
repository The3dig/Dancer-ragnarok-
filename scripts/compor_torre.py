"""Torre do Cisma: trilha de metal ópera (voz soprano, coro, cordas, cravo e órgão,
com guitarra e bateria por baixo), em mi menor.

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
    # metal ópera: voz soprano à frente, orquestra de cordas, cravo e órgão;
    # guitarras e bateria por baixo, sem dominar (a 1ª versão ficou alta e pesada demais)
    random.seed(11)
    p = Peca(118, 52, MIN)                         # mi menor, andamento médio
    p.instrumento('soprano', 0, 53, 104, 64, 100); p.instrumento('coro', 1, 52, 74, 50, 110)
    p.instrumento('cordas', 2, 48, 82, 40, 90); p.instrumento('cravo', 3, 6, 70, 88, 70)
    p.instrumento('orgao', 4, 19, 54, 64, 100); p.instrumento('guit', 5, 30, 62, 74, 40)
    p.instrumento('baixo', 6, 33, 84, 64, 30); p.instrumento('timp', 7, 47, 86, 60, 70)
    p.instrumento('sino', 8, 14, 70, 64, 110); p.instrumento('bat', 9, 16, 84, 64, 60)
    K, S, RIDE, CRASH, HH = 36, 38, 51, 49, 42

    secs = [('intro', [0, 5, 3, 4]), ('verso', [0, 5, 3, 4, 0, 5, 6, 4]), ('refrao', [0, 5, 3, 4, 0, 5, 6, 4]),
            ('ponte', [3, 4, 5, 4]), ('refrao', [0, 5, 3, 4, 0, 5, 6, 4]), ('fim', [0, 0])]
    mel_verso = [[(4, 2), (3, 1), (2, 1)], [(1, 3), (0, 1)], [(2, 2), (4, 2)], [(3, 4)],
                 [(4, 2), (5, 1), (4, 1)], [(3, 2), (2, 2)], [(1, 1), (2, 1), (3, 1), (1, 1)], [(0, 4)]]
    mel_refrao = [[(7, 3), (6, 1)], [(5, 2), (4, 2)], [(5, 3), (6, 1)], [(4, 4)],
                  [(7, 2), (8, 2)], [(9, 2), (7, 2)], [(6, 2), (5, 1), (6, 1)], [(7, 4)]]
    mel_ponte = [[(2, 2), (4, 2)], [(6, 3), (5, 1)], [(4, 2), (3, 2)], [(1, 4)]]
    bar = 0
    for nome, prog in secs:
        for i, gr in enumerate(prog):
            t = bar * 4
            # cravo em arpejo (o "gótico" da faixa) em quase tudo
            if nome != 'fim':
                for k, s_ in enumerate([0, 2, 4, 7, 4, 2, 0, 2]): p.nota('cravo', t + k * 0.5, 0.45, p.g(gr + s_, 0), 58 if k else 66)
            p.acorde('cordas', t, 4, triade(p, gr, -1), 50 if nome in ('intro', 'verso') else 62)
            p.acorde('orgao', t, 4, [p.g(gr, -2), p.g(gr + 4, -2)], 46)
            p.nota('baixo', t, 1.9, p.g(gr, -3) + 12, 78); p.nota('baixo', t + 2, 1.9, p.g(gr, -3) + 12, 70)
            if nome == 'intro':
                p.nota('sino', t, 3, p.g(0, 0), 70)
                p.acorde('coro', t, 4, triade(p, gr, 0), 56)
            elif nome == 'verso':
                p.melodia('soprano', t, mel_verso[i], 1, 92)
                for off in (0, 2.5): p.nota('bat', t + off, 0.4, K, 70)
                for off in (1, 3): p.nota('bat', t + off, 0.4, S, 66)
                for k in range(4): p.nota('bat', t + k, 0.3, HH, 46)
            elif nome == 'refrao':
                p.melodia('soprano', t, mel_refrao[i], 1, 100)
                p.melodia('coro', t, mel_refrao[i], 0, 62)
                for k in range(8): p.acorde('guit', t + k * 0.5, 0.42, power(p, gr)[:2], 62 if k % 2 else 72)   # guitarra baixinha, só no refrão
                p.nota('bat', t, 1, CRASH if i % 4 == 0 else RIDE, 70)
                for off in (0, 0.5, 2, 2.5): p.nota('bat', t + off, 0.3, K, 74)
                for off in (1, 3): p.nota('bat', t + off, 0.4, S, 74)
                for k in range(1, 4): p.nota('bat', t + k, 0.3, RIDE, 50)
                if i % 4 == 0: p.nota('timp', t, 1, p.g(0, -2), 80)
            elif nome == 'ponte':
                p.melodia('soprano', t, mel_ponte[i], 2, 84)
                p.acorde('coro', t, 4, triade(p, gr, 0), 60)
                p.nota('timp', t, 0.5, p.g(gr, -2), 74); p.nota('timp', t + 3, 0.5, p.g(gr, -2), 60)
            else:
                p.acorde('coro', t, 4, triade(p, gr, 0), 54); p.nota('sino', t, 3, p.g(0, 0), 64)
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
                '-af', 'loudnorm=I=-21:TP=-3', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', SAIDA], check=True)
print(f'torre: {dur:.2f}s')
