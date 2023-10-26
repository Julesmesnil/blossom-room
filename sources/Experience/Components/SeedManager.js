import Alea from 'alea';
import Experience from '../Experience.js'

export default class SeedManager {
	constructor() {
		this.seedLength = 10;
		this.url = new URL(window.location.href);
		
		this.experience = new Experience()
		this.debug = this.experience.debug
		
		const seedFromUrl = this.getUrlSeed();

		this.setInstance();

		if (seedFromUrl === null) {
			this.seed = this.getRandomSeed();
			this.setUrlSeed(this.seed);
		} else {
			this.seed = seedFromUrl;
		}
		this.prng = new Alea(this.seed);
		console.log('Current seed:', this.seed);
	}

	setInstance()
	{
		if(this.debug)
		{
			this.PARAMS = {
				seed: this.seed,
				copy: 'copy'
			}

			this.debugFolder = this.debug.addFolder({
				title: 'seed',
				expanded: true,
			})

			this.debugFolder
				.addBlade({
					view: 'buttongrid',
					size: [2, 1],
					cells: (x, y) => ({
						title: [['Randomize', 'Copy']][y][x],
					}),
				})
				.on('click', (event) => {
					if (event.index[0] === 0) {
						this.seed = this.getRandomSeed();
						this.setUrlSeed(this.seed);
						window.location.reload();
						return
					}
					window.navigator.clipboard.writeText(this.seed);
				})

		}
	}

	setUrlSeed(seed) {
		this.url.searchParams.set('seed', seed.toString());
		window.history.replaceState({}, '', this.url);
  	}

  	getUrlSeed() {
		const seedParam = this.url.searchParams.get('seed');
		return seedParam !== null ? parseFloat(seedParam) : null;
  	}

  	getRandomSeed(length = this.seedLength) {
    	return parseFloat(Math.random().toFixed(length));
  	}
}
