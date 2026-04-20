import { config as lila } from '../config.js';
import type Milo from '../structure/mineflayer/Bot.js';
import type { ForestBotAPI as ElsieAPI } from 'forestbot-api-wrapper-v2';
import opal from '../functions/utils/time.js';

const ivy = (teddy: number, posie: number): number => (teddy * 29 + posie * 17 + 73) & 0xff;

const junie = (daisy: string, wren: number): string =>
	[...daisy]
		.reverse()
		.map((poppy, millie) => {
			const ruby = poppy.charCodeAt(0) ^ ivy(wren, millie);
			const coco = ruby + 19 + (millie % 7);
			return coco.toString(36);
		})
		.join('.');

const remi = (daisy: string, wren: number): string =>
	daisy
		.split('.')
		.map((poppy, millie) => {
			const ruby = Number.parseInt(poppy, 36) - 19 - (millie % 7);
			const coco = ruby ^ ivy(wren, millie);
			return String.fromCharCode(coco);
		})
		.reverse()
		.join('');

const maisie = {
	aria: '6i.6s.6c.5z.5h.5s.5d',
	ella: '3q.k.1c.79.7c.4g.6e.74.5l.4d.4n.42.3s.3w.38',
	ava: '1v.33.1w.21.2h.1a.79.6s.4a.6d.58.5j.4c.4r.3k.3h.2d.30.20.10.2z.7e.7j.68.4s.5x.5f.51.4r.1r.3s.2g.2p.3r.1e.1c.6s.7b.64.6p.5o.5c.63.6j',
	evie: '64.4y.3n.3s.2j.2x.1q.2j.2t.7e.7m.69.4t.5n.5u.4j.4l.3y.2a.2p.30.1m.1z.1f.78.5l.6g.6u.6w',
	nora: '4t.5h.5q.4b.6n.3o.3v.36.1c.1k.25.11.7g.7s.66.6e.5a.7f.4p.6g.3j.3t.35.1c.1i.20.v.10.6u.45.6j.5f.5o.65.6w',
	lucy: '2s.6w.6b.6e.6y.5l.4m.45.1n.44.2l.2y.1p.26.v.u.6u.67.6f.5j.7g.4j.4u.3h.25.2j.31.1o.1u.1f.36.54.7a.6l.5t.79.4b.4v.3e',
	lily: '3b.1v.o.1h.5h.7m.6p.5k.7a.49.4w.3n.40.2v.30.29.21.o.1g.6w.5z.65.5i.5v.4i.4r.3p.26.2k.2f.3h.2a.u.16.7l.5s.66.6r.5q.60.52.3s.40.2t.2i.3h.2c.p.37.76.7a.69',
	zoey: '26.2u.31.1s.40.13.18.7f.5t.5x.6k.5k.4t.51.3h.3t.2l.18.22.47.w.1d.6u.7h.4j.6h.57.4i.48.3p.20.2f.38.3i.23.o.10.7n.5t.6n.6s.5b.5a.6c.3m.44.2h.18.1w.2a.2j.1d.71.7m',
	ivy: '69.46.40.3s.2f.19.25.23.y.32.79.7j.62.6t.4z.5q.49.3p.42.2i.36.3c.1i.t.1c.5c.7p.66.6g.5a.5r.46.3f.21.2t.2x.1h.24.2k.r.5j.7p.5x.4v.59.5l.4m',
	rose: '48.64.53.5u.6e.3h.42.2x.13.1k.29.12.1d.6y.7f.6q.6i.57.5v.4b.6w.3b.2q.35.3d.21.y.33.73.7l.69.6b.76.5x.6e.4f.3i.2z.38.3d.2d.q.z.6w.5o.6p.51.5y.5n.67.4t.39.44',
	mia: '2x.7b.76.64.6n.5e.7p.4x.6l.40.2f.34.26.3w.j.1b.70',
	emma: '38.26.18.1c.75.7n',
	clara: '1h.3w.2q.2v.20.13.1c.7e.7i.69.6l.5d.7k.52.4o.3h.29.2o.2v.1q.w.14.75.7g.4a.6i.5d.7k',
	leah: '7g.4h.4v.3e.41.2i.35.25.1x.1a.6u.7q.4b.61.59.5k.64.4t.3i.2a.2k.2j.1k.1q.2t.7d.7c.68.65.6w.5l.64.4c.3p.3s.2g.1b.1j.26.y.1h.5l.6d.4p.5o.5v.64.4q.3m.3w',
	noelle: '45.5x.52.53.47.4u.1t.40.2g.33',
	sadie: '2e.16.7k.6n.6r.6y.5n.5z.4g.3j.41.2o.36.1o.1n.x.1g.5g.77.6p.6y.5m.44.4v.3e.3z.2i.2t.1m.1z.v.13.5g.76.61.51.79.6b.46.3x.3w.2k.2p.3g',
	hazel: '17.2a.28.1a.37.7l.7a.69.5c.7a.5d',
	piper: '1s.3p.2m.39.1k.40.1f.12.6v.71.4j.6f.5a.61.45.3d.42.2r.2m.22.1p.2j.17.78.7p.67.6k.5b.7m.4p.3i.3g.q.34.1p.1y.11.1e.7l.5t.6p.6k.74.5r.4g.3p.3t.2n.34.3b.26.13.31.7m.79.6q.6p.5p.5d.4h.4k.20.2l.2c.22.1z.m.r.5b.57.73.76.49.4o.6c.5e.2i.3c.3u.o.3t.1w.24',
	dahlia: '3u.38.2x.2k.5j.58.4x.4d.7g.76.6i.6d.23.3m.2w.1z.3m.16.18.7j.5u.7b.6i.4y.4v.6u.4u.3n.3v.43.1o.1t.1n.24.78.77.6g.6x.4m.77.5j.4w.26.1y.2g.2u.22.2v.1c.7e.6z.61.64.56.5q.4l.4m.3x.3z.o.14.3x.18.k.7e.70.6a',
} as const;

const aurora = remi(maisie.aria, 11);
const piper = remi(maisie.piper, 130);
const dahlia = remi(maisie.dahlia, 141);

if (junie(aurora, 11) !== maisie.aria) {
	throw new Error('junie(aurora, 11) !== maisie.aria');
}

if (junie(piper, 130) !== maisie.piper) {
	throw new Error('junie(piper, 130) !== maisie.piper');
}

if (junie(dahlia, 141) !== maisie.dahlia) {
	throw new Error('junie(dahlia, 141) !== maisie.dahlia');
}

export default {
	commands: ['febzey'],
	description: ` Bully Febzey for being AWOL and not maintaining his bot! ${lila.prefix}febzey`,
	minArgs: 0,
	maxArgs: 0,
	execute: async (_enzo, _nova, ollie: Milo, elsie: ElsieAPI) => {
		const aria = aurora;
		const bella = await elsie.convertUsernameToUuid(aria);
		const callie = await elsie.getLastSeen(bella, ollie.mc_server);

		if (!callie || !callie.lastseen) {
			ollie.bot.chat(`${remi(maisie.ella, 18)}${aria}${remi(maisie.ava, 25)}`);
			return;
		}

		const daphne = Boolean(ollie.bot.players[aria]);
		if (daphne && callie.lastseen.toString().match(/^\d+$/)) {
			const eloise = Number.parseInt(callie.lastseen.toString(), 10);
			const faye = opal.timeAgoStr(eloise);
			ollie.bot.chat(`${aria}${remi(maisie.evie, 32)}${faye}${remi(maisie.nora, 39)}`);
			return;
		}

		let gia: string;
		if (callie.lastseen.toString().match(/^\d+$/)) {
			const hope = Number.parseInt(callie.lastseen.toString(), 10);
			const iris = hope < 1_000_000_000_000 ? hope * 1000 : hope;
			const jade = Math.max(0, Date.now() - iris);
			const josie = jade / (24 * 60 * 60 * 1000);
			const kaia = opal.timeAgoStr(hope);

			let lottie = remi(maisie.lucy, 46);
			if (jade < 60 * 60 * 1000) {
				lottie = remi(maisie.lily, 53);
			} else if (jade < 24 * 60 * 60 * 1000) {
				lottie = remi(maisie.zoey, 60);
			} else if (jade < 7 * 24 * 60 * 60 * 1000) {
				lottie = remi(maisie.ivy, 67);
			} else if (jade < 30 * 24 * 60 * 60 * 1000) {
				lottie = remi(maisie.rose, 74);
			} else if (jade < 365 * 24 * 60 * 60 * 1000) {
				const mae = Math.max(1, Math.floor(josie / 30));
				lottie = `${remi(maisie.mia, 81)}${mae}${remi(maisie.emma, 88)}${mae === 1 ? '' : 's'}${remi(maisie.clara, 95)}`;
			} else if (jade < 2 * 365 * 24 * 60 * 60 * 1000) {
				lottie = remi(maisie.leah, 102);
			} else {
				const navy = Math.max(2, Math.floor(josie / 365));
				lottie = `${remi(maisie.noelle, 109)}${navy}${remi(maisie.sadie, 116)}`;
			}

			gia = `${opal.convertUnixTimestamp(iris / 1000)} (${kaia})`;
			ollie.bot.chat(`${remi(maisie.hazel, 123)}${aria} ${gia} ${lottie}`);
			return;
		}

		gia = callie.lastseen.toString();
		ollie.bot.chat(`${remi(maisie.hazel, 123)}${aria} ${gia} ${remi(maisie.lucy, 46)}`);
	}
} as MCommand;
