
// Build dim overlay
let siteDim = document.querySelector('.site-dim');
if(!siteDim){
  siteDim = document.createElement('div');
  siteDim.className = 'site-dim';
  document.body.appendChild(siteDim);
}

// Menu toggle
const cubes = document.getElementById('menuCubes');
const panel = document.getElementById('rightPanel');
const backdrop = document.getElementById('bookingModal');
const modalForm = backdrop ? backdrop.querySelector('form[data-booking-form]') : null;
if (cubes && panel){
  const toggle = () => {
    cubes.classList.toggle('active');
    panel.classList.toggle('open');
    const opened = panel.classList.contains('open');
    panel.setAttribute('aria-hidden', !opened);
    document.body.classList.toggle('menu-open', opened);
    siteDim.classList.toggle('open', opened);
  };
  cubes.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
  cubes.addEventListener('keypress', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }});
  siteDim.addEventListener('click', ()=>{ if(panel.classList.contains('open')) toggle(); });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset(), behavior:'smooth'});
    }
  });
});

const bookingSection = document.getElementById('booking-inline');
const inlineForm = bookingSection ? bookingSection.querySelector('form[data-booking-form]') : null;
const isMobileViewport = () => window.matchMedia('(max-width: 768px)').matches;

const closePanel = () => {
  if(panel && panel.classList.contains('open')){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    if(cubes) cubes.classList.remove('active');
    if(siteDim) siteDim.classList.remove('open');
  }
};

if(panel){
  panel.querySelectorAll('[data-close-panel]').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      closePanel();
    });
  });

  panel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', ()=>{
      closePanel();
    });
  });
}

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    closePanel();
  }
});

const setSourceValue = (formEl, value) => {
  if(!formEl) return;
  const sourceField = formEl.querySelector('[data-booking-source]');
  if(sourceField) sourceField.value = value;
};

const updateStatus = (field, message, ttl) => {
  if(!field) return;
  field.textContent = message || '';
  if(field._statusTimer){
    clearTimeout(field._statusTimer);
    field._statusTimer = null;
  }
  if(message && ttl && ttl > 0){
    field._statusTimer = setTimeout(()=>{
      field.textContent = '';
      field._statusTimer = null;
    }, ttl);
  }
};

const scrollToSection = (el) => {
  if(!el) return;
  const offset = window.innerWidth <= 640 ? 72 : 90;
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(0, top), behavior:'smooth'});
};

const focusFirstField = (formEl) => {
  if(!formEl) return;
  const focusable = formEl.querySelector('input:not([type="hidden"]), select, textarea');
  if(focusable){
    setTimeout(()=> focusable.focus({ preventScroll: true }), 400);
  }
};

const closeModal = () => {
  if(!backdrop) return;
  backdrop.classList.remove('open');
  document.body.classList.remove('booking-open');
};

const openModal = (subject) => {
  if(!backdrop) return;
  setSourceValue(modalForm, subject);
  backdrop.classList.add('open');
  document.body.classList.add('booking-open');
  closePanel();
};

document.querySelectorAll('[data-open-booking]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const subject = btn.dataset.subject || 'Заявка';
    if(isMobileViewport() && bookingSection && inlineForm){
      closeModal();
      setSourceValue(inlineForm, subject);
      closePanel();
      scrollToSection(bookingSection);
      focusFirstField(inlineForm);
      return;
    }
    openModal(subject);
  });
});

document.querySelectorAll('[data-close-modal]').forEach(btn=> btn.addEventListener('click', closeModal));
if (backdrop){
  backdrop.addEventListener('click', (e)=>{
    if(e.target === backdrop) closeModal();
  });
}

const bookingForms = Array.from(document.querySelectorAll('form[data-booking-form]'));
bookingForms.forEach(formEl => {
  const statusField = formEl.querySelector('[data-booking-status]');
  formEl.addEventListener('submit', async (e)=>{
    e.preventDefault();
    updateStatus(statusField, 'Отправляем...', 0);
    const formAction = formEl.getAttribute('action') || 'send.php';
    const formMethod = (formEl.getAttribute('method') || 'POST').toUpperCase();
    const data = new FormData(formEl);
    try{
      const res = await fetch(formAction, { method: formMethod, body: data });
      let json = null;
      try{
        json = await res.json();
      } catch(err){
        json = null;
      }
      if(json && json.success){
        updateStatus(statusField, 'Готово! Заявка отправлена. Мы свяжемся с вами.', 8000);
        formEl.reset();
      } else {
        let errorMessage = 'Не удалось отправить заявку. Попробуйте немного позже или напишите на dyardgrupp@gmail.com';
        if(json && json.error){
          if(json.error === 'required'){
            errorMessage = 'Пожалуйста, заполните обязательные поля формы.';
          } else if(json.error === 'send'){
            errorMessage = 'Сервер не смог доставить письмо. Напишите нам на dyardgrupp@gmail.com.';
          }
        }
        updateStatus(statusField, errorMessage, 10000);
      }
    } catch(err){
      updateStatus(statusField, 'Сервер недоступен. Попробуйте ещё раз или напишите на dyardgrupp@gmail.com', 10000);
    }
  });
});

// Gallery
const gal = document.getElementById('gallery');
if(gal){
  if(gal.dataset.swipeBound){ /* already bound elsewhere */ } else { gal.dataset.swipeBound = '1'; }
  const vp = gal.querySelector('.viewport');
  if(vp){
    const slides = vp.children.length;
    let i = 0;
    const update = ()=>{ vp.style.transition = 'transform .35s ease'; vp.style.transform = `translateX(-${i*100}%)`; };
    const jump = (dir)=>{ i = (i + dir + slides) % slides; update(); };

    const prevBtn = gal.querySelector('[data-gal-prev]');
    const nextBtn = gal.querySelector('[data-gal-next]');
    if(prevBtn) prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(-1); });
    if(nextBtn) nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(1); });

    let startX = 0, dx = 0, dragging = false, suppressClickUntil = 0;
    let wheelAccum = 0;
    let wheelEngaged = false;
    let wheelTimer = null;
    let touchActive = false;
    let touchResetTimer = null;
    const queueTouchReset = () => {
      clearTimeout(touchResetTimer);
      touchResetTimer = setTimeout(()=>{ touchActive = false; }, 80);
    };
    const down = (x)=>{ startX = x; dragging = true; vp.style.transition = 'none'; };
    const move = (x)=>{ if(!dragging) return; dx = x - startX; vp.style.transform = `translateX(calc(-${i*100}% + ${dx}px))`; };
    const up = ()=>{
      if(!dragging) return;
      dragging = false;
      if(Math.abs(dx) > 50){
        jump(dx < 0 ? 1 : -1);
        suppressClickUntil = Date.now() + 500;
      } else {
        update();
      }
      dx = 0;
    };

    // Touch
    vp.addEventListener('touchstart', (e)=>{ touchActive = true; clearTimeout(touchResetTimer); down(e.touches[0].clientX); }, {passive:true});
    vp.addEventListener('touchmove', (e)=>{ if(!dragging) return; e.preventDefault(); move(e.touches[0].clientX); }, {passive:false});
    vp.addEventListener('touchend', ()=>{ up(); queueTouchReset(); });
    vp.addEventListener('touchcancel', ()=>{
      if(!dragging){ queueTouchReset(); return; }
      dragging = false;
      dx = 0;
      update();
      queueTouchReset();
    });

    // Mouse drag
    vp.addEventListener('mousedown', (e)=>{ if(touchActive || e.button!==0) return; down(e.clientX); });
    window.addEventListener('mousemove', (e)=>{ move(e.clientX); });
    window.addEventListener('mouseup', up);

    // Suppress click after drag
    gal.addEventListener('click', (e)=>{ if(Date.now() < suppressClickUntil){ e.stopPropagation(); e.preventDefault(); } }, true);

    // Trackpad wheel support (single step per gesture)
    gal.addEventListener('wheel', (e)=>{
      if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if(!wheelEngaged){
        wheelAccum += e.deltaX;
        const threshold = 80;
        if(Math.abs(wheelAccum) > threshold){
          jump(wheelAccum > 0 ? 1 : -1);
          wheelEngaged = true;
          wheelAccum = 0;
        }
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(()=>{
        wheelEngaged = false;
        wheelAccum = 0;
      }, 220);
    }, { passive: false });
  }
}
// Mini galleries per card
document.querySelectorAll('.mini-gallery').forEach(g=>{
  const vp = g.querySelector('.mg-viewport');
  if(!vp) return;
  const slides = vp.children.length;
  let idx = 0;
  const update = ()=>{ vp.style.transition = 'transform .35s ease'; vp.style.transform = `translateX(-${idx*100}%)`; };
  const jump = (dir)=>{ idx = (idx + dir + slides) % slides; update(); };

  const prev = g.querySelector('[data-mg-prev]');
  const next = g.querySelector('[data-mg-next]');
  if(prev) prev.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(-1); });
  if(next) next.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); jump(1); });

  let startX=0, dx=0, dragging=false, suppressClickUntil=0;
  let wheelAccum = 0;
  let wheelEngaged = false;
  let wheelTimer = null;
  let touchActive = false;
  let touchResetTimer = null;
  const queueTouchReset = () => {
    clearTimeout(touchResetTimer);
    touchResetTimer = setTimeout(()=>{ touchActive = false; }, 80);
  };
  const down = (x)=>{ startX=x; dragging=true; vp.style.transition='none'; g.style.cursor='grabbing'; };
  const move = (x)=>{ if(!dragging) return; dx=x-startX; vp.style.transform = `translateX(calc(-${idx*100}% + ${dx}px))`; };
  const up = ()=>{
    if(!dragging) return;
    dragging=false; g.style.cursor='';
    if(Math.abs(dx)>50){
      jump(dx<0?1:-1);
      suppressClickUntil = Date.now() + 500;
    } else {
      update();
    }
    dx=0;
  };

  // Touch
  g.addEventListener('touchstart', (e)=>{ touchActive = true; clearTimeout(touchResetTimer); down(e.touches[0].clientX); }, {passive:true});
  g.addEventListener('touchmove', (e)=>{ if(!dragging) return; e.preventDefault(); move(e.touches[0].clientX); }, {passive:false});
  g.addEventListener('touchend', ()=>{ up(); queueTouchReset(); });
  g.addEventListener('touchcancel', ()=>{
    if(!dragging){ queueTouchReset(); return; }
    dragging=false;
    g.style.cursor='';
    dx=0;
    update();
    queueTouchReset();
  });

  // Mouse drag
  g.addEventListener('mousedown', (e)=>{ if(touchActive || e.button!==0) return; down(e.clientX); });
  window.addEventListener('mousemove', (e)=>{ move(e.clientX); });
  window.addEventListener('mouseup', up);

  // Suppress click after drag
  g.addEventListener('click', (e)=>{ if(Date.now() < suppressClickUntil){ e.stopPropagation(); e.preventDefault(); } }, true);

  // Trackpad wheel support (single step per gesture)
  g.addEventListener('wheel', (e)=>{
    if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if(!wheelEngaged){
      wheelAccum += e.deltaX;
      const threshold = 80;
      if(Math.abs(wheelAccum) > threshold){
        jump(wheelAccum > 0 ? 1 : -1);
        wheelEngaged = true;
        wheelAccum = 0;
      }
    }
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(()=>{
      wheelEngaged = false;
      wheelAccum = 0;
    }, 220);
  }, { passive: false });
});



// iOS-inspired glass theme toggle (click + drag)
(function(){
  const toggle = document.getElementById('themeToggle');
  if(!toggle) return;

  const thumb = toggle.querySelector('.theme-toggle__thumb');
  const sr = toggle.querySelector('.theme-toggle__sr');
  const docEl = document.documentElement;
  const prefersMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  let progress = 0;
  let dragging = false;
  let activePointer = null;
  let suppressClick = false;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const setProgress = (value) => {
    progress = clamp(value);
    toggle.style.setProperty('--tt-progress', progress.toFixed(4));
    return progress;
  };

  const refreshSr = (theme) => {
    if(!sr) return;
    sr.textContent = theme === 'light' ? 'Светлая тема' : 'Тёмная тема';
  };

  const applyTheme = (theme, options = {}) => {
    const { persist = true } = options;
    const isLight = theme === 'light';
    document.body.classList.toggle('theme-light', isLight);
    docEl.setAttribute('data-theme', isLight ? 'light' : 'dark');
    toggle.dataset.state = isLight ? 'light' : 'dark';
    toggle.setAttribute('aria-checked', isLight ? 'true' : 'false');
    refreshSr(theme);
    setProgress(isLight ? 1 : 0);
    if(persist){
      try{ localStorage.setItem('theme', theme); }catch(e){}
    }
  };

  const readStoredTheme = () => {
    try{ return localStorage.getItem('theme'); }
    catch(e){ return null; }
  };

  const resolveInitialTheme = () => {
    const stored = readStoredTheme();
    if(stored) return { theme: stored, persist: true };
    const prefers = prefersMq && prefersMq.matches ? 'light' : 'dark';
    return { theme: prefers, persist: false };
  };

  const { theme: initialTheme, persist: initialPersist } = resolveInitialTheme();
  applyTheme(initialTheme, { persist: initialPersist });

  if(prefersMq){
    prefersMq.addEventListener('change', (event)=>{
      if(readStoredTheme()) return;
      applyTheme(event.matches ? 'light' : 'dark', { persist: false });
    });
  }

  const toggleTheme = () => {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    applyTheme(next);
  };

  const updateProgressFromClientX = (clientX) => {
    if(clientX == null) return progress;
    const rect = toggle.getBoundingClientRect();
    const styles = getComputedStyle(toggle);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padRight = parseFloat(styles.paddingRight) || 0;
    const thumbRect = thumb.getBoundingClientRect();
    const start = rect.left + padLeft + thumbRect.width / 2;
    const end = rect.right - padRight - thumbRect.width / 2;
    if(end <= start){
      return setProgress(progress);
    }
    return setProgress((clientX - start) / (end - start));
  };

  const endDrag = (clientX) => {
    if(!dragging) return;
    if(clientX != null) updateProgressFromClientX(clientX);
    dragging = false;
    toggle.classList.remove('is-dragging');
    if(activePointer !== null){
      try{ toggle.releasePointerCapture(activePointer); }catch(e){}
    }
    activePointer = null;
    const nextTheme = progress >= 0.5 ? 'light' : 'dark';
    applyTheme(nextTheme);
    setTimeout(()=>{ suppressClick = false; }, 0);
  };

  toggle.addEventListener('pointerdown', (event)=>{
    if(event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick = true;
    dragging = true;
    activePointer = event.pointerId;
    toggle.classList.add('is-dragging');
    try{ toggle.setPointerCapture(activePointer); }catch(e){}
    if(event.pointerType === 'touch') event.preventDefault();
    toggle.focus({ preventScroll: true });
    updateProgressFromClientX(event.clientX);
  }, {passive:false});

  toggle.addEventListener('pointermove', (event)=>{
    if(!dragging || event.pointerId !== activePointer) return;
    updateProgressFromClientX(event.clientX);
  });

  toggle.addEventListener('pointerup', (event)=>{
    if(event.pointerId !== activePointer) return;
    endDrag(event.clientX);
  });

  toggle.addEventListener('pointercancel', (event)=>{
    if(event.pointerId !== activePointer) return;
    endDrag(event.clientX);
  });

  toggle.addEventListener('lostpointercapture', ()=>{
    if(!dragging) return;
    endDrag();
  });

  toggle.addEventListener('click', (event)=>{
    if(suppressClick){
      event.preventDefault();
      suppressClick = false;
      return;
    }
    toggleTheme();
  });

  toggle.addEventListener('keydown', (event)=>{
    if(event.key === 'ArrowLeft'){
      event.preventDefault();
      applyTheme('dark');
    } else if(event.key === 'ArrowRight'){
      event.preventDefault();
      applyTheme('light');
    } else if(event.key === ' ' || event.key === 'Enter'){
      event.preventDefault();
      toggleTheme();
    }
  });
})();



// === Contact FAB ===
(function(){
  function init(){
    const fab = document.getElementById('contactFab');
    if(!fab || fab.dataset.fabInit==="1") return;
    fab.dataset.fabInit="1";
    const btn = fab.querySelector('.contact-fab__btn');
    const menu = fab.querySelector('.contact-fab__menu');
    const closeBtn = fab.querySelector('.fab-item--close');
    const open = ()=>{ fab.classList.add('open'); fab.setAttribute('aria-expanded','true'); if(menu) menu.setAttribute('aria-hidden','false'); };
    const close = ()=>{ fab.classList.remove('open'); fab.setAttribute('aria-expanded','false'); if(menu) menu.setAttribute('aria-hidden','true'); };
    if(btn){ btn.addEventListener('click', (e)=>{ e.preventDefault(); fab.classList.contains('open') ? close() : open(); }); }
    if(closeBtn){ closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); close(); }); }
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
    document.addEventListener('click', (e)=>{ if(!fab.contains(e.target) && fab.classList.contains('open')) close(); });
    fab.querySelectorAll('a.fab-item').forEach(a=> a.addEventListener('click', ()=> setTimeout(close, 100)));
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();

// ==========================================================
// Mobile-only CTA label shortening (Conference hall page)
// Renames "Смотреть тарифы" -> "Тарифы" and
// "Забронировать дату" -> "Забронировать" on small screens.
// ==========================================================
(function(){
  const isConferencePage = /Конференц|conference/i.test(document.title) || /conference/i.test(location.pathname);
  if(!isConferencePage) return;

  const apply = () => {
    const isMobile = window.matchMedia('(max-width: 520px)').matches;
    const btns = document.querySelectorAll('.hero-banner .cta .glass-btn');
    btns.forEach(btn => {
      const txt = (btn.textContent || '').trim();
      if(!btn.dataset.long){
        btn.dataset.long = txt;
        if(/Смотреть тарифы/i.test(txt)) btn.dataset.short = 'Тарифы';
        if(/Забронировать дату/i.test(txt)) btn.dataset.short = 'Забронировать';
      }
      if(btn.dataset.short){
        btn.textContent = isMobile ? btn.dataset.short : btn.dataset.long;
      }
    });
  };
  // Run on load & update on viewport changes
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply);
  }else{
    apply();
  }
  window.addEventListener('resize', apply, { passive: true });
  window.addEventListener('orientationchange', apply);
})();


/* === Fixed header: dynamic offset === */
const getHeaderOffset = () => {
  const h = document.querySelector('.site-header');
  return h ? Math.max(0, h.offsetHeight) : 90;
};
const applyHeaderOffset = () => {
  document.documentElement.style.setProperty('--header-offset', getHeaderOffset() + 'px');
};
window.addEventListener('load', applyHeaderOffset);
window.addEventListener('resize', ()=> setTimeout(applyHeaderOffset, 50));
window.addEventListener('orientationchange', ()=> setTimeout(applyHeaderOffset, 150));
document.addEventListener('DOMContentLoaded', applyHeaderOffset);


// Apple-like mobile nav (2025-09-30)
(function(){
  const docEl = document.documentElement;
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.topbar__burger');
  const scrim = document.getElementById('mobileNavScrim');
  const panel = document.getElementById('mobileNav');
  const list = panel ? panel.querySelector('.mobile-nav__list') : null;
  const closeInside = panel ? panel.querySelector('.mobile-nav__close') : null;

  if(!header || !burger || !panel || !list) return;

  // Keep overlay aligned under header
  function setHeaderOffset(){
    const h = header.offsetHeight || 56;
    document.documentElement.style.setProperty('--header-offset', h + 'px');
  }
  setHeaderOffset();
  window.addEventListener('resize', setHeaderOffset);

  // Clone desktop nav links into mobile menu to keep in sync
  function populate(){
    const links = document.querySelectorAll('.topbar__nav .topbar__link');
    list.innerHTML = '';
    links.forEach(a => {
      const li = document.createElement('li');
      const m = document.createElement('a');
      m.className = 'mobile-nav__link';
      m.href = a.getAttribute('href') || '#';
      m.textContent = a.textContent.trim();
      li.appendChild(m);
      list.appendChild(li);
    });
  }
  populate();

  function open(){
    docEl.classList.add('is-menu-open');
    burger.setAttribute('aria-expanded','true');
    burger.setAttribute('aria-label','Закрыть меню');
    panel.hidden = false; scrim.hidden = false;
    panel.focus({preventScroll:true});
  }
  function close(){
    docEl.classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-label','Открыть меню');
    // Defer hiding until transitions end for smoother close
    setTimeout(()=>{ panel.hidden = true; scrim.hidden = true; }, 240);
  }
  function toggle(){ (docEl.classList.contains('is-menu-open') ? close : open)(); }

  burger.addEventListener('click', toggle);
  if (closeInside) closeInside.addEventListener('click', close);
  if (scrim) scrim.addEventListener('click', close);
  panel.addEventListener('click', (e)=>{
    const a = e.target.closest('a.mobile-nav__link');
    if (a){ close(); }
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') close();
  });
})();

// === Mobile Photo Gallery: turn #photo-gallery grid into a continuous, smooth carousel on small screens ===
(function(){
  /**
   * Build a mobile-only carousel under #photo-gallery and animate it continuously.
   * No "slide-by-slide" stops — constant linear motion via requestAnimationFrame.
   * Pauses on user drag; resumes automatically after interaction.
   */
  function initContinuousCarousel(rootEl){
    if(!rootEl) return;
    if(rootEl.dataset.pgInit === "1") return;
    rootEl.dataset.pgInit = "1";

    var vp = rootEl.querySelector('.viewport');
    if(!vp) return;

    // Collect slides and duplicate the whole set once for seamless wrap
    var slides = Array.prototype.slice.call(vp.querySelectorAll('.slide'));
    if(!slides.length) return;
    var originalCount = slides.length;

    // Append a full clone set to allow continuous loop
    var frag = document.createDocumentFragment();
    slides.forEach(function(sl){ frag.appendChild(sl.cloneNode(true)); });
    vp.appendChild(frag);

    // State
    var x = 0;                         // current translateX in px
    var speed = 48;                    // px per second (tweakable)
    var rafId = null;
    var lastT = 0;
    var paused = false;
    var dragging = false;
    var startX = 0;
    var grabbedX = 0;
    var suppressClickUntil = 0;

    // Compute width of one logical set (N slides * viewport width each)
    function setWidth(){
      return rootEl.clientWidth * originalCount;
    }

    function wrap(){
      var w = setWidth();
      if(w <= 0) return;
      while(x <= -w) x += w;
      while(x > 0)   x -= w;
    }

    function apply(){
      vp.style.transform = 'translate3d(' + x + 'px,0,0)';
    }

    function step(t){
      if(!lastT) lastT = t;
      var dt = Math.min(40, t - lastT); // clamp for background tabs
      lastT = t;
      if(!paused && !dragging){
        x -= speed * (dt / 1000);
        wrap();
        apply();
      }
      rafId = window.requestAnimationFrame(step);
    }

    // Kick off
    vp.style.transition = 'none';
    apply();
    rafId = window.requestAnimationFrame(step);

    // Handle tab visibility
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ paused = true; }
      else { paused = false; lastT = 0; }
    });

    // Handle resize/orientation (keep motion continuous)
    var resizeTimer = null;
    function onResize(){
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function(){ wrap(); apply(); }, 80);
    }
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // Interaction: drag to scrub; resume afterwards
    function down(clientX){
      dragging = true;
      startX = clientX;
      grabbedX = x;
      paused = true;
    }
    function move(clientX){
      if(!dragging) return;
      var dx = clientX - startX;
      x = grabbedX + dx;
      wrap();
      apply();
    }
    function up(){
      if(!dragging) return;
      dragging = false;
      paused = false;
      suppressClickUntil = Date.now() + 350;
    }

    rootEl.addEventListener('mousedown', function(e){ if(e.button !== 0) return; down(e.clientX); });
    window.addEventListener('mousemove', function(e){ move(e.clientX); });
    window.addEventListener('mouseup', up);

    rootEl.addEventListener('touchstart', function(e){
      if(!e.touches || !e.touches[0]) return;
      down(e.touches[0].clientX);
    }, { passive: true });

    rootEl.addEventListener('touchmove', function(e){
      if(!dragging) return;
      e.preventDefault();
      move(e.touches[0].clientX);
    }, { passive: false });

    rootEl.addEventListener('touchend', function(){ up(); }, { passive: true });

    // Suppress clicks immediately after drag
    rootEl.addEventListener('click', function(e){
      if(Date.now() < suppressClickUntil){
        e.preventDefault(); e.stopPropagation();
      }
    }, true);
  }

  function buildMobilePhotoCarousel(){
    var section = document.getElementById('photo-gallery');
    if(!section) return;

    // Remove any legacy version to prevent duplicates
    var legacy = section.querySelector('.photo-gallery-carousel');
    if(legacy) legacy.remove();

    var grid = section.querySelector('.apple-gallery__grid');
    if(!grid) return;
    var imgs = Array.prototype.slice.call(grid.querySelectorAll('img.apple-gallery__img'));
    if(!imgs.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'gallery photo-gallery-carousel';
    wrap.id = 'photo-gallery-mobile';

    var vp = document.createElement('div');
    vp.className = 'viewport';

    imgs.forEach(function(img){
      var fig = document.createElement('figure');
      fig.className = 'slide';
      var clone = img.cloneNode(true);
      clone.removeAttribute('loading');
      fig.appendChild(clone);
      vp.appendChild(fig);
    });
    wrap.appendChild(vp);

    grid.parentNode.insertBefore(wrap, grid.nextSibling);
    initContinuousCarousel(wrap);
  }

  function destroyMobilePhotoCarousel(){
    var section = document.getElementById('photo-gallery');
    if(!section) return;
    var g = section.querySelector('.photo-gallery-carousel');
    if(g) g.remove();
  }

  // Only on small screens
  var mq = window.matchMedia('(max-width: 560px)');
  function apply(e){
    if(e.matches) buildMobilePhotoCarousel();
    else destroyMobilePhotoCarousel();
  }
  apply(mq);
  if(mq.addEventListener){ mq.addEventListener('change', apply); }
  else if(mq.addListener){ mq.addListener(apply); } // Safari fallback
})();


// --- Ensure external hero CTA sits right under the hero-banner (robust, DOM-ready + observer) ---
(function(){
  function ensurePlacement(){
    var root = document.querySelector('body.page-conference, body.page-coworking');
    if(!root) return false;
    var hero = root.querySelector('.hero-banner');
    var cta  = root.querySelector('.hero-cta');
    if(!hero || !cta) return false;
    var next = hero.nextElementSibling;
    if(next !== cta){
      hero.insertAdjacentElement('afterend', cta);
      return true;
    }
    return true;
  }

  function onReady(fn){
    if(document.readyState === 'complete' || document.readyState === 'interactive'){
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    }
  }

  onReady(function(){
    ensurePlacement();
    // Observe future DOM changes (e.g., async renders) for a short time
    var root = document.body;
    var tries = 0;
    var obs = new MutationObserver(function(){
      tries++;
      var ok = ensurePlacement();
      if(ok || tries > 20){ // stop after success or after ~20 mutations
        obs.disconnect();
      }
    });
    obs.observe(root, { childList: true, subtree: true });
    // As a safety, also re-run on window load
    window.addEventListener('load', ensurePlacement, { once: true });
  });
})();


// [Injected 2025-10-02] Build brand block under mobile menu
(function(){
  try{
    var panel = document.getElementById('mobileNav');
    if(!panel) return;
    var nav = panel.querySelector('.mobile-nav__nav');
    if(!nav) return;
    if(panel.querySelector('#mobileNavBrand')) return; // avoid duplicates
    var brand = document.createElement('div');
    brand.id = 'mobileNavBrand';
    brand.className = 'mobile-nav__brand';
    brand.innerHTML = '<img class="mobile-nav__brand-logo" src="assets/icons/logo-icon-green.svg" alt="Telegraph" aria-hidden="true" />'
      + '<div class="mobile-nav__brand-name">Telegraph</div>'
      + '<div class="mobile-nav__brand-tagline">Коворкинг &amp; конференц-зал</div>';
    nav.insertAdjacentElement('afterend', brand);
  }catch(e){ /* silent */ }
})();

// [Injected 2025-10-02 v2] Make brand block a link to home
(function(){
  try{
    var panel = document.getElementById('mobileNav');
    if(!panel) return;
    var brand = panel.querySelector('#mobileNavBrand');
    var nav = panel.querySelector('.mobile-nav__nav');
    if(!brand && nav) {
      // if previous injection didn't run yet, create the brand container
      brand = document.createElement('div');
      brand.id = 'mobileNavBrand';
      brand.className = 'mobile-nav__brand';
      nav.insertAdjacentElement('afterend', brand);
    }
    if(!brand) return;
    // Build anchor with logo + text
    var html = ''
      + '<a href="index.html" class="mobile-nav__brand-link" aria-label="На главную">'
      +   '<img class="mobile-nav__brand-logo" src="assets/icons/logo-icon.svg" alt="Telegraph" aria-hidden="true" />'
      +   '<div class="mobile-nav__brand-name">Telegraph</div>'
      +   '<div class="mobile-nav__brand-tagline">Коворкинг &amp; конференц-зал</div>'
      + '</a>';
    brand.innerHTML = html;
  }catch(e){ /* silent */ }
})();
