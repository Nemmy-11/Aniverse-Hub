/**
 * Aniverse Hub - Global Utilities & Audio Engine
 * Provides dynamic styling helpers, Web Audio API synthesis for ambient lo-fi synth,
 * currency conversion, and page transition effects.
 */

// Global state
const AppState = {
    audioContext: null,
    musicNode: null,
    synthLoopActive: false,
    synthIntervalId: null,
    currentCurrency: localStorage.getItem('aniverse_currency') || 'NGN',
    pricing: {
        NGN: { symbol: '₦', rate: 1, label: '₦15,000' },
        USD: { symbol: '$', rate: 0.0025, label: '$38' },
        GHS: { symbol: 'GH₵', rate: 0.03, label: 'GH₵450' },
        KES: { symbol: 'KSh', rate: 0.35, label: 'KSh 5,250' },
        ZAR: { symbol: 'R', rate: 0.045, label: 'R 710' }
    }
};

// Initialize everything on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    initPageTransition();
    initCurrencySwitcher();
    injectFloatingControls();
    setupHoverSounds();
});

/* ==========================================================================
   PAGE TRANSITIONS
   ========================================================================== */
function initPageTransition() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
    
    // Trigger fade in
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });

    // Capture click events on internal navigation to fade out
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // If it's a page link (not scroll anchor or external link)
        if (href && href.endsWith('.html') && !href.startsWith('http') && !link.target) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                playClickSound();
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            });
        }
    });
}

/* ==========================================================================
   CURRENCY SWITCHER SYSTEM
   ========================================================================== */
function initCurrencySwitcher() {
    applyCurrencyPricing(AppState.currentCurrency);
}

function applyCurrencyPricing(currency) {
    AppState.currentCurrency = currency;
    localStorage.setItem('aniverse_currency', currency);

    // Find all currency indicators
    const priceTextElements = document.querySelectorAll('.price-value, .course-fee p:nth-child(2), .10k-naira, .price-bubble-3d .price-value');
    
    priceTextElements.forEach(el => {
        // Fade out
        el.style.opacity = '0';
        el.style.transform = 'scale(0.9) translateY(5px)';
        el.style.transition = 'opacity 0.25s, transform 0.25s';
        
        setTimeout(() => {
            // Apply corresponding price text
            if (el.classList.contains('price-value') || el.closest('.price-bubble-3d') || el.tagName === 'P' && el.textContent.includes('₦')) {
                // If it is the main discounted enrollment price (₦15,000 / $38 equivalent)
                el.textContent = AppState.pricing[currency].label;
            } else {
                // If it's the original full price (₦10,000 / $25 equivalent)
                const fullPriceText = {
                    NGN: '₦10,000',
                    USD: '$25',
                    GHS: 'GH₵300',
                    KES: 'KSh 3,500',
                    ZAR: 'R 475'
                };
                el.textContent = fullPriceText[currency];
            }
            
            // Fade back in
            el.style.opacity = '1';
            el.style.transform = 'scale(1) translateY(0)';
        }, 250);
    });

    // Update switcher elements if they exist
    const selects = document.querySelectorAll('.currency-select');
    selects.forEach(select => {
        select.value = currency;
    });
}

/* ==========================================================================
   FLOATING INTERACTIVE WIDGETS
   ========================================================================== */
function injectFloatingControls() {
    // 1. Inject Music Floating Widget in Bottom Right
    const soundContainer = document.createElement('div');
    soundContainer.className = 'floating-audio-widget';
    soundContainer.innerHTML = `
        <button class="audio-toggle-btn" id="audioToggleBtn" title="Play Ambient Music">
            <i class="fa-solid fa-volume-xmark"></i>
            <div class="sound-wave-bars">
                <span class="sw-bar"></span>
                <span class="sw-bar"></span>
                <span class="sw-bar"></span>
            </div>
        </button>
    `;
    document.body.appendChild(soundContainer);

    const btn = document.getElementById('audioToggleBtn');
    btn.addEventListener('click', toggleAmbientMusic);

    // 2. Inject Currency Selector into the Top Notification Banner
    const topBanner = document.querySelector('.top-banner');
    if (topBanner) {
        const switcherWrapper = document.createElement('div');
        switcherWrapper.className = 'currency-switcher-wrapper';
        switcherWrapper.innerHTML = `
            <span class="currency-label"><i class="fa-solid fa-earth-africa"></i> Currency:</span>
            <select class="currency-select" id="globalCurrencySelect" aria-label="Select Currency">
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="KES">KES (KSh)</option>
                <option value="ZAR">ZAR (R)</option>
            </select>
        `;
        topBanner.appendChild(switcherWrapper);

        const select = document.getElementById('globalCurrencySelect');
        select.value = AppState.currentCurrency;
        select.addEventListener('change', (e) => {
            playClickSound();
            applyCurrencyPricing(e.target.value);
        });
    }
}

/* ==========================================================================
   WEB AUDIO API SOUND GENERATOR (DYNAMIC RETRO SYNTH & SOUND FX)
   ========================================================================== */
function getAudioContext() {
    if (!AppState.audioContext) {
        // Fallback for older browsers
        AppState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (AppState.audioContext.state === 'suspended') {
        AppState.audioContext.resume();
    }
    return AppState.audioContext;
}

// 1. Play Interactive Interface Sounds
function playHoverSound() {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.005, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        // Silently fail if blocked
    }
}

function playClickSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
}

function playPowerSound() {
    try {
        const ctx = getAudioContext();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(240, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

// 2. Play Ambient Music Synth Loop
function toggleAmbientMusic() {
    const ctx = getAudioContext();
    const btn = document.getElementById('audioToggleBtn');
    
    if (!AppState.synthLoopActive) {
        // Start playing
        playClickSound();
        AppState.synthLoopActive = true;
        btn.classList.add('playing');
        btn.querySelector('i').className = 'fa-solid fa-volume-high';
        startSynthLoop(ctx);
    } else {
        // Stop playing
        playClickSound();
        AppState.synthLoopActive = false;
        btn.classList.remove('playing');
        btn.querySelector('i').className = 'fa-solid fa-volume-xmark';
        stopSynthLoop();
    }
}

function startSynthLoop(ctx) {
    // A dreamy 4-chord progression synthwave feel
    // Cmaj7 -> Am7 -> Fmaj7 -> G6
    const chords = [
        [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4
        [110.00, 196.00, 261.63, 329.63], // A2, G3, C4, E4
        [87.31, 174.61, 220.00, 261.63],  // F2, F3, A3, C4
        [98.00, 196.00, 246.94, 293.66]   // G2, G3, B3, D4
    ];
    
    let chordIndex = 0;
    const playChord = () => {
        if (!AppState.synthLoopActive) return;
        
        const frequencies = chords[chordIndex];
        const now = ctx.currentTime;
        const duration = 5.0; // Play chord for 5 seconds
        
        // Master filter for a lo-fi vintage feel
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(650, now);
        // Slowly sweep filter slightly
        lowpass.frequency.exponentialRampToValueAtTime(950, now + duration * 0.5);
        lowpass.frequency.exponentialRampToValueAtTime(650, now + duration);
        
        // Sub-bass oscillator
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(frequencies[0], now);
        bassGain.gain.setValueAtTime(0.04, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.1);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + duration);
        
        // 3 Synth voice oscillators
        const voiceNodes = [];
        const voicesGain = ctx.createGain();
        voicesGain.gain.setValueAtTime(0.015, now);
        // Soft fade-in envelope
        voicesGain.gain.linearRampToValueAtTime(0.025, now + 1.5);
        voicesGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.1);
        
        for (let i = 1; i < frequencies.length; i++) {
            const osc = ctx.createOscillator();
            // Alternate voice types for richer tone
            osc.type = i % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(frequencies[i], now);
            // Slight detuning for chorus-like warmth
            osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now);
            
            osc.connect(lowpass);
            voiceNodes.push(osc);
        }
        
        lowpass.connect(voicesGain);
        voicesGain.connect(ctx.destination);
        
        voiceNodes.forEach(osc => {
            osc.start(now);
            osc.stop(now + duration);
        });
        
        chordIndex = (chordIndex + 1) % chords.length;
    };
    
    // Play first chord immediately
    playChord();
    
    // Loop chord changes
    AppState.synthIntervalId = setInterval(playChord, 5000);
}

function stopSynthLoop() {
    if (AppState.synthIntervalId) {
        clearInterval(AppState.synthIntervalId);
        AppState.synthIntervalId = null;
    }
}

// 3. Attach hover sounds to active buttons/cards
function setupHoverSounds() {
    const hoverElements = document.querySelectorAll('.btn, .nav-list a, .nav-enroll, .tilt-card, .curriculum-card, .process-step, .hanging-lightbulb');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });

    // Make sure power mode toggle uses our cyber chime!
    const lightbulb = document.getElementById('lightbulb');
    if (lightbulb) {
        lightbulb.addEventListener('click', () => {
            setTimeout(() => {
                if (document.body.classList.contains('power-mode')) {
                    playPowerSound();
                } else {
                    playClickSound();
                }
            }, 50);
        });
    }
}
