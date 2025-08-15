function loadScript(src, attributes = {}) {
	return new Promise((resolve, reject) => {
		const existingScript = document.querySelector(`script[src="${src}"]`);
		if (existingScript) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = src;

		Object.keys(attributes).forEach((attr) => {
			script.setAttribute(attr, attributes[attr]);
		});

		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));

		document.head.appendChild(script);
	});
}

function extractDataAttributes(element) {
	const dataAttributes = {};

	Object.entries(element.dataset).forEach(([key, value]) => {
		const kebabKey = `data-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
		dataAttributes[kebabKey] = value;
	});

	return dataAttributes;
}

function findLoopertScripts() {
	return Array.from(document.querySelectorAll('script[src*="loopert-player-lib.min"]'));
}

class LoopertPlayer {
	constructor(options = {}) {
		this.options = {
			id: 'player',
			streamUrl: '',
			backgroundImage: '',
			backgroundColor: '#2E5EAA',
			borderColor: '#2E5EAA',
			...options,
		};

		this.player = null;

		this.init();
	}

	createPlayerDiv() {
		let playerDiv = document.getElementById(this.options.id);

		if (!playerDiv) {
			playerDiv = document.createElement('div');
			playerDiv.id = this.options.id;

			document.body.appendChild(playerDiv);
		}
	}

	async init() {
		try {
			this.createPlayerDiv();

			await this.loadDependencies();
			this.initPlayer();
		} catch (error) {
			console.error('Erro ao inicializar LoopertPlayer:', error);
		}
	}

	async loadDependencies() {
		const promises = [];

		if (!window.Playerjs) {
			promises.push(
				loadScript(
					'https://cdn.jsdelivr.net/gh/Loopert-TI/banner-lib-js@latest/player.min.js'
				)
			);
		}

		if (!window.LoopertBannerLib) {
			const scripts = findLoopertScripts();

			if (scripts.length === 0) return;

			const firstScript = scripts[0];
			const dataAttributes = extractDataAttributes(firstScript);

			promises.push(
				loadScript(
					'https://cdn.jsdelivr.net/gh/Loopert-TI/banner-lib-js@latest/loopert-banner-lib.min.js',
					dataAttributes
				)
			);
		}

		await Promise.all(promises);
	}

	initPlayer() {
		if (!window.Playerjs) {
			throw new Error('Playerjs não está disponível');
		}

		window.PlayerjsEvents = (event, id, data) => {
			this.handlePlayerEvents(event, id, data);
		};

		this.player = new window.Playerjs({
			id: this.options.id,
			file: this.options.streamUrl,
			poster: this.options.backgroundImage,
			...this.getPlayerJsOptions(),
		});

		const container = document.getElementById('player');
		const playerElement = document.getElementById('oframeplayer');
		playerElement.style.backgroundColor = this.options.backgroundColor;
		container.style.borderColor = this.options.borderColor;
	}

	getPlayerJsOptions() {
		const playerJsOptions = { ...this.options };

		delete playerJsOptions.streamUrl;

		return playerJsOptions;
	}

	handlePlayerEvents(event, id, data) {
		switch (event) {
			case 'play':
				this.onPlay(id, data);
				break;
			case 'pause':
				this.onPause(id, data);
				break;
			case 'ended':
				this.onEnded(id, data);
				break;
			default:
				this.onGenericEvent(event, id, data);
		}

		if (this.options.onEvent && typeof this.options.onEvent === 'function') {
			this.options.onEvent(event, id, data);
		}
	}

	onPlay(id, data) {
		this.initBanner();
	}

	onPause(id, data) {}

	onEnded(id, data) {}

	onGenericEvent(event, id, data) {}

	initBanner() {
		if (window.LoopertBannerLib) {
			try {
				window.LoopertBannerLib.init();
			} catch (error) {
				console.error('Erro ao inicializar banner:', error);
			}
		}
	}

	play() {
		if (this.player && this.player.api) {
			this.player.api('play');
		}
	}

	pause() {
		if (this.player && this.player.api) {
			this.player.api('pause');
		}
	}

	stop() {
		if (this.player && this.player.api) {
			this.player.api('stop');
		}
	}

	setVolume(volume) {
		if (this.player && this.player.api) {
			this.player.api('volume', volume);
		}
	}

	setFile(file) {
		if (this.player && this.player.api) {
			this.player.api('file', file);
		}
	}

	destroy() {
		if (this.player && this.player.api) {
			this.player.api('destroy');
		}
		this.player = null;
	}

	getPlayer() {
		return this.player;
	}
}

(function () {
	'use strict';

	async function loadDependencies() {
		const scripts = findLoopertScripts();

		if (scripts.length === 0) return;
		const loadPromises = [];

		if (!window.LoopertBannerLib) {
			const firstScript = scripts[0];
			const dataAttributes = extractDataAttributes(firstScript);

			loadPromises.push(
				loadScript(
					'https://cdn.jsdelivr.net/gh/Loopert-TI/banner-lib-js@latest/loopert-banner-lib.min.js',
					dataAttributes
				)
			);
		}

		try {
			await Promise.all(loadPromises);
		} catch (error) {
			console.error('Erro ao carregar dependências:', error);
			throw error;
		}
	}

	function showBanner() {
		window.LoopertBannerLib.init();
	}

	function findElementInFrames(elementId, root = window) {
		const el = root.document.getElementById(elementId);
		if (el) return el;
	
		for (let i = 0; i < root.frames.length; i++) {
			try {
				const frameEl = findElementInFrames(elementId, root.frames[i]);
				if (frameEl) return frameEl;
			} catch (e) {
				console.warn('Não foi possível acessar frame:', e);
			}
		}
	
		return null;
	}

	function setupEventListeners() {
		const scripts = findLoopertScripts();
		if (scripts.length === 0) return;
	
		const firstScript = scripts[0];
		const playerId = firstScript.dataset.playerId;
		if (!playerId) return;
	
		let attempts = 0;
		const maxAttempts = 50;
	
		function tryFindPlayer() {
			attempts++;
			const audioElement = findElementInFrames(playerId);
	
			if (audioElement) {
				console.log(`🎯 Elemento encontrado: #${playerId} na tentativa ${attempts}`);
	
				if (!audioElement.dataset.listenerAdded) {
					audioElement.addEventListener('play', showBanner);
					audioElement.dataset.listenerAdded = 'true';
				}
	
				return true;
			}
	
			return false;
		}
	
		if (tryFindPlayer()) return;
	
		const intervalId = setInterval(() => {
			if (tryFindPlayer() || attempts >= maxAttempts) {
				if (attempts >= maxAttempts) {
					console.warn(`⚠️ Elemento #${playerId} não encontrado após ${maxAttempts} tentativas`);
				}
				clearInterval(intervalId);
			}
		}, 1000);
	}
	

	async function autoInit() {
		try {
			await loadDependencies();

			setupEventListeners();

			document.dispatchEvent(
				new CustomEvent('loopertPlayerReady', {
					detail: { timestamp: Date.now() },
				})
			);
		} catch (error) {
			document.dispatchEvent(
				new CustomEvent('loopertPlayerError', {
					detail: { error: error.message, timestamp: Date.now() },
				})
			);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', autoInit);
	} else {
		autoInit();
	}
})();
