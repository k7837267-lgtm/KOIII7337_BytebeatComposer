((o = NaN), //off
	(note = (n) => 2 ** (n / 12)),
	(s =
		((t *
			note(
				[0, o, 0, o, 3, 7, 12, 7, 3, 3, 7, 8, 7, 11, 12, 7][(t >> 13) & 15],
			)) %
			256) /
			4 || 0),
	(drumptn = ["KKSKKKSKKKSKKSSS", "KKSKKKSKKKSKKKSK"]),
	(K = (3e5 / (t & 4095)) & 64),
	(S = (sin(t >> 2) * t) & (64 * (1 - ((t / 4096) % 1)))),
	(drumset = drumptn['00000001'[t>>15&7]][(t >> 12) & 15]),
	(drum = drumset == "K" ? K : drumset == "S" ? S : drumset),
	(b = ((t / 4) * note([0, 0, 3, 7, 8, 8, 11, 12][(t >> 14) & 7])) & 64),
	(l =
		(t *
			note(
				[0, 0, 3, 7, 7, 8, 7, 0, 2, 0, 0, 3, 7, 8, 11, 12][(t >> 12) & 15],
			)) &
		63),
	(bub =
		((((t / 256) * ((t >> 10) & ((-t / 0.0625) >> 10) & 255)) % 16) * 16) / 4),
	(fu = s + b + drum + l + bub),
	[
		s,
		s + b,
		s + b + drum,
		s + b + drum,
		fu,
		fu,
		fu,
		fu,
		l + b,
		l + b + drum * "00000011"[t>>15&7],
		l + b + drum,
		l + b + drum,
		s + b + drum,
		s + b + drum + l,
		s + b + drum + l,
		s + b + drum + l,
		bub,
		bub + b,
		fu,
		s
	][t >> 17] / 192 - 1)