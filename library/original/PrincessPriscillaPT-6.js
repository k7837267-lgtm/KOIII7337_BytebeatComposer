ji = justIntonation = (note, transpose = 0) => (
	_ratios = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 16 / 9, 15 / 8],
	_note = ((floor(note) % 12) + 12) % 12,
	_transpose = ((floor(transpose) % 12) + 12) % 12,
	_octave = floor(note / 12) + floor(transpose / 12),
	_ratios[_note] * 2 ** _octave * _ratios[_transpose]
),
bpm = 110, sr = 48e3,
ts = t / sr * (bpm / 60) * 16384,
spb = 60 / bpm * sr,
m = (t % (spb / 8)) / sr * 261.63 * ji([0, 3, 7, 12, 19, 12, 7, 3, -12, 7, 12, 15, 0, 7, 12, 14, -4, 3, 12, 15, 20, 24, 27, 19, -12, 7, 12, 15, 0, 7, 12, 14][((ts >> 11) % 24 + (ts >> 13 & 7)) & 31]),
sin(sin(m * PI * 2) + sin(m * PI * 3) / (ts % 2048 / 2e3 + 1)) * exp(-ts % 2048 / 1e3) * min(1, abs(sin(ts * PI / 2048)) * 16)