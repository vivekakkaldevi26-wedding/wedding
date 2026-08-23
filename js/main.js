/**
 * Luxury Wedding Invitation Engine (T9 Style)
 * Handles envelope opening, ambient music playback, live countdown, venue map tabs,
 * photo gallery lightbox, RSVP submissions, guest wishes wall, and scroll reveals.
 */

(function () {
  'use strict';

  // Config defaults (matches T9 dataset scheme)
  const WEDDING_DATE = new Date('2027-01-27T11:00:00');
  
  // Audio state
  let audioContext = null;
  let isAudioPlaying = false;
  let synthOsc1 = null;
  let synthOsc2 = null;
  let synthGain = null;
  let synthInterval = null;

  document.addEventListener('DOMContentLoaded', () => {
    initEnvelope();
    initAudioPlayer();
    initCountdown();
    initVenueTabs();
    initGalleryLightbox();
    initRsvpForm();
    initWishesWall();
    initScrollReveals();
  });

  /* ── 1. ENVELOPE OPENING EXPERIENCE ── */
  function initEnvelope() {
    const session = document.getElementById('envelope-session');
    const envelope = document.getElementById('envelope');
    const seal = document.getElementById('wax-seal');
    const openBtn = document.getElementById('open-invitation-btn');

    if (!session || !envelope) return;

    function openEnvelope() {
      if (envelope.classList.contains('opened')) return;

      envelope.classList.add('opened');
      
      // Start background audio on user interaction
      playAmbientAudio();

      // Fade out envelope session overlay after flap unrolls
      setTimeout(() => {
        session.classList.add('is-opened');
        document.body.style.overflow = 'auto';
      }, 1100);
    }

    if (seal) seal.addEventListener('click', openEnvelope);
    if (openBtn) openBtn.addEventListener('click', openEnvelope);
    envelope.addEventListener('click', openEnvelope);
  }

  /* ── 2. AUDIO PLAYER & ROMANTIC SYNTH MELODY ── */
  function initAudioPlayer() {
    const toggleBtn = document.getElementById('audio-toggle');
    const audioEl = document.getElementById('bg-music');

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      if (isAudioPlaying) {
        pauseAmbientAudio();
      } else {
        playAmbientAudio();
      }
    });
  }

  function playAmbientAudio() {
    const toggleBtn = document.getElementById('audio-toggle');
    const audioEl = document.getElementById('bg-music');

    if (isAudioPlaying) return;

    // Try HTML5 Audio element first if valid source exists
    if (audioEl && audioEl.src && !audioEl.paused) {
      audioEl.play().then(() => {
        isAudioPlaying = true;
        if (toggleBtn) toggleBtn.classList.add('playing');
      }).catch(() => {
        startSynthMelody();
      });
      return;
    }

    startSynthMelody();
  }

  function startSynthMelody() {
    const toggleBtn = document.getElementById('audio-toggle');
    
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Gentle romantic arpeggio notes (F Major / D minor warmth)
      const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 329.63, 392.00];
      let noteIdx = 0;

      synthGain = audioContext.createGain();
      synthGain.gain.setValueAtTime(0.08, audioContext.currentTime);
      synthGain.connect(audioContext.destination);

      function playNextNote() {
        if (!isAudioPlaying || !audioContext) return;

        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[noteIdx], audioContext.currentTime);

        noteGain.gain.setValueAtTime(0.001, audioContext.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);

        osc.connect(noteGain);
        noteGain.connect(synthGain);

        osc.start();
        osc.stop(audioContext.currentTime + 1.3);

        noteIdx = (noteIdx + 1) % notes.length;
      }

      isAudioPlaying = true;
      if (toggleBtn) toggleBtn.classList.add('playing');

      playNextNote();
      synthInterval = setInterval(playNextNote, 800);

    } catch (e) {
      console.warn('Audio synthesis fallback error:', e);
    }
  }

  function pauseAmbientAudio() {
    const toggleBtn = document.getElementById('audio-toggle');
    const audioEl = document.getElementById('bg-music');

    isAudioPlaying = false;
    if (toggleBtn) toggleBtn.classList.remove('playing');

    if (audioEl) audioEl.pause();
    if (synthInterval) clearInterval(synthInterval);
    if (synthGain && audioContext) {
      synthGain.gain.setValueAtTime(0, audioContext.currentTime);
    }
  }

  /* ── 3. LIVE COUNTDOWN TIMER ── */
  function initCountdown() {
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function updateTimer() {
      const now = new Date();
      const diff = WEDDING_DATE - now;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  /* ── 4. MULTI-VENUE TABS ── */
  function initVenueTabs() {
    const tabBtns = document.querySelectorAll('.venue-tab-btn');
    const venueCards = document.querySelectorAll('.venue-card');

    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.venue;

        tabBtns.forEach(b => b.classList.remove('active'));
        venueCards.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const activeCard = document.getElementById(`venue-${target}`);
        if (activeCard) activeCard.classList.add('active');
      });
    });
  }

  /* ── 5. PHOTO GALLERY LIGHTBOX ── */
  function initGalleryLightbox() {
    const items = document.querySelectorAll('.gallery-item');
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');

    if (!items.length || !modal) return;

    items.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
          modalImg.src = img.src;
          modalImg.alt = img.alt || 'Wedding gallery photo';
          modal.classList.add('active');
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  /* ── 6. RSVP FORM HANDLER ── */
  function initRsvpForm() {
    const form = document.getElementById('rsvp-form');
    const thanksMsg = document.getElementById('rsvp-thanks');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const guestName = form.querySelector('[name="guestName"]')?.value || 'Valued Guest';
      const status = form.querySelector('[name="attendance"]:checked')?.value || 'attending';

      if (thanksMsg) {
        thanksMsg.innerHTML = `
          <div style="text-align: center; padding: 1.5rem; background: rgba(181,150,98,0.12); border-radius: 12px; margin-top: 1rem;">
            <p style="font-family: 'Cinzel', serif; font-size: 1.2rem; color: #5A4938;">Thank You, ${escapeHtml(guestName)}! ❦</p>
            <p style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.1rem; color: #887663; margin-top: 0.5rem;">
              Your response (${status === 'attending' ? 'Joyfully Accepting' : 'Regretfully Declining'}) has been recorded. We look forward to celebrating!
            </p>
          </div>
        `;
        thanksMsg.hidden = false;
        form.reset();
      }
    });
  }

  /* ── 7. WISHES GUESTBOOK WALL ── */
  function initWishesWall() {
    const form = document.getElementById('wish-form');
    const wall = document.getElementById('wishes-wall');

    const defaultWishes = [
      { name: 'Adam & Jenis', text: 'Wishing you both a lifetime of unending love, joy, and laughter! ❦' },
      { name: 'Abraham', text: 'May your journey together be blessed with endless happiness and cherished memories.' }
    ];

    function loadWishes() {
      const saved = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
      const allWishes = [...defaultWishes, ...saved];

      if (!wall) return;
      wall.innerHTML = allWishes.map(w => `
        <div class="wish-card">
          <div class="wish-author">${escapeHtml(w.name)}</div>
          <div class="wish-text">"${escapeHtml(w.text)}"</div>
        </div>
      `).join('');
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('wish-name');
        const textInput = document.getElementById('wish-text');

        if (!nameInput.value || !textInput.value) return;

        const newWish = { name: nameInput.value.trim(), text: textInput.value.trim() };
        const saved = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
        saved.unshift(newWish);
        localStorage.setItem('wedding_wishes', JSON.stringify(saved));

        loadWishes();
        form.reset();
      });
    }

    loadWishes();
  }

  /* ── 8. SCROLL REVEAL OBSERVER ── */
  function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal');

    if (!'IntersectionObserver' in window) {
      reveals.forEach(r => r.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(r => observer.observe(r));
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
