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

    const journalSheet = document.querySelector('.journal-sheet');
    if (journalSheet) {
        const journalHome = journalSheet.querySelector('#journal-home');
        const journalPages = [...journalSheet.querySelectorAll('.journal-page')];
        let lastJournalTrigger = null;

        journalSheet.addEventListener('click', (event) => {
            const openButton = event.target.closest('[data-journal-target]');
            const backButton = event.target.closest('[data-journal-back]');

            if (openButton) {
                const page = journalPages.find((item) => item.dataset.journalPage === openButton.dataset.journalTarget);
                if (!page || !journalHome) return;

                lastJournalTrigger = openButton;
                journalHome.hidden = true;
                journalPages.forEach((item) => {
                    item.hidden = item !== page;
                    item.classList.remove('is-entering');
                });

                requestAnimationFrame(() => {
                    void page.offsetWidth;
                    page.classList.add('is-entering');
                    const pageHeading = page.querySelector('h3');
                    if (pageHeading) {
                        pageHeading.setAttribute('tabindex', '-1');
                        pageHeading.focus({ preventScroll: true });
                    }
                    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }

            if (backButton && journalHome) {
                const currentPage = backButton.closest('.journal-page');
                if (currentPage) {
                    currentPage.hidden = true;
                    currentPage.classList.remove('is-entering');
                }
                journalHome.hidden = false;
                journalHome.classList.remove('is-entering');

                requestAnimationFrame(() => {
                    void journalHome.offsetWidth;
                    journalHome.classList.add('is-entering');
                    if (lastJournalTrigger) lastJournalTrigger.focus({ preventScroll: true });
                    journalSheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        });
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

    const photobooth = document.querySelector('.photobooth-page');
    if (photobooth) {
        const video = document.getElementById('camera-preview');
        const placeholder = document.getElementById('camera-placeholder');
        const toggleCamera = document.getElementById('camera-toggle');
        const takePhoto = document.getElementById('take-photo');
        const uploadPhotos = document.getElementById('photo-upload');
        const countdown = document.getElementById('photo-countdown');
        const cameraStatus = document.getElementById('camera-status');
        const hint = document.getElementById('photobooth-hint');
        const countLabel = document.getElementById('photo-count');
        const downloadButton = document.getElementById('download-booth');
        const resultSection = document.getElementById('photobooth-result');
        const resultPreview = document.getElementById('photobooth-preview');
        const downloadPreview = document.getElementById('download-preview');
        const deletePreview = document.getElementById('delete-preview');
        const slots = [...document.querySelectorAll('.photo-slot')];
        const boothCanvas = document.getElementById('photobooth-canvas');
        let cameraStream = null;
        let capturedPhotos = [];
        let activeFilter = 'normal';
        let activeFrame = 'cream';
        let capturing = false;

        const filterMap = {
            normal: 'none',
            soft: 'saturate(0.85) contrast(0.92) brightness(1.08)',
            mono: 'grayscale(1) contrast(1.08)',
            warm: 'sepia(0.28) saturate(1.28) contrast(1.02)'
        };

        function updatePhotoUI() {
            countLabel.textContent = `${capturedPhotos.length} / 4`;
            downloadButton.disabled = capturedPhotos.length !== 4;
            slots.forEach((slot, index) => {
                slot.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>`;
                if (capturedPhotos[index]) {
                    const image = document.createElement('img');
                    image.src = capturedPhotos[index];
                    image.alt = `Photo ${index + 1}`;
                    image.style.filter = filterMap[activeFilter];
                    slot.prepend(image);
                    slot.classList.add('has-photo');
                } else {
                    slot.classList.remove('has-photo');
                }
            });
            if (capturedPhotos.length === 4) void refreshResultPreview();
            else resultSection.hidden = true;
        }

        function stopCamera() {
            if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
            video.srcObject = null;
            video.classList.remove('is-visible');
            placeholder.classList.remove('is-hidden');
            toggleCamera.textContent = 'Turn on camera';
            takePhoto.disabled = true;
            cameraStatus.textContent = 'Camera is off';
            cameraStatus.classList.remove('is-on');
        }

        async function startCamera() {
            if (!navigator.mediaDevices?.getUserMedia) {
                hint.textContent = 'Camera is not supported here. You can use Upload photos instead.';
                return;
            }
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                video.srcObject = cameraStream;
                video.classList.add('is-visible');
                placeholder.classList.add('is-hidden');
                toggleCamera.textContent = 'Turn off camera';
                takePhoto.disabled = false;
                cameraStatus.textContent = 'Camera is on';
                cameraStatus.classList.add('is-on');
                hint.textContent = capturedPhotos.length === 4 ? 'All photos are ready. Choose a frame and download.' : 'Four photos will be captured one by one with a 3-second countdown.';
            } catch (error) {
                hint.textContent = 'Camera permission was not given. You can still choose Upload photos.';
            }
        }

        function capturePhoto() {
            if (!video.videoWidth || capturedPhotos.length >= 4) return;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.filter = filterMap[activeFilter];
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            capturedPhotos.push(canvas.toDataURL('image/jpeg', 0.9));
            updatePhotoUI();
        }

        async function startCaptureSequence() {
            if (capturing || !cameraStream || !video.videoWidth || capturedPhotos.length >= 4) return;
            capturing = true;
            photobooth.classList.add('is-capturing');
            takePhoto.disabled = true;
            for (let seconds = 3; seconds > 0; seconds -= 1) {
                countdown.textContent = seconds;
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            capturePhoto();
            countdown.textContent = '✦';
            countdown.classList.add('flash');
            await new Promise((resolve) => setTimeout(resolve, 450));
            countdown.classList.remove('flash');
            countdown.textContent = '';
            capturing = false;
            photobooth.classList.remove('is-capturing');
            takePhoto.disabled = capturedPhotos.length >= 4;
            hint.textContent = capturedPhotos.length >= 4
                ? 'All photos are ready. Check the preview below before downloading.'
                : `Photo ${capturedPhotos.length} tersimpan. Klik Take photo lagi untuk foto berikutnya.`;
        }

        function drawCover(context, width, height) {
            const palettes = {
                cream: ['#fff8ed', '#7b2f32', '#f8e7d3'],
                postcard: ['#f4eee1', '#42536c', '#b44e42'],
                midnight: ['#202722', '#f4efe3', '#72756d']
            };
            const [background, accent, detail] = palettes[activeFrame];
            context.fillStyle = background;
            context.fillRect(0, 0, width, height);
            context.strokeStyle = accent;
            context.lineWidth = 22;
            context.strokeRect(24, 24, width - 48, height - 48);
            context.strokeStyle = detail;
            context.lineWidth = 5;
            context.strokeRect(48, 48, width - 96, height - 96);
            context.fillStyle = accent;
            context.font = 'bold 42px Georgia';
            context.textAlign = 'center';
            context.fillText(activeFrame === 'postcard' ? 'SUNDAY SNAPSHOTS' : activeFrame === 'midnight' ? 'NIGHT NOTES' : 'THEATER OF US', width / 2, 82);
            context.font = '22px Arial';
            context.fillText('SAVE THE BEST MOMENT ✦', width / 2, height - 42);
        }

        async function renderPhotobooth() {
            if (capturedPhotos.length !== 4) return;
            const width = 900;
            // The camera photos are usually landscape. A taller strip gives each
            // photo enough room to keep its full camera frame visible.
            const height = 2100;
            boothCanvas.width = width;
            boothCanvas.height = height;
            const context = boothCanvas.getContext('2d');
            drawCover(context, width, height);
            const imageHeight = 420;
            for (let index = 0; index < capturedPhotos.length; index += 1) {
                const image = new Image();
                image.src = capturedPhotos[index];
                await new Promise((resolve) => { image.onload = resolve; });
                const y = 120 + index * 480;
                // Contain instead of cover: never crop the original camera photo.
                const ratio = Math.min(780 / image.width, imageHeight / image.height);
                const drawWidth = image.width * ratio;
                const drawHeight = image.height * ratio;
                const x = 60 + (780 - drawWidth) / 2;
                const drawY = y + (imageHeight - drawHeight) / 2;
                context.save();
                context.beginPath();
                context.rect(60, y, 780, imageHeight);
                context.clip();
                context.fillStyle = activeFrame === 'midnight' ? '#202722' : '#f2e6d6';
                context.fillRect(60, y, 780, imageHeight);
                context.filter = filterMap[activeFilter];
                context.drawImage(image, x, drawY, drawWidth, drawHeight);
                context.restore();
            }
            return boothCanvas.toDataURL('image/jpeg', 0.92);
        }

        async function refreshResultPreview() {
            const previewUrl = await renderPhotobooth();
            if (!previewUrl) return;
            resultPreview.src = previewUrl;
            resultSection.hidden = false;
        }

        async function downloadPhotobooth() {
            const previewUrl = await renderPhotobooth();
            if (!previewUrl) return;
            const link = document.createElement('a');
            link.download = 'latifah-photobooth.jpg';
            link.href = previewUrl;
            link.click();
        }

        function clearPhotobooth() {
            capturedPhotos = [];
            uploadPhotos.value = '';
            resultPreview.removeAttribute('src');
            resultSection.hidden = true;
            hint.textContent = 'Foto dihapus. Klik Take photo untuk memulai lagi.';
            updatePhotoUI();
        }

        toggleCamera.addEventListener('click', () => (cameraStream ? stopCamera() : startCamera()));
        takePhoto.addEventListener('click', startCaptureSequence);
        downloadButton.addEventListener('click', refreshResultPreview);
        downloadPreview.addEventListener('click', downloadPhotobooth);
        deletePreview.addEventListener('click', clearPhotobooth);
        uploadPhotos.addEventListener('change', (event) => {
            const files = [...event.target.files].slice(0, 4);
            if (!files.length) return;
            capturedPhotos = [];
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = () => { capturedPhotos.push(reader.result); updatePhotoUI(); };
                reader.readAsDataURL(file);
            });
            hint.textContent = 'Photos uploaded. Choose a filter and frame, then download.';
        });
        document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
            activeFilter = button.dataset.filter;
            document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-selected', item === button));
            video.style.setProperty('--active-filter', filterMap[activeFilter]);
            updatePhotoUI();
        }));
        document.querySelectorAll('[data-frame]').forEach((button) => button.addEventListener('click', () => {
            activeFrame = button.dataset.frame;
            document.querySelectorAll('[data-frame]').forEach((item) => item.classList.toggle('is-selected', item === button));
            if (capturedPhotos.length === 4) void refreshResultPreview();
        }));
        updatePhotoUI();
    }



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
