(function() {
    'use strict';
    
    window.BannerLib = window.BannerLib || {};
    
    const defaultConfig = {
        apiBaseUrl: 'https://campaign.loopert.com', 
        token: '',
        animationDuration: 300,
        styles: {
            overlay: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: '999999',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Arial, sans-serif'
            },
            container: {
                position: 'relative',
                borderRadius: '12px',
                padding: '20px',
                maxWidth: '500px',
                maxHeight: '90vh',
                animation: 'bannerFadeIn 0.3s ease-out'
            },
         
            image: {
                width: '100%',
                height: 'auto',
                maxHeight: '500px',
                objectFit: 'contain',
                borderRadius: '8px',
                marginBottom: '15px'
            },
            buttonContainer: {
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            },
            button: {
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'inline-block',
                textAlign: 'center',
                minWidth: '100px',
                transition: 'all 0.2s ease'
            },
            redirectButton: {
                backgroundColor: '#2E5EAA',
                color: '#fff'
            },
            closeButton: {
                backgroundColor: '#6c757d',
                color: '#fff'
            },
            closeX: {
                position: 'absolute',
                top: '22px',
                right: '30px',
                background: 'none',
                border: 'none',
                fontSize: '35px',
                cursor: 'pointer',
                color: '#999',
                lineHeight: '1',
                padding: '0',
            }
        }
    };
    
    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }
    
    function injectCSS() {
        if (document.getElementById('banner-lib-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'banner-lib-styles';
        style.textContent = `
            @keyframes bannerFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes bannerFadeOut {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }
            
            .banner-lib-container-fade-out {
                animation: bannerFadeOut 0.3s ease-in forwards !important;
            }
            
            .banner-lib-button:hover {
                transform: translateY(-2px);
            }
            
            .banner-lib-close-x:hover {
                color: #ddd !important;
            }
            
            @media (max-width: 768px) {
                .banner-lib-container {
                    margin: 20px !important;
                    max-width: calc(100% - 40px) !important;
                }
                
                .banner-lib-button-container {
                    flex-direction: column !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function showBanner(streamId, config = {}) {
        const finalConfig = { ...defaultConfig, ...config };
        
        injectCSS();
        
        fetch(`${finalConfig.apiBaseUrl}/distribute/banner/${streamId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalConfig.token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.bannerUrl) {
                throw new Error('Banner image URL not found');
            }
            
            createBannerModal(data, finalConfig);
        })
        .catch(error => {
            console.error('Erro ao carregar banner:', error);
            if (config.onError) {
                config.onError(error);
            }
        });
    }

    function createBannerModal(bannerData, config) {
        
        removeBanner();
        
        const overlay = document.createElement('div');
        overlay.id = 'banner-lib-overlay';
        applyStyles(overlay, config.styles.overlay);
        
        const container = document.createElement('div');
        container.className = 'banner-lib-container';
        container.onclick = function(e) {
            e.stopPropagation();

            const imageContainer = container.querySelector('.banner-lib-image');
            const redirectBtn = container.querySelector('.banner-lib-button');

            if (e.target === imageContainer && redirectBtn) {
                redirectBtn.click();
            }
        }
        applyStyles(container, config.styles.container);
        
        const closeX = document.createElement('button');
        closeX.innerHTML = '&times;';
        closeX.className = 'banner-lib-close-x';
        closeX.onclick = closeBanner;
        applyStyles(closeX, config.styles.closeX);
        container.appendChild(closeX);
        
        const img = document.createElement('img');
        img.src = bannerData.bannerUrl;
        img.alt = 'Banner Image';
        img.className = 'banner-lib-image';
        applyStyles(img, config.styles.image);
        
        img.onerror = function() {
            console.error('Erro ao carregar a imagem do banner');
            closeBanner();
        };
        
        container.appendChild(img);
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'banner-lib-button-container';
        applyStyles(buttonContainer, config.styles.buttonContainer);
        
        if (bannerData.href) {
            const redirectBtn = document.createElement('a');
            redirectBtn.href = bannerData.href;
            redirectBtn.target = '_blank';
            redirectBtn.rel = 'noopener noreferrer';
            redirectBtn.textContent = bannerData.actionButtonText || 'Acessar';
            redirectBtn.className = 'banner-lib-button';
            applyStyles(redirectBtn, { ...config.styles.button, ...config.styles.redirectButton });
            buttonContainer.appendChild(redirectBtn);
        }
        
        container.appendChild(buttonContainer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closeBanner();
            }
        };
        
        document.addEventListener('keydown', handleEscKey);
        
        if (config.onShow) {
            config.onShow(bannerData);
        }
    }
    
    function closeBanner(config = defaultConfig) {
        const overlay = document.getElementById('banner-lib-overlay');
        const container = overlay?.querySelector('.banner-lib-container');
        
        if (container && !container.classList.contains('banner-lib-container-fade-out')) {
            container.classList.add('banner-lib-container-fade-out');
            
            setTimeout(() => {
                removeBanner();
                document.removeEventListener('keydown', handleEscKey);
            }, config.animationDuration || 300);
        }
    }
    
    function removeBanner() {
        const overlay = document.getElementById('banner-lib-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            closeBanner();
        }
    }
    
    window.BannerLib = {
        show: showBanner,
        close: closeBanner,
        version: '1.0.0'
    };
    
    function autoInit() {
        const scripts = document.querySelectorAll('script[src*="banner-lib"]');
        scripts.forEach(script => {
            const streamId = script.getAttribute('data-stream-id');
            
            if (streamId) {
                const delay = parseInt(script.getAttribute('data-delay')) || 0;
                const config = {
                    apiBaseUrl: script.getAttribute('data-api-url') || defaultConfig.apiBaseUrl,
                    token: script.getAttribute('data-token') || defaultConfig.token,
                };
                
                setTimeout(() => {
                    showBanner(streamId, config);
                }, delay);
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

})();