(function () {
	'use strict';

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
		return Array.from(document.querySelectorAll('script[src*="loopert-player"]'));
	}
	
	async function loadDependencies() {
		const scripts = findLoopertScripts();

		if (scripts.length === 0) return;
		const loadPromises = [];

		if (!window.BannerLib) {
			const firstScript = scripts[0];
			const dataAttributes = extractDataAttributes(firstScript);

			loadPromises.push(
				loadScript(
					'https://cdn.jsdelivr.net/gh/Loopert-TI/banner-lib-js@latest/banner-lib.min.js',
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
		window.BannerLib.init();
	}

	function setupEventListeners() {
		const scripts = findLoopertScripts();

		if (scripts.length === 0) return;

		const firstScript = scripts[0];
		const playerId = firstScript.dataset.playerId;
		if (!playerId) return;

		const audioElement = document.getElementById(playerId);
		if (!audioElement) return;

		audioElement.addEventListener('play', showBanner);
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
