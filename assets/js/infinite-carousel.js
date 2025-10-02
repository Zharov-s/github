/*! Telegraph — InfiniteCarousel (bugfix: correct wrapping during swipe/trackpad) */
(function(){
  'use strict';

  var PATH_PREFIX = 'assets/img/carousel/';
  var FILENAMES = ['01.jpg','02.jpg','03.jpg','04.jpg','05.jpg','06.jpg','07.jpg','08.jpg','09.jpg','10.jpg'];

  function defineComponent(React){
    var useRef = React.useRef;
    var useMemo = React.useMemo;
    var useEffect = React.useEffect;
    var useLayoutEffect = React.useLayoutEffect;

    function parseGapPx(el){
      try{
        var cs = getComputedStyle(el);
        var g = cs.gap || cs.columnGap || '0px';
        return parseFloat(g) || 0;
      }catch(e){ return 0; }
    }
    function wrapX(x, bw){
      if(!bw || bw<=0) return x;
      while(x <= -bw) x += bw;
      while(x > 0) x -= bw;
      return x;
    }

    function InfiniteCarousel(props){
      var containerRef = useRef(null);
      var trackRef = useRef(null);

      var images = (props && props.images && props.images.length ? props.images : FILENAMES.map(function(f){ return PATH_PREFIX + f; }));
      var items = useMemo(function(){
        // duplicate 3x to allow wrapping while always showing a continuous middle set
        return images.concat(images).concat(images);
      }, [images]);

      var speed = (props && props.speed) || 45; // px/s
      var xRef = useRef(0);
      var baseWidthRef = useRef(0);
      var animRef = useRef(null);
      var lastTRef = useRef(0);
      var draggingRef = useRef(false);
      var startXRef = useRef(0);
      var grabbedAtRef = useRef(0);
      var velocityRef = useRef(0);
      var pausedRef = useRef(false);
      var resumeTimerRef = useRef(null);

      function calcBaseWidth(){
        var track = trackRef.current;
        if(!track) return;
        var children = track.children;
        if(!children || !children.length) return;
        var count = images.length;
        var gap = parseGapPx(track);
        var w = 0;
        for(var i=0;i<count && i<children.length;i++){
          w += children[i].getBoundingClientRect().width;
        }
        if(count > 1) w += gap * (count - 1);
        baseWidthRef.current = Math.max(1, Math.round(w));
      }

      useLayoutEffect(function(){
        calcBaseWidth();
        var ro = new ResizeObserver(function(){ calcBaseWidth(); });
        if(trackRef.current) ro.observe(trackRef.current);
        // Recalc once images finish loading
        var imgs = trackRef.current ? trackRef.current.querySelectorAll('img') : [];
        function onImg(){ calcBaseWidth(); }
        imgs.forEach(function(im){ if(!im.complete) im.addEventListener('load', onImg, { once: true }); });
        return function(){
          ro.disconnect();
          imgs.forEach(function(im){ im.removeEventListener && im.removeEventListener('load', onImg); });
        };
      }, []);

      function setTransform(x){
        var track = trackRef.current;
        if(track){
          track.style.transform = 'translate3d(' + x + 'px,0,0)';
        }
      }

      function step(t){
        if(!lastTRef.current) lastTRef.current = t;
        var dt = Math.min(40, t - lastTRef.current);
        lastTRef.current = t;

        if(!pausedRef.current && !draggingRef.current){
          xRef.current -= speed * (dt / 1000);
        }

        var bw = baseWidthRef.current;
        if(bw > 0){
          xRef.current = wrapX(xRef.current, bw);
        }

        setTransform(xRef.current);
        animRef.current = requestAnimationFrame(step);
      }

      useEffect(function(){
        animRef.current = requestAnimationFrame(step);
        return function(){ cancelAnimationFrame(animRef.current); };
      }, []);

      function pauseFor(ms){
        if(ms === void 0) ms = 2400;
        pausedRef.current = true;
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(function(){ pausedRef.current = false; }, ms);
      }

      function onPointerDown(e){
        if((e.button !== undefined && e.button !== 0) || e.ctrlKey) return;
        draggingRef.current = true;
        startXRef.current = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
        grabbedAtRef.current = xRef.current;
        velocityRef.current = 0;
        pausedRef.current = true;
        var el = containerRef.current;
        if(el && e.pointerId !== undefined && el.setPointerCapture){ try{ el.setPointerCapture(e.pointerId); } catch(_){} }
        if(el) el.setAttribute('data-dragging', '1');
        pauseFor(16000);
      }

      function onPointerMove(e){
        if(!draggingRef.current) return;
        var x = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
        var dx = x - startXRef.current;
        xRef.current = grabbedAtRef.current + dx;
        velocityRef.current = dx;
        xRef.current = wrapX(xRef.current, baseWidthRef.current);
        setTransform(xRef.current);
      }

      function onPointerUp(){
        if(!draggingRef.current) return;
        draggingRef.current = false;
        var el = containerRef.current;
        if(el) el.removeAttribute('data-dragging');
        var v = Math.max(-60, Math.min(60, velocityRef.current));
        xRef.current = wrapX(xRef.current + v * 4, baseWidthRef.current);
        setTransform(xRef.current);
        pauseFor(2600);
      }

      function onWheel(e){
        // Trackpad horizontal gestures
        if(Math.abs(e.deltaX) > Math.abs(e.deltaY)){
          e.preventDefault();
          xRef.current -= e.deltaX;
          xRef.current = wrapX(xRef.current, baseWidthRef.current);
          setTransform(xRef.current);
          pauseFor(2600);
        }
      }

      useEffect(function(){
        var el = containerRef.current;
        if(!el) return;
        el.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        el.addEventListener('wheel', onWheel, { passive: false });
        return function(){
          el.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          el.removeEventListener('wheel', onWheel);
        };
      }, []);

      return React.createElement(
        'section',
        { className: 'ic', ref: containerRef, 'aria-label': 'Галерея конференц-зала, горизонтальная карусель', tabIndex: 0 },
        
        React.createElement(
          'div',
          { className: 'ic-header' },
          React.createElement('h2', { className: 'ic-title' }, 'Галерея'),
          React.createElement('p', { className: 'ic-sub' }, 'Ваше событие начинается здесь!')
        ),
React.createElement(
          'div',
          { className: 'ic-viewport', role: 'group' },
          React.createElement(
            'div',
            { className: 'ic-track', ref: trackRef },
            items.map(function(src, idx){
              return React.createElement(
                'figure',
                { className: 'ic-item', key: idx },
                React.createElement('img', { src: src, alt: 'Фото конференц-зала' })
              );
            })
          )
        )
      );
    }

    return InfiniteCarousel;
  }

  function mountAfterHero(React, ReactDOM, props){
    var hero = document.querySelector('.hero-banner');
    if(!hero) return;
    var mount = document.getElementById('conf-carousel-root');
    if(!mount){
      mount = document.createElement('div');
      mount.id = 'conf-carousel-root';
      hero.insertAdjacentElement('afterend', mount);
    }

    var Carousel = defineComponent(React);
    if(ReactDOM.createRoot){
      var root = ReactDOM.createRoot(mount);
      root.render(React.createElement(Carousel, props || {}));
    } else {
      ReactDOM.render(React.createElement(Carousel, props || {}), mount);
    }
  }

  function ensureReact(cb){
    if(window.React && window.ReactDOM){ cb(window.React, window.ReactDOM); return; }
    function add(src){
      return new Promise(function(resolve, reject){
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    Promise.resolve()
      .then(function(){ return add('https://unpkg.com/react@18/umd/react.production.min.js'); })
      .then(function(){ return add('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'); })
      .then(function(){ cb(window.React, window.ReactDOM); })
      .catch(function(){ console.error('Не удалось загрузить React для карусели.'); });
  }

  function init(props){
    ensureReact(function(React, ReactDOM){
      mountAfterHero(React, ReactDOM, props || {});
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ init(); });
  } else {
    init();
  }

  window.TelegraphInfiniteCarousel = {
    defineComponent: defineComponent,
    mount: mountAfterHero,
    ensureReact: ensureReact,
    init: init
  };
})();