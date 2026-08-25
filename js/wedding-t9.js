/**
 * Wedding T9: four-flap letter open + looping swan hero + scroll invitation.
 */
(function () {
  'use strict';

  var body = document.body;
  if (!body) return;

  var sessionOpening = document.getElementById('wed9-session-opening');
  var sessionInvite = document.getElementById('wed9-session-invite');
  var openBtn = document.getElementById('wed9-open-btn');
  var hero = document.getElementById('wed9-hero');
  var heroVideo = document.getElementById('wed9-hero-video');
  var heroGroom = document.getElementById('wed9-hero-groom');
  var heroBride = document.getElementById('wed9-hero-bride');
  var heroNames = document.getElementById('wed9-hero-names');
  var heroInvite = document.getElementById('wed9-hero-invite');
  var heroInviteMsg = document.getElementById('wed9-hero-invite-msg');
  var heroAmp = document.getElementById('wed9-hero-amp');
  var heroFooter = document.getElementById('wed9-hero-footer');
  var audio = document.getElementById('wed9-music');
  var muteBtn = document.getElementById('wed9-mute-btn');
  var scrollPage = document.getElementById('wed9-scroll-page');
  var openingLoader = document.getElementById('wed9-opening-loader');
  var openingLoaderFill = document.getElementById('wed9-opening-loader-fill');

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Dev: skip the envelope opening and leave the page scrollable. Keep false for shipping. */
  var DEV_SKIP_OPENING = false;

  var openingStarted = false;
  var invitePrepared = false;
  var heroSequenceStarted = false;
  var heroIntroStarted = false;
  var petalsStarted = false;
  var venueTabsBuilt = false;
  var scrollRevealsInit = false;
  var quoteTyped = false;
  var wishesInit = false;
  var heartTrailInit = false;
  var openingAssetsReady = false;
  var openingLoaderTimer = null;
  var openingLoaderProgress = 0;
  var heroScrollLocked = false;
  var scrollLockHandler = null;

  var LINE_IN_MS = 1600;
  var LINE_OUT_MS = 800;
  var HERO_FLY_SETTLE_MS = 1600;
  var INVITE_WORD_STEP_MS = 140;
  var NAME_LETTER_STEP_MS = 175;
  var BLESSING_NAME_STEP_MS = 260;
  var QUOTE_TYPE_MS = 34;
  /* Defaults match wedding-t9.css; body.wed9-open-slow (etc.) can override via CSS vars. */
  var OPEN_FLAP_MS = 1650;
  var SEAL_GLOW_MS = 420;
  var SEAL_FADE_MS = 520;
  var HERO_VIDEO_START_MS = 700;

  function parseCssTimeMs(value, fallback) {
    var raw = String(value || '').trim();
    if (!raw) return fallback;
    var n = parseFloat(raw);
    if (isNaN(n)) return fallback;
    if (/ms$/i.test(raw)) return n;
    if (/s$/i.test(raw)) return n * 1000;
    return n;
  }

  function getOpeningTimingMs() {
    var styles = getComputedStyle(document.body);
    return {
      openFlap: parseCssTimeMs(styles.getPropertyValue('--wed9-open-side-ms'), OPEN_FLAP_MS),
      sealGlow: parseCssTimeMs(styles.getPropertyValue('--wed9-seal-glow-ms'), SEAL_GLOW_MS),
      heroVideoStart: parseCssTimeMs(
        styles.getPropertyValue('--wed9-hero-video-start-ms'),
        HERO_VIDEO_START_MS
      )
    };
  }

  var PETAL_COUNT = 10;
  var PETAL_SHADES = ['#fffef8', '#FBF1DF', '#F3E3C8', '#D9C6A8', '#f7edd8', '#efe4cf', '#e8d9b8'];

  var HEART_SHADES = ['#fbf1df', '#f3e3c8', '#d9c6a8', '#b59662', '#c9b184'];
  var HEART_MAX_LIVE = 48;
  var HEART_MIN_SIZE = 7;
  var HEART_SIZE_RANGE = 5;
  var HEART_TRAIL_GAP_MS = 45;
  var HEART_TRAIL_MIN_DIST = 14;
  var HEART_SCROLL_GAP_MS = 260;
  var HEART_BURST_COUNT = 3;

  var countdownEls = {
    days: document.getElementById('wed9-countdown-days'),
    hours: document.getElementById('wed9-countdown-hours'),
    minutes: document.getElementById('wed9-countdown-minutes'),
    seconds: document.getElementById('wed9-countdown-seconds')
  };

  var VENUE_ART = [
    {
      path: '/templates%2Fshared%2Fimages%2Fwedding%20t9%2Fivory%20venue%203.png',
      token: '8415943b-6045-4c98-a248-d026339ebdac'
    },
    {
      path: '/templates%2Fshared%2Fimages%2Fwedding%20t9%2Fvenue%20ivory%202.png',
      token: '0be553f0-014d-49d2-83ac-de30a13a510f'
    },
    {
      path: '/templates%2Fshared%2Fimages%2Fwedding%20t9%2Fvenue%20ivory.png',
      token: '8d4faa84-c7c4-42b9-9fe1-c0ccbceb10ca'
    }
  ];

  function firebaseAssetUrl(asset) {
    if (!asset) return '';
    if (typeof asset === 'string') return asset;
    if (asset.path) {
      var name = decodeURIComponent(asset.path.split('/').pop());
      if (name === 'envelope top and bottom.png') return 'assets/envelope_top_bottom.png';
      if (name === 'envelope side.png') return 'assets/envelope_side.png';
      if (name === 'flower ivory seal.png') return 'assets/flower_seal.png';
      if (name === 'time clock.png') return 'assets/clock.png';
      if (name === 'brown flower.png') return 'assets/brown_flower.png';
      if (name === 'ivory flower 3.png') return 'assets/ivory_flower_3.png';
      if (name === 'brown flower 6.png') return 'assets/brown_flower_6.png';
      if (name === 'ivory frame 3.png') return 'assets/ivory_frame_3.png';
      if (name === 'quote session 4.jpeg') return 'assets/quote_session_4.jpeg';
      if (name === 'details session ivory.jpeg') return 'assets/details_session_ivory.jpeg';
      if (name === '1.jpeg') return 'assets/photo1.jpeg';
      if (name === '2.jpeg') return 'assets/photo2.jpeg';
      if (name === '3.jpeg') return 'assets/photo3.jpeg';
      if (name === '4.jpeg') return 'assets/photo4.jpeg';
      if (name === 'Swans2.mp4') return 'assets/Swans2.mp4';
    }
    var base = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!base) base = 'https://firebasestorage.googleapis.com/v0/b/my-bel0ved.firebasestorage.app/o/';
    return base + (asset.path || '').replace(/^\//, '') + '?alt=media&token=' + asset.token;
  }

  function getAttr(name, fallback) {
    var val = body.getAttribute(name);
    if (val === null || val === '') return fallback;
    return val;
  }

  function isPremium() {
    return getAttr('data-variant', '') === 'premium';
  }

  function isBrideFirst() {
    return getAttr('data-bride-first', '') === 'true';
  }

  function applyBrideFirstOrder() {
    if (!isBrideFirst()) return;
    body.classList.add('wed9-bride-first');

    var detailsCard = document.querySelector('.wed9-details-card');
    var detailsGroom = document.querySelector('.wed9-details-person-groom');
    var detailsBride = document.querySelector('.wed9-details-person-bride');
    var detailsDivider = document.querySelector('.wed9-details-divider');
    if (detailsCard && detailsGroom && detailsBride && detailsDivider) {
      detailsCard.insertBefore(detailsBride, detailsGroom);
      detailsCard.insertBefore(detailsDivider, detailsGroom);
    }

    var heroNamesEl = document.getElementById('wed9-hero-names');
    if (heroNamesEl && heroGroom && heroBride && heroAmp) {
      heroNamesEl.insertBefore(heroBride, heroGroom);
      heroNamesEl.insertBefore(heroAmp, heroGroom);
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function abbreviateParentPrefix(prefix) {
    if (!prefix) return '';
    var value = prefix.trim().toLowerCase().replace(/\./g, '');
    if (value === 'son of' || value === 's/o') return 'S/o';
    if (value === 'daughter of' || value === 'd/o') return 'D/o';
    return prefix;
  }

  function splitParentNameLines(value) {
    if (!value) return [];
    var parts;
    if (value.indexOf('|') !== -1) {
      parts = value.split('|');
    } else if (value.indexOf('&') !== -1) {
      parts = value.split('&');
    } else if (value.indexOf(' and ') !== -1) {
      parts = value.split(/\s+and\s+/i);
    } else {
      return [value.trim()].filter(Boolean);
    }
    return parts.map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function formatDetailsParents(prefix, names) {
    var lines = splitParentNameLines(names);
    if (!lines.length) return '';
    var shortPrefix = abbreviateParentPrefix(prefix);
    var html = '';
    if (shortPrefix) {
      html += '<span class="wed9-details-parents-prefix">' + escapeHtml(shortPrefix) + '</span>';
    }
    html += lines.map(function (line) {
      return '<span class="wed9-details-parent-line">' + escapeHtml(line) + '</span>';
    }).join('');
    return html;
  }

  function formatLongDate(dateRaw) {
    if (!dateRaw) return '';
    var eventDate = new Date(dateRaw + 'T00:00:00');
    if (isNaN(eventDate.getTime())) return '';
    return eventDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatTimelineDate(dateRaw) {
    if (!dateRaw) return '';
    var d = new Date(dateRaw + 'T00:00:00');
    if (isNaN(d.getTime())) return dateRaw;
    var day = d.getDate();
    var month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    return day + ' ' + month;
  }

  function getPrimaryDateRaw() {
    return getAttr('data-primary-date', '') ||
      getAttr('data-event-1-date', '') ||
      getAttr('data-event-date', '');
  }

  function getPrimaryTimeRaw() {
    return getAttr('data-countdown-time', '') ||
      getAttr('data-event-1-time', '') ||
      getAttr('data-event-time', '');
  }

  function buildInviteWords(message) {
    var index = 0;
    return String(message || '')
      .split('|')
      .map(function (segment) {
        return segment
          .split(/\s+/)
          .filter(Boolean)
          .map(function (word) {
            var delay = index * INVITE_WORD_STEP_MS;
            index += 1;
            return (
              '<span class="wed9-hero-word" style="--delay:' +
              delay +
              'ms">' +
              escapeHtml(word) +
              '</span>'
            );
          })
          .join(' ');
      })
      .join('<br>');
  }

  /* Siblings are wrapped one per span so they can tumble up one after another. */
  function buildBlessingNames(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    var parts = text.split(/\s*(,|&|\band\b)\s*/i);
    var spans = [];
    for (var i = 0; i < parts.length; i += 2) {
      var name = (parts[i] || '').trim();
      if (!name) continue;
      var separator = (parts[i + 1] || '').trim();
      var label = name + (separator === ',' ? ',' : separator ? ' ' + separator : '');
      spans.push(
        '<span class="wed9-blessing-name" style="--delay:' +
          spans.length * BLESSING_NAME_STEP_MS +
          'ms">' +
          escapeHtml(label) +
          '</span>'
      );
    }
    return spans.join(' ');
  }

  function hydrate() {
    var groomName = getAttr('data-groom-name', '');
    var brideName = getAttr('data-bride-name', '');
    var groomDisplay = getAttr('data-groom-display-name', groomName);
    var brideDisplay = getAttr('data-bride-display-name', brideName);

    setText('wed9-hero-groom', groomDisplay);
    setText('wed9-hero-bride', brideDisplay);
    if (heroGroom) heroGroom.setAttribute('data-full-text', groomDisplay);
    if (heroBride) heroBride.setAttribute('data-full-text', brideDisplay);

    setText('wed9-hero-line-1', getAttr('data-hero-line-1', 'And so, our forever begins'));
    var inviteMessage = getAttr('data-invitation-message', '');
    setHtml('wed9-hero-invite-msg', buildInviteWords(inviteMessage));
    setText('wed9-details-greeting', getAttr('data-details-greeting', 'With joy and gratitude'));
    setText(
      'wed9-details-welcome',
      getAttr('data-details-welcome', '') ||
        inviteMessage.split('|').join(' ').replace(/\s+/g, ' ').trim()
    );
    setText('wed9-welcome-text', getAttr('data-welcome-message', ''));
    if (isBrideFirst()) {
      setHtml(
        'wed9-closing-names',
        '<span class="wed9-closing-name wed9-closing-name-bride">' + escapeHtml(brideDisplay) + '</span>' +
          '<span class="wed9-closing-amp">&amp;</span>' +
          '<span class="wed9-closing-name wed9-closing-name-groom">' + escapeHtml(groomDisplay) + '</span>'
      );
    } else {
      setHtml(
        'wed9-closing-names',
        '<span class="wed9-closing-name wed9-closing-name-groom">' + escapeHtml(groomDisplay) + '</span>' +
          '<span class="wed9-closing-amp">&amp;</span>' +
          '<span class="wed9-closing-name wed9-closing-name-bride">' + escapeHtml(brideDisplay) + '</span>'
      );
    }

    setText('wed9-details-groom-name', groomName);
    setHtml(
      'wed9-details-groom-parents',
      formatDetailsParents(
        getAttr('data-groom-parent-prefix', ''),
        getAttr('data-groom-parents-name', '')
      )
    );
    setText('wed9-details-bride-name', brideName);
    setHtml(
      'wed9-details-bride-parents',
      formatDetailsParents(
        getAttr('data-bride-parent-prefix', ''),
        getAttr('data-bride-parents-name', '')
      )
    );

    var dateRaw = getPrimaryDateRaw();
    var timeRaw = getPrimaryTimeRaw();
    setText('wed9-details-date', formatLongDate(dateRaw));
    setText('wed9-details-venue', getAttr('data-venue-1-address', '') || getAttr('data-event-address', ''));
    setText('wed9-details-time', timeRaw);
    setText('wed9-hero-date', formatLongDate(dateRaw));

    var blessingsFrom = getAttr('data-blessings-from', '');
    setHtml('wed9-blessings-names', buildBlessingNames(blessingsFrom));
    var blessingsEl = document.getElementById('wed9-blessings');
    if (blessingsEl) blessingsEl.hidden = !blessingsFrom;

    buildDateCard();
    buildTimeline();
    hydrateCountdown();
    hydrateQuote();
    hydratePhotos();
    hydrateContact();
    applyBrideFirstOrder();
  }

  function buildDateCard() {
    var dayEl = document.getElementById('wed9-date-day');
    var monthEl = document.getElementById('wed9-date-month');
    var yearEl = document.getElementById('wed9-date-year');
    var subEl = document.getElementById('wed9-date-sub');
    if (!dayEl || !monthEl || !yearEl || !subEl) return;

    var eventDate = new Date(getPrimaryDateRaw() + 'T00:00:00');
    if (isNaN(eventDate.getTime())) {
      dayEl.textContent = '';
      monthEl.textContent = '';
      yearEl.textContent = '';
      subEl.textContent = '';
      return;
    }

    dayEl.textContent = String(eventDate.getDate());
    monthEl.textContent = eventDate
      .toLocaleDateString('en-GB', { month: 'long' })
      .toUpperCase();
    yearEl.textContent = String(eventDate.getFullYear());

    var weekday = eventDate.toLocaleDateString('en-GB', { weekday: 'long' });
    var time = (getPrimaryTimeRaw() || '').trim();
    subEl.textContent = time ? weekday + ' \u00b7 ' + time : weekday;
  }

  function buildTimeline() {
    var list = document.getElementById('wed9-timeline-list');
    if (!list) return;
    list.innerHTML = '';

    var eventIndex = 0;
    for (var i = 1; i <= 8; i++) {
      var title = getAttr('data-event-' + i + '-title', '');
      if (!title) continue;
      eventIndex += 1;
      var dateRaw = getAttr('data-event-' + i + '-date', '') || getAttr('data-event-date', '');
      var time = getAttr('data-event-' + i + '-time', '');
      var dateLabel = formatTimelineDate(dateRaw);
      var metaHtml = '';
      if (dateLabel) {
        metaHtml += '<span class="wed9-timeline-date">' + escapeHtml(dateLabel) + '</span>';
      }
      if (time) {
        metaHtml += '<span class="wed9-timeline-time">' + escapeHtml(time) + '</span>';
      }

      var side = eventIndex % 2 === 1 ? 'is-left' : 'is-right';
      var item = document.createElement('li');
      item.className = 'wed9-timeline-item ' + side;
      item.innerHTML =
        '<div class="wed9-timeline-card">' +
          '<h3 class="wed9-timeline-title">' + escapeHtml(title) + '</h3>' +
          (metaHtml ? '<p class="wed9-timeline-meta">' + metaHtml + '</p>' : '') +
        '</div>';
      list.appendChild(item);
    }

    if (!list.children.length) {
      var section = document.getElementById('wed9-timeline');
      if (section) section.hidden = true;
    }
  }

  function getVenueCount() {
    var count = parseInt(getAttr('data-venue-count', '1'), 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 4) count = 4;
    return count;
  }

  function buildVenueTabs() {
    var tabsEl = document.getElementById('wed9-venue-tabs');
    var panelsEl = document.getElementById('wed9-venue-panels');
    if (!tabsEl || !panelsEl) return;

    var count = getVenueCount();
    var hasMultiple = count > 1;
    tabsEl.classList.toggle('is-single', !hasMultiple);
    tabsEl.innerHTML = '';
    panelsEl.innerHTML = '';

    for (var i = 1; i <= count; i++) {
      var label = getAttr('data-venue-' + i + '-label', 'Venue ' + i);
      var address = getAttr('data-venue-' + i + '-address', getAttr('data-event-address', ''));
      var mapLink = getAttr('data-venue-' + i + '-map-link', getAttr('data-map-link', '#'));
      var art = VENUE_ART[Math.min(i - 1, VENUE_ART.length - 1)];

      if (hasMultiple) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'wed9-venue-tab' + (i === 1 ? ' is-active' : '');
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', i === 1 ? 'true' : 'false');
        tab.setAttribute('data-venue-index', String(i));
        tab.textContent = label;
        tabsEl.appendChild(tab);
      }

      var panel = document.createElement('div');
      panel.className = 'wed9-venue-panel' + (i === 1 ? ' is-active' : '');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-venue-index', String(i));
      panel.innerHTML =
        '<div class="wed9-venue-panel-card">' +
          '<div class="wed9-venue-frame-wrap">' +
            '<img class="wed9-venue-frame" data-storage-path="' + art.path + '" data-token="' + art.token + '" src="' + firebaseAssetUrl(art) + '" alt="" aria-hidden="true">' +
          '</div>' +
          '<h3 class="wed9-venue-card-title">' + escapeHtml(label) + '</h3>' +
          '<p class="wed9-venue-address">' + escapeHtml(address) + '</p>' +
          '<a class="wed9-btn-map" href="' + mapLink + '" target="_blank" rel="noopener noreferrer">View on Google Maps</a>' +
        '</div>';
      panelsEl.appendChild(panel);
    }

    if (hasMultiple) {
      tabsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.wed9-venue-tab');
        if (!btn) return;
        switchVenueTab(btn.getAttribute('data-venue-index'));
      });
    }
  }

  function switchVenueTab(index) {
    document.querySelectorAll('.wed9-venue-tab').forEach(function (tab) {
      var active = tab.getAttribute('data-venue-index') === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.wed9-venue-panel').forEach(function (panel) {
      panel.classList.toggle('is-active', panel.getAttribute('data-venue-index') === index);
    });
  }

  function parseTimeToDate(dateRaw, timeRaw) {
    var timeStart = (timeRaw || '11:00 AM').split(/[-–—]/)[0].trim();
    var dateTime = new Date(dateRaw + ' ' + timeStart);
    if (isNaN(dateTime.getTime())) {
      dateTime = new Date(dateRaw + 'T11:00:00');
    }
    return dateTime;
  }

  function hydrateCountdown() {
    var dateRaw = getPrimaryDateRaw();
    var timeRaw = getPrimaryTimeRaw();
    var label = formatLongDate(dateRaw);
    var timeStart = (timeRaw || '').split(/[-–—]/)[0].trim();
    if (label && timeStart) label += ' at ' + timeStart;
    setText('wed9-countdown-date', label);
  }

  function encodedStoragePath(attr) {
    return attr ? attr.replace(/^\//, '') : '';
  }

  function applyFirebaseAsset(el) {
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!el) return;
    var storagePath = el.getAttribute('data-storage-path');
    if (!storagePath) return;
    var token = el.getAttribute('data-token');
    var encoded = encodedStoragePath(storagePath);

    function setSrc(url) {
      if (!url) return;
      if (el.tagName === 'SOURCE') {
        el.src = url;
        var audioEl = el.closest('audio');
        if (audioEl) {
          audioEl.src = url;
          audioEl.preload = 'auto';
          audioEl.load();
        }
        return;
      }
      el.src = url;
    }

    if (baseUrl && token) {
      setSrc(baseUrl + encoded + '?alt=media&token=' + token);
      return;
    }
    if (baseUrl) {
      resolvePathOnlyImageUrl(storagePath, baseUrl, setSrc);
    }
  }

  function resolvePathOnlyImageUrl(storagePath, baseUrl, cb) {
    var encoded = encodedStoragePath(storagePath);
    var bucket = 'my-bel0ved.firebasestorage.app';

    function setUrl(url) {
      if (url && typeof cb === 'function') cb(url);
    }

    fetch('https://firebasestorage.googleapis.com/v0/b/' + bucket + '/o/' + encoded)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var token = data && (data.downloadTokens || (data.metadata && data.metadata.firebaseStorageDownloadTokens));
        if (token) setUrl(baseUrl + encoded + '?alt=media&token=' + token);
        else setUrl(baseUrl + encoded + '?alt=media');
      })
      .catch(function () {
        setUrl(baseUrl + encoded + '?alt=media');
      });
  }

  function hydrateQuote() {
    var section = document.getElementById('wed9-quote');
    if (!section) return;
    if (!isPremium()) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var quote = getAttr('data-quote', '').replace(/\s+/g, ' ').trim();
    var textEl = document.getElementById('wed9-quote-text');
    if (!textEl) return;
    textEl.setAttribute('data-full-text', quote);
    if (!quote) {
      textEl.textContent = '';
      return;
    }
    if (prefersReducedMotion) {
      textEl.textContent = quote;
      quoteTyped = true;
      return;
    }
    textEl.textContent = '';
  }

  /*
   * Measures where the finished quote wraps so typing can fill fixed lines.
   * Without this, each new word reflows the text and words hop between lines.
   */
  function measureQuoteLines(textEl, full) {
    textEl.textContent = full;
    var node = textEl.firstChild;
    if (!node || !document.createRange) return [full];

    var range = document.createRange();
    var lines = [];
    var current = '';
    var lineTop = null;

    for (var i = 0; i < full.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      var rect = range.getBoundingClientRect();
      if (!rect || !rect.height) {
        current += full.charAt(i);
        continue;
      }
      var top = Math.round(rect.top);
      if (lineTop === null) lineTop = top;
      if (top > lineTop + 2) {
        lines.push(current);
        current = '';
        lineTop = top;
        if (full.charAt(i) === ' ') continue;
      }
      current += full.charAt(i);
    }
    if (current) lines.push(current);
    return lines.length ? lines : [full];
  }

  /* Types the quote out once its session scrolls into view. */
  function typeQuote() {
    if (quoteTyped) return;
    var textEl = document.getElementById('wed9-quote-text');
    if (!textEl) return;
    var full = textEl.getAttribute('data-full-text') || '';
    if (!full) return;
    quoteTyped = true;

    function run() {
      var lines = measureQuoteLines(textEl, full);
      textEl.textContent = '';

      var caret = document.createElement('span');
      caret.className = 'wed9-quote-caret';
      caret.setAttribute('aria-hidden', 'true');

      var nodes = lines.map(function (line) {
        var lineEl = document.createElement('span');
        lineEl.className = 'wed9-quote-line';
        var textNode = document.createTextNode('');
        lineEl.appendChild(textNode);
        textEl.appendChild(lineEl);
        return { el: lineEl, node: textNode, text: line };
      });

      var lineIndex = 0;
      var charIndex = 0;
      nodes[0].el.appendChild(caret);

      function typeNext() {
        var line = nodes[lineIndex];
        if (charIndex >= line.text.length) {
          lineIndex += 1;
          charIndex = 0;
          if (lineIndex >= nodes.length) {
            caret.classList.add('is-done');
            return;
          }
          nodes[lineIndex].el.appendChild(caret);
          setTimeout(typeNext, QUOTE_TYPE_MS * 3);
          return;
        }
        var ch = line.text.charAt(charIndex);
        line.node.nodeValue += ch;
        charIndex += 1;
        var delay = QUOTE_TYPE_MS;
        if (ch === ',') delay = QUOTE_TYPE_MS * 6;
        else if (ch === '.' || ch === '!' || ch === '?') delay = QUOTE_TYPE_MS * 9;
        setTimeout(typeNext, delay);
      }

      setTimeout(typeNext, 260);
    }

    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  }

  function formatTelHref(phone) {
    return 'tel:' + String(phone || '').replace(/\s/g, '');
  }

  function hydrateContact() {
    var section = document.getElementById('wed9-contact');
    if (!section) return;
    if (!isPremium()) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var wrap = document.getElementById('wed9-contact-actions');
    if (!wrap) return;
    wrap.innerHTML = '';

    var phone1 = getAttr('data-contact-phone', '');
    var phone2 = getAttr('data-contact-phone-2', '');

    function addBtn(phone, label) {
      if (!phone) return;
      var link = document.createElement('a');
      link.className = 'wed9-btn-contact';
      link.href = formatTelHref(phone);
      link.textContent = label || phone;
      wrap.appendChild(link);
    }

    if (phone1 && phone2) {
      addBtn(phone1, 'Call ' + phone1);
      addBtn(phone2, 'Call ' + phone2);
    } else {
      addBtn(phone1 || phone2, 'Contact Us');
    }

    if (!wrap.children.length) section.hidden = true;
  }

  function initWishes() {
    var section = document.getElementById('wed9-wishes');
    if (!section) return;
    section.hidden = false;

    var form = document.getElementById('wed9-wishes-form');
    var thanks = document.getElementById('wed9-wishes-thanks');
    var thanksText = document.getElementById('wed9-wishes-thanks-text');

    if (form && !form.dataset.bound) {
      form.dataset.bound = 'true';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('wed9-wishes-name');
        var wishInput = document.getElementById('wed9-wishes-wish');
        var name = nameInput ? nameInput.value.trim() : '';
        var wish = wishInput ? wishInput.value.trim() : '';

        if (!name || !wish) return;

        var formData = new FormData(form);
        fetch('https://formsubmit.co/ajax/vivek.akkaldevi26@gmail.com', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        }).catch(function () {});

        if (thanks) {
          if (thanksText) thanksText.textContent = 'Thank you ' + name + ' for your beautiful wish!';
          thanks.hidden = false;
        }

        launchWishHearts();
        form.reset();
      });
    }
  }

  /* t1-style shower: filled and outlined hearts fall after a wish is sent. */
  function launchWishHearts() {
    if (prefersReducedMotion) return;

    var burst = document.createElement('div');
    burst.className = 'wed9-wish-rain';
    burst.setAttribute('aria-hidden', 'true');
    document.body.appendChild(burst);

    var tints = ['#b59662', '#c9b184', '#d9c6a8', '#f3e3c8', '#5a4938', '#887663'];
    var filledPath = 'M12 20.6C6.9 17.1 3 13.9 3 10.2 3 7.4 5.1 5.4 7.7 5.4c1.7 0 3.3.9 4.3 2.3 1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2 4.7 4.8 0 3.7-3.9 6.9-9 10.4z';
    var pieces = 28;

    for (var i = 0; i < pieces; i++) {
      var outlined = i % 2 === 0;
      var heart = document.createElement('span');
      heart.className = 'wed9-wish-drop' + (outlined ? ' is-outline' : ' is-filled');
      heart.style.left = randomInRange(2, 98).toFixed(2) + '%';
      heart.style.animationDelay = randomInRange(0, 0.85).toFixed(2) + 's';
      heart.style.animationDuration = randomInRange(2.4, 3.9).toFixed(2) + 's';
      heart.style.fontSize = randomInRange(0.95, 1.7).toFixed(2) + 'rem';
      heart.style.color = tints[i % tints.length];
      heart.style.setProperty('--dx', randomInRange(-36, 36).toFixed(0) + 'px');
      heart.style.setProperty('--spin', randomInRange(-28, 32).toFixed(0) + 'deg');
      heart.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="' + filledPath + '"/>' +
        '</svg>';
      burst.appendChild(heart);
    }

    setTimeout(function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 5200);
  }

  function hydratePhotos() {
    var section = document.getElementById('wed9-photos');
    if (!section) return;
    if (!isPremium()) {
      section.hidden = true;
      return;
    }
    section.hidden = false;

    setText('wed9-photos-title', getAttr('data-photos-title', 'A Glimpse of Us'));

    for (var i = 1; i <= 4; i++) {
      var photo = document.getElementById('wed9-photo-' + i);
      var card = photo ? photo.closest('.wed9-photo-card') : null;
      if (!photo) continue;
      var path = getAttr('data-photo-' + i, '');
      if (path) {
        photo.setAttribute('data-storage-path', path);
        photo.removeAttribute('data-token');
        if (card) card.classList.remove('is-empty');
        applyFirebaseAsset(photo);
        continue;
      }
      if (photo.getAttribute('data-storage-path')) {
        if (card) card.classList.remove('is-empty');
        applyFirebaseAsset(photo);
        continue;
      }
      /* Template default: local files shipped beside index.html. */
      if (photo.getAttribute('src')) {
        if (card) card.classList.remove('is-empty');
        continue;
      }
      if (card) card.classList.add('is-empty');
    }
  }

  function runFirebaseInit() {
    initializeFirebaseAudio();
    hydratePhotos();
    if (window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl) return;
    var check = setInterval(function () {
      if (window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl) {
        clearInterval(check);
        initializeFirebaseAudio();
        hydratePhotos();
      }
    }, 100);
    setTimeout(function () { clearInterval(check); }, 12000);
  }

  function startCountdown() {
    if (!countdownEls.days) return;
    var dateTime = parseTimeToDate(getPrimaryDateRaw(), getPrimaryTimeRaw());
    if (isNaN(dateTime.getTime())) return;

    function pad(value) {
      return value < 10 ? '0' + value : String(value);
    }

    function tick() {
      var diff = dateTime.getTime() - Date.now();
      if (diff <= 0) {
        countdownEls.days.textContent = '00';
        countdownEls.hours.textContent = '00';
        countdownEls.minutes.textContent = '00';
        countdownEls.seconds.textContent = '00';
        return;
      }
      var dayMs = 24 * 60 * 60 * 1000;
      var hourMs = 60 * 60 * 1000;
      var minuteMs = 60 * 1000;
      countdownEls.days.textContent = pad(Math.floor(diff / dayMs));
      countdownEls.hours.textContent = pad(Math.floor((diff % dayMs) / hourMs));
      countdownEls.minutes.textContent = pad(Math.floor((diff % hourMs) / minuteMs));
      countdownEls.seconds.textContent = pad(Math.floor((diff % minuteMs) / 1000));
    }

    tick();
    setInterval(tick, 1000);
  }

  function resetScrollToTop() {
    if (scrollPage) scrollPage.scrollTop = 0;
  }

  function onScrollLockEvent(e) {
    if (!heroScrollLocked) return;
    resetScrollToTop();
    e.preventDefault();
  }

  function lockHeroScroll() {
    if (!scrollPage || heroScrollLocked) return;
    heroScrollLocked = true;
    scrollPage.classList.add('is-scroll-locked');
    resetScrollToTop();
    if (!scrollLockHandler) {
      scrollLockHandler = onScrollLockEvent;
      scrollPage.addEventListener('wheel', scrollLockHandler, { passive: false });
      scrollPage.addEventListener('touchmove', scrollLockHandler, { passive: false });
    }
  }

  function unlockHeroScroll() {
    if (!scrollPage) return;
    heroScrollLocked = false;
    scrollPage.classList.remove('is-scroll-locked');
    if (scrollLockHandler) {
      scrollPage.removeEventListener('wheel', scrollLockHandler);
      scrollPage.removeEventListener('touchmove', scrollLockHandler);
      scrollLockHandler = null;
    }
  }

  /* Buffer the swan clip but hold it on frame 0 until the flaps are fully clear. */
  function holdHeroVideoAtStart() {
    if (!heroVideo) return;
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.pause();

    function seekStart() {
      try {
        if (heroVideo.currentTime > 0) heroVideo.currentTime = 0;
      } catch (err) { /* seeking not ready yet */ }
    }

    if (heroVideo.readyState >= 1) seekStart();
    else heroVideo.addEventListener('loadedmetadata', seekStart, { once: true });
  }

  function playHeroVideo() {
    if (!heroVideo) return;
    heroVideo.muted = true;
    heroVideo.loop = true;
    var playAttempt = heroVideo.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () { /* autoplay may still wait */ });
    }
  }

  function applyMusicVolume() {
    if (!audio) return;
    var volRaw = getAttr('data-music-volume', '');
    if (!volRaw) return;
    var vol = parseFloat(volRaw);
    if (isNaN(vol)) return;
    if (vol > 1) vol = vol / 100;
    audio.volume = Math.min(1, Math.max(0, vol));
  }

  function initializeFirebaseAudio() {
    if (!audio) return;
    applyMusicVolume();
    var source = audio.querySelector('source[data-storage-path]');
    if (source) applyFirebaseAsset(source);
  }

  function startMusic() {
    if (!audio) return;
    var playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt.catch(function () {
        var retry = function () {
          audio.removeEventListener('canplay', retry);
          audio.play().catch(function () { /* still blocked */ });
        };
        audio.addEventListener('canplay', retry);
      });
    }
  }

  function showMuteButton(show) {
    if (!muteBtn) return;
    if (show) muteBtn.removeAttribute('aria-hidden');
    else muteBtn.setAttribute('aria-hidden', 'true');
  }

  function initMute() {
    if (!audio) return;

    if (muteBtn) {
      muteBtn.addEventListener('click', function () {
        audio.muted = !audio.muted;
        muteBtn.textContent = audio.muted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
      });
    }

    function pauseAudio() {
      if (!audio) return;
      try {
        audio.pause();
      } catch (e) {}
    }

    window.addEventListener('pagehide', pauseAudio);
    window.addEventListener('beforeunload', pauseAudio);
    window.addEventListener('popstate', pauseAudio);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseAudio();
    });
  }

  function createPetal(container, index) {
    var petal = document.createElement('span');
    petal.className = 'wed9-petal';
    var left = 4 + Math.random() * 92;
    var duration = 18 + Math.random() * 14;
    var delay = -(Math.random() * duration);
    var drift = (Math.random() - 0.5) * 90;
    var spin = 180 + Math.random() * 380;
    var size = 8 + Math.random() * 8;
    var shade = PETAL_SHADES[index % PETAL_SHADES.length];
    petal.style.left = left + '%';
    petal.style.width = size + 'px';
    petal.style.height = (size * 1.15) + 'px';
    petal.style.background = shade;
    petal.style.setProperty('--petal-drift', drift.toFixed(1) + 'px');
    petal.style.setProperty('--petal-spin', spin.toFixed(0) + 'deg');
    petal.style.setProperty('--petal-opacity', (0.38 + Math.random() * 0.4).toFixed(2));
    petal.style.animationDuration = duration.toFixed(1) + 's';
    petal.style.animationDelay = delay.toFixed(1) + 's';
    container.appendChild(petal);
  }

  function startPetals() {
    if (petalsStarted) return;
    var container = document.getElementById('wed9-petals');
    if (!container || prefersReducedMotion) return;
    petalsStarted = true;
    container.classList.add('is-active');
    for (var i = 0; i < PETAL_COUNT; i++) {
      createPetal(container, i);
    }
  }

  function initScrollHintFade() {
    var hint = document.getElementById('wed9-scroll-hint');
    if (!hint || !scrollPage) return;
    scrollPage.addEventListener(
      'scroll',
      function () {
        hint.classList.toggle('is-hidden', scrollPage.scrollTop > 12);
      },
      { passive: true }
    );
  }

  function onSectionRevealed(el) {
    el.classList.add('is-visible');
  }

  function initScrollReveals() {
    var sections = document.querySelectorAll('.wed9-reveal');
    if (!sections.length || !scrollPage) return;
    if (!('IntersectionObserver' in window)) {
      sections.forEach(onSectionRevealed);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        onSectionRevealed(entry.target);
        observer.unobserve(entry.target);
      });
    }, { root: scrollPage, threshold: 0.18 });
    sections.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Card copy waits until the card crosses the middle of the screen. */
  function initCenterReveals() {
    var cards = document.querySelectorAll('.wed9-center-reveal');
    if (!cards.length || !scrollPage) return;
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (el) {
        el.classList.add('is-centered');
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-centered');
        observer.unobserve(entry.target);
      });
    }, { root: scrollPage, rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    cards.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Sections tagged wed9-full-reveal animate once they sit fully inside the viewport. */
  function initFullReveals() {
    var sections = document.querySelectorAll('.wed9-full-reveal');
    if (!sections.length) return;
    function reveal(el) {
      el.classList.add('is-revealed');
      if (el.id === 'wed9-quote') typeQuote();
    }

    if (!scrollPage || !('IntersectionObserver' in window)) {
      sections.forEach(reveal);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var bounds = entry.rootBounds;
        var fullyInView = entry.intersectionRatio >= 0.99;
        var fillsViewport = bounds && entry.intersectionRect.height >= bounds.height * 0.95;
        if (!fullyInView && !fillsViewport) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { root: scrollPage, threshold: [0.5, 0.75, 0.99, 1] });
    sections.forEach(function (el) {
      observer.observe(el);
    });
  }



  function buildFlyLetters(lineEl, options) {
    if (!lineEl) return;
    var text = (lineEl.getAttribute('data-full-text') || lineEl.textContent || '').trim();
    if (!text) return;
    lineEl.setAttribute('data-full-text', text);
    lineEl.innerHTML = '';
    lineEl.classList.add('wed9-fly-line');
    var chars = Array.from(text);
    chars.forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'wed9-fly-letter';
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      span.style.setProperty('--sx', options.fromX);
      var order = options.reverse ? chars.length - 1 - i : i;
      var delay = options.baseDelay + order * options.stepDelay;
      span.style.setProperty('--delay', delay.toFixed(0) + 'ms');
      lineEl.appendChild(span);
    });
  }

  function getMaxFlyDelayMs(container) {
    var maxDelayMs = 0;
    if (!container) return maxDelayMs;
    container.querySelectorAll('.wed9-fly-letter').forEach(function (letter) {
      var delay = parseFloat(letter.style.getPropertyValue('--delay') || '0ms');
      if (!isNaN(delay) && delay > maxDelayMs) maxDelayMs = delay;
    });
    return maxDelayMs;
  }

  function showLine(el, onDone) {
    if (!el) {
      if (onDone) onDone();
      return;
    }
    el.classList.remove('is-out');
    el.classList.add('is-in');
    setTimeout(function () {
      if (onDone) onDone();
    }, prefersReducedMotion ? 0 : LINE_IN_MS);
  }

  function hideLine(el, onDone) {
    if (!el) {
      if (onDone) onDone();
      return;
    }
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(function () {
      if (onDone) onDone();
    }, prefersReducedMotion ? 0 : LINE_OUT_MS);
  }

  function runHeroLetterIntro(onComplete) {
    if (!heroNames || !heroGroom || !heroBride) {
      if (onComplete) onComplete();
      return;
    }
    if (heroIntroStarted) {
      if (onComplete) onComplete();
      return;
    }
    heroIntroStarted = true;

    if (prefersReducedMotion) {
      heroGroom.textContent = heroGroom.getAttribute('data-full-text') || '';
      heroBride.textContent = heroBride.getAttribute('data-full-text') || '';
      heroNames.classList.add('wed9-fly-active');
      if (onComplete) onComplete();
      return;
    }

    if (isBrideFirst()) {
      buildFlyLetters(heroBride, {
        fromX: '-0.45em', baseDelay: 0, stepDelay: NAME_LETTER_STEP_MS
      });
      buildFlyLetters(heroGroom, {
        fromX: '0.45em', baseDelay: 0, stepDelay: NAME_LETTER_STEP_MS, reverse: true
      });
    } else {
      buildFlyLetters(heroGroom, {
        fromX: '-0.45em', baseDelay: 0, stepDelay: NAME_LETTER_STEP_MS
      });
      buildFlyLetters(heroBride, {
        fromX: '0.45em', baseDelay: 0, stepDelay: NAME_LETTER_STEP_MS, reverse: true
      });
    }

    var lettersDoneMs = getMaxFlyDelayMs(heroNames);
    if (heroAmp) heroAmp.style.setProperty('--delay', (lettersDoneMs + 260).toFixed(0) + 'ms');

    heroNames.classList.remove('wed9-fly-active');
    void heroNames.offsetWidth;
    heroNames.classList.add('wed9-fly-active');
    setTimeout(function () {
      if (onComplete) onComplete();
    }, lettersDoneMs + HERO_FLY_SETTLE_MS);
  }

  function startHeroSequence() {
    if (heroSequenceStarted) return;
    heroSequenceStarted = true;

    /* Hearts only follow the pointer once the letter is open and the hero shows. */
    initHeartTrail();

    var line1 = document.getElementById('wed9-hero-line-1');
    var love = document.getElementById('wed9-hero-love');

    function revealInvite() {
      if (heroInviteMsg) heroInviteMsg.classList.add('is-in');
      if (heroInvite) heroInvite.classList.add('is-in');
    }

    function finish() {
      if (heroFooter) heroFooter.classList.add('is-in');
      unlockHeroScroll();
    }

    if (prefersReducedMotion) {
      revealInvite();
      runHeroLetterIntro(finish);
      return;
    }

    showLine(love);
    showLine(line1, function () {
      hideLine(love);
      hideLine(line1, function () {
        revealInvite();
        runHeroLetterIntro(finish);
      });
    });
  }

  function prepareInvite() {
    if (invitePrepared || !sessionInvite) return;
    invitePrepared = true;
    sessionInvite.classList.add('is-active');
    sessionInvite.removeAttribute('aria-hidden');
    if (!DEV_SKIP_OPENING) lockHeroScroll();
    if (!scrollRevealsInit) {
      initScrollReveals();
      initCenterReveals();
      initFullReveals();
      initScrollHintFade();
      scrollRevealsInit = true;
    }
    if (!venueTabsBuilt) {
      buildVenueTabs();
      venueTabsBuilt = true;
    }
    startPetals();
    startCountdown();
    showMuteButton(true);
  }

  function hideOpeningSession() {
    if (!sessionOpening) return;
    sessionOpening.classList.remove('is-active', 'is-opening');
    sessionOpening.setAttribute('aria-hidden', 'true');
  }

  function startOpeningAnimation() {
    if (openingStarted) return;
    openingStarted = true;

    prepareInvite();
    startMusic();

    if (openBtn) {
      openBtn.classList.add('is-glowing');
      openBtn.setAttribute('disabled', 'true');
    }

    var timing = getOpeningTimingMs();
    var glowWait = prefersReducedMotion ? 0 : timing.sealGlow;
    setTimeout(function () {
      if (openBtn) {
        openBtn.classList.add('is-fading');
        openBtn.classList.remove('is-glowing');
      }
      if (sessionOpening) sessionOpening.classList.add('is-opening');
    }, glowWait);

    setTimeout(playHeroVideo, prefersReducedMotion ? 0 : timing.heroVideoStart);

    var doneWait = prefersReducedMotion ? 80 : glowWait + timing.openFlap + 80;
    setTimeout(function () {
      hideOpeningSession();
      startHeroSequence();
    }, doneWait);
  }

  /*
   * Freeze the shell at the height available on load. Mobile browsers grow the
   * viewport when their chrome collapses mid-scroll, which would otherwise
   * resize the opening flaps and hero while they animate.
   */
  function lockAppHeight() {
    var root = document.documentElement;
    var lastWidth = window.innerWidth;

    function apply() {
      var height = window.innerHeight || root.clientHeight || 0;
      if (height) root.style.setProperty('--wed9-app-height', height + 'px');
    }

    apply();

    window.addEventListener('orientationchange', function () {
      setTimeout(apply, 260);
    });

    window.addEventListener('resize', function () {
      if (Math.abs(window.innerWidth - lastWidth) < 40) return;
      lastWidth = window.innerWidth;
      apply();
    });
  }

  /* Soft ivory hearts that trail the pointer, bloom on taps and drift while scrolling. */
  function initHeartTrail() {
    if (heartTrailInit || prefersReducedMotion) return;
    heartTrailInit = true;

    var layer = document.createElement('div');
    layer.className = 'wed9-hearts';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    var live = 0;
    var lastMoveAt = 0;
    var lastX = 0;
    var lastY = 0;
    var lastScrollAt = 0;

    function spawnHeart(x, y, scale) {
      if (live >= HEART_MAX_LIVE) return;
      live += 1;
      var heart = document.createElement('span');
      heart.className = 'wed9-heart';
      heart.style.left = x + 'px';
      heart.style.top = y + 'px';
      heart.style.setProperty('--size', (HEART_MIN_SIZE + Math.random() * HEART_SIZE_RANGE) * scale + 'px');
      heart.style.setProperty('--dx', randomInRange(-18, 18).toFixed(0) + 'px');
      heart.style.setProperty('--dy', randomInRange(-36, -14).toFixed(0) + 'px');
      heart.style.setProperty('--tilt', randomInRange(-18, 18).toFixed(0) + 'deg');
      heart.style.setProperty('--tint', HEART_SHADES[Math.floor(Math.random() * HEART_SHADES.length)]);
      heart.style.animationDuration = randomInRange(0.65, 1).toFixed(2) + 's';
      heart.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 20.6C6.9 17.1 3 13.9 3 10.2 3 7.4 5.1 5.4 7.7 5.4c1.7 0 3.3.9 4.3 2.3 1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2 4.7 4.8 0 3.7-3.9 6.9-9 10.4z"/>' +
        '</svg>';
      heart.addEventListener('animationend', function () {
        live -= 1;
        heart.remove();
      });
      layer.appendChild(heart);
    }

    function maybeSpawnTrail(x, y) {
      var now = Date.now();
      var dx = x - lastX;
      var dy = y - lastY;
      if (now - lastMoveAt < HEART_TRAIL_GAP_MS && (dx * dx + dy * dy) < HEART_TRAIL_MIN_DIST * HEART_TRAIL_MIN_DIST) return;
      lastMoveAt = now;
      lastX = x;
      lastY = y;
      spawnHeart(x + randomInRange(-8, 8), y + randomInRange(-8, 8), 1);
    }

    document.addEventListener('pointermove', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      var touch = e.touches && e.touches[0];
      if (!touch) return;
      maybeSpawnTrail(touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('pointerdown', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
      for (var i = 0; i < HEART_BURST_COUNT; i++) {
        spawnHeart(e.clientX + randomInRange(-10, 10), e.clientY + randomInRange(-10, 10), 1);
      }
    }, { passive: true });

    function onScrollHearts() {
      var now = Date.now();
      if (now - lastScrollAt < HEART_SCROLL_GAP_MS) return;
      lastScrollAt = now;
      spawnHeart(randomInRange(0.12, 0.88) * window.innerWidth, window.innerHeight * randomInRange(0.62, 0.9), 0.9);
    }

    if (scrollPage) scrollPage.addEventListener('scroll', onScrollHearts, { passive: true });
    window.addEventListener('scroll', onScrollHearts, { passive: true });
  }

  function showOpeningSession() {
    if (!sessionOpening) return;
    sessionOpening.classList.add('is-active');
    sessionOpening.removeAttribute('aria-hidden');
  }

  /*
   * Showcase-only screen that lets a visitor pick the standard or premium set
   * of sessions before the letter opens. Client pages omit data-variant-picker
   * and keep whatever data-variant they ship with.
   */
  function initVariantPicker() {
    var picker = document.getElementById('wed9-session-choose');
    if (!picker || getAttr('data-variant-picker', '') !== 'true') {
      if (picker && picker.parentNode) picker.parentNode.removeChild(picker);
      showOpeningSession();
      return false;
    }

    picker.classList.add('is-active');
    picker.removeAttribute('aria-hidden');
    if (sessionOpening) {
      sessionOpening.classList.remove('is-active');
      sessionOpening.setAttribute('aria-hidden', 'true');
    }

    function applyVariantSections() {
      hydrateQuote();
      hydratePhotos();
      hydrateContact();
      initWishes();
    }

    var chosen = false;

    function choose(variant) {
      if (chosen) return;
      chosen = true;
      if (variant === 'premium') body.setAttribute('data-variant', 'premium');
      else body.removeAttribute('data-variant');
      applyVariantSections();

      /* Reveal the sealed letter first so the hero video never flashes through
         while the chooser fades out. */
      showOpeningSession();
      picker.classList.add('is-leaving');
      setTimeout(function () {
        picker.classList.remove('is-active', 'is-leaving');
        picker.setAttribute('aria-hidden', 'true');
      }, prefersReducedMotion ? 0 : 450);
    }

    var buttons = picker.querySelectorAll('[data-variant-choice]');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          choose(btn.getAttribute('data-variant-choice'));
        });
      })(buttons[i]);
    }

    return true;
  }

  function setOpeningLoaderProgress(value) {
    openingLoaderProgress = Math.max(0, Math.min(100, value));
    if (openingLoaderFill) {
      openingLoaderFill.style.width = openingLoaderProgress.toFixed(0) + '%';
    }
  }

  function startOpeningLoader() {
    if (!openingLoader || openingAssetsReady) return;
    if (openingLoaderTimer) clearInterval(openingLoaderTimer);
    setOpeningLoaderProgress(8);
    openingLoader.classList.remove('is-hidden');
    openingLoader.setAttribute('aria-busy', 'true');
    openingLoaderTimer = setInterval(function () {
      if (openingAssetsReady) {
        clearInterval(openingLoaderTimer);
        openingLoaderTimer = null;
        return;
      }
      if (openingLoaderProgress < 88) {
        setOpeningLoaderProgress(openingLoaderProgress + randomInRange(3, 9));
      }
    }, 260);
  }

  function hideOpeningLoader() {
    if (openingLoaderTimer) {
      clearInterval(openingLoaderTimer);
      openingLoaderTimer = null;
    }
    setOpeningLoaderProgress(100);
    if (!openingLoader) return;
    openingLoader.classList.add('is-hidden');
    openingLoader.setAttribute('aria-busy', 'false');
  }

  function openingAssetUrl(img) {
    if (!img) return '';
    var src = img.getAttribute('src') || img.currentSrc || '';
    if (src) return src;
    var path = img.getAttribute('data-storage-path');
    var token = img.getAttribute('data-token');
    if (path && token) return firebaseAssetUrl({ path: path, token: token });
    return '';
  }

  function preloadImage(url) {
    return new Promise(function (resolve) {
      if (!url) {
        resolve();
        return;
      }
      var img = new Image();
      var done = function () { resolve(); };
      img.onload = function () {
        if (typeof img.decode === 'function') {
          img.decode().then(done).catch(done);
        } else {
          done();
        }
      };
      img.onerror = done;
      img.src = url;
    });
  }

  function preloadVideo(video) {
    return new Promise(function (resolve) {
      if (!video) {
        resolve();
        return;
      }
      if (video.readyState >= 3) {
        resolve();
        return;
      }
      var settled = false;
      var done = function () {
        if (settled) return;
        settled = true;
        video.removeEventListener('canplaythrough', done);
        video.removeEventListener('loadeddata', done);
        video.removeEventListener('error', done);
        resolve();
      };
      video.addEventListener('canplaythrough', done);
      video.addEventListener('loadeddata', done);
      video.addEventListener('error', done);
      try {
        video.preload = 'auto';
        if (typeof video.load === 'function') video.load();
      } catch (err) { /* ignore */ }
      if (video.readyState >= 3) done();
    });
  }

  function markOpeningAssetsReady() {
    if (openingAssetsReady) return;
    openingAssetsReady = true;
    hideOpeningLoader();
  }

  /* Cache envelope flaps, seal, and swan hero video before the letter is shown. */
  function preloadOpeningAssets() {
    startOpeningLoader();

    var seen = {};
    var jobs = [];
    var nodes = document.querySelectorAll('.wed9-flap img, .wed9-seal-img');
    for (var i = 0; i < nodes.length; i++) {
      var url = openingAssetUrl(nodes[i]);
      if (!url || seen[url]) continue;
      seen[url] = true;
      jobs.push(preloadImage(url));
    }
    if (heroVideo && (heroVideo.getAttribute('src') || heroVideo.currentSrc)) {
      jobs.push(preloadVideo(heroVideo));
    }

    if (!jobs.length) {
      markOpeningAssetsReady();
      return;
    }

    var pending = jobs.length;
    var finished = false;
    var safety = setTimeout(function () {
      if (!finished) markOpeningAssetsReady();
    }, 18000);

    function onOne() {
      pending -= 1;
      if (pending > 0) {
        setOpeningLoaderProgress(Math.min(88, 12 + ((jobs.length - pending) / jobs.length) * 70));
        return;
      }
      finished = true;
      clearTimeout(safety);
      markOpeningAssetsReady();
    }

    jobs.forEach(function (job) {
      Promise.resolve(job).then(onOne);
    });
  }

  function initOpening() {
    if (!openBtn) return;
    openBtn.addEventListener('click', startOpeningAnimation);
    openBtn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startOpeningAnimation();
      }
    });
  }

  lockAppHeight();
  hydrate();
  runFirebaseInit();
  initMute();
  initWishes();
  initVariantPicker();

  if (DEV_SKIP_OPENING) {
    hideOpeningLoader();
    hideOpeningSession();
    prepareInvite();
    unlockHeroScroll();
    playHeroVideo();
    startHeroSequence();
  } else {
    initOpening();
    holdHeroVideoAtStart();
    lockHeroScroll();
    preloadOpeningAssets();
  }
})();
