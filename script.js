document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const openingScreen = document.getElementById('opening-screen');
    const mainContent = document.getElementById('main-content');
    const musicContainer = document.getElementById('background-music');
    let musicStarted = false;

    function startBackgroundMusic() {
        if (musicStarted || !musicContainer) return;
        musicStarted = true;

        const player = document.createElement('iframe');
        player.title = 'Background music';
        player.width = '200';
        player.height = '200';
        player.src = 'https://www.youtube.com/embed/hEFAeAPLbfk?autoplay=1&controls=0&loop=1&playlist=hEFAeAPLbfk&playsinline=1';
        player.allow = 'autoplay; encrypted-media';
        player.referrerPolicy = 'strict-origin-when-cross-origin';
        musicContainer.appendChild(player);
    }

    startButton.addEventListener('click', (e) => {
        startBackgroundMusic();

        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.background = 'var(--color-gold)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.boxShadow = '0 0 50px 20px var(--color-gold)';
        ripple.style.transition = 'all 1.5s cubic-bezier(0.1, 0.8, 0.2, 1)';
        ripple.style.zIndex = '9999';
        document.body.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(200)';
            ripple.style.opacity = '0';
        });

        openingScreen.classList.add('fade-out');
        
        setTimeout(() => {
            openingScreen.style.display = 'none';
            mainContent.classList.remove('hidden');
            mainContent.style.opacity = '0';
  
            void mainContent.offsetWidth;
            
            mainContent.style.transition = 'opacity 2s ease-in-out';
            mainContent.style.opacity = '1';
            
            initFireflies();
        }, 1500);
        
        setTimeout(() => {
            ripple.remove();
        }, 2000);
    });



    const dino = document.getElementById('dino-interactive');
    if (dino) {
        dino.addEventListener('click', () => {
            dino.classList.add('active');
            // Animate jump
            dino.style.transform = 'scale(1.2) translateY(-20px)';
            setTimeout(() => {
                dino.style.transform = '';
            }, 300);
            
            setTimeout(() => {
                dino.classList.remove('active');
            }, 2000);
        });
    }

    const duck = document.getElementById('duck-interactive');
    if (duck) {
        duck.addEventListener('click', () => {
            duck.style.transform = 'scale(1.2) rotate(10deg)';
            setTimeout(() => {
                duck.style.transform = 'scale(1.1) rotate(-10deg)';
                setTimeout(() => {
                    duck.style.transform = '';
                }, 200);
            }, 200);
        });
    }


    const revealElements = document.querySelectorAll('.scene-content, .dino-container, .duck-container, .date-container');
        revealElements.forEach(el => el.classList.add('reveal'));

    const revealOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -100px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Option: observer.unobserve(entry.target) if we only want it to reveal once
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealObserver.observe(el));


    // --- 5. Parallax Effect for Backgrounds ---
    const layerBg = document.querySelector('.layer-bg');
    
    window.addEventListener('scroll', () => {
        if (!layerBg) return;
        // Use requestAnimationFrame for smooth parallax
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            // Move background slightly slower than scroll speed
            layerBg.style.transform = `translateY(${scrollY * 0.4}px)`;
        });
    });


    // --- 6. Particle Generation (Fireflies) ---
    function initFireflies() {
        const container = document.getElementById('fireflies-container');
        if (!container) return;
        
        // Determine amount based on screen size (performance)
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 25 : 60;
        
        for (let i = 0; i < particleCount; i++) {
            createFirefly(container);
        }
    }

    function createFirefly(container) {
        const firefly = document.createElement('div');
        firefly.classList.add('firefly');
        
        // Random positioning
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random animation delays and durations for natural feel
        const delay = Math.random() * 5;
        const durationFloat = 5 + Math.random() * 5;
        const durationBlink = 2 + Math.random() * 4;
        const scale = 0.5 + Math.random() * 1;
        
        firefly.style.left = `${x}vw`;
        firefly.style.top = `${y}vh`;
        firefly.style.transform = `scale(${scale})`;
        firefly.style.animation = `
            floatParticle ${durationFloat}s ease-in-out ${delay}s infinite alternate,
            blinkParticle ${durationBlink}s ease-in-out ${delay}s infinite alternate
        `;
        
        container.appendChild(firefly);
    }
    
    // --- 7. Grass Generation ---
    function initGrass() {
        const grassContainer = document.querySelector('.grass-container');
        if (!grassContainer) return;
        
        // Generate 30 grass blades
        for(let i=0; i<30; i++) {
            const grass = document.createElement('div');
            grass.classList.add('grass-blade');
            
            // Random positioning along the bottom
            grass.style.left = `${Math.random() * 100}%`;
            
            // Random height and sway speed
            const height = 40 + Math.random() * 60;
            grass.style.height = `${height}px`;
            
            const swayDuration = 2 + Math.random() * 3;
            grass.style.animationDuration = `${swayDuration}s`;
            grass.style.animationDelay = `${Math.random() * 2}s`;
            
            grassContainer.appendChild(grass);
        }
    }
    
    initGrass();
});
