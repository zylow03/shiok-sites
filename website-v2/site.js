
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var nav = document.querySelector('.nav'), prog = document.getElementById('progress');

  // mobile menu
  var mbtn = document.querySelector('.menu-btn');
  function setMenu(open){ nav.classList.toggle('open', open); mbtn.setAttribute('aria-expanded', String(open)); mbtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  mbtn.addEventListener('click', function(){ setMenu(!nav.classList.contains('open')); });
  [].forEach.call(document.querySelectorAll('.nav ul a'), function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
  addEventListener('keydown', function(e){ if(e.key === 'Escape') setMenu(false); });

  // sticky nav + scroll progress
  function onScroll(){
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 30);
    prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // rotating hero word
  var rot = document.querySelector('.rot');
  if (rot && !reduce){
    var words = [].slice.call(rot.children), i = 0;
    setInterval(function(){
      var cur = words[i]; i = (i + 1) % words.length; var nxt = words[i];
      nxt.classList.add('in-wait'); nxt.classList.remove('out');
      void nxt.offsetWidth;
      cur.classList.add('out'); nxt.classList.remove('in-wait');
    }, 2200);
  }

  // scroll reveal (content is visible at rest; only off-screen items get a gentle lift)
  if ('IntersectionObserver' in window && !reduce){
    var items = document.querySelectorAll('.head, .work figure, .feat, .step, .deal, .facts, .faq details, .contact > *');
    var ro = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pre'); if(e.target.classList.contains('step')) e.target.classList.add('on'); ro.unobserve(e.target);} });
    }, {threshold:.12});
    [].forEach.call(items, function(el, n){
      el.classList.add('reveal');
      var r = el.getBoundingClientRect();
      if (r.top > innerHeight){ el.classList.add('pre'); el.style.transitionDelay = ((n % 3) * 80) + 'ms'; }
      else if (el.classList.contains('step')) { setTimeout(function(){ el.classList.add('on'); }, 200); }
      ro.observe(el);
    });
  } else { [].forEach.call(document.querySelectorAll('.step'), function(s){ s.classList.add('on'); }); }

  // tilt + spotlight on design cards
  var figs = [].slice.call(document.querySelectorAll('.work figure'));
  figs.forEach(function(f){
    var b = f.querySelector('.browser');
    if (fine && !reduce){
      f.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        b.style.setProperty('--mx', (x*100) + '%'); b.style.setProperty('--my', (y*100) + '%');
        b.style.transform = 'rotateY(' + ((x-.5)*7) + 'deg) rotateX(' + ((.5-y)*6) + 'deg) translateY(-6px)';
      });
      f.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    }
  });

  // filters
  var fbtns = [].slice.call(document.querySelectorAll('.filters button'));
  fbtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var cat = btn.dataset.f;
      fbtns.forEach(function(x){ x.setAttribute('aria-pressed', String(x === btn)); });
      figs.forEach(function(f){
        var show = cat === 'all' || f.dataset.cat === cat;
        if (show){ f.hidden = false; requestAnimationFrame(function(){ f.classList.remove('hiding'); }); }
        else { f.classList.add('hiding'); setTimeout(function(){ if(f.classList.contains('hiding')) f.hidden = true; }, reduce ? 0 : 380); }
      });
    });
  });

  // design previews + multi-page viewer
  function tpl(site, page){ return document.querySelector('template[data-site="' + site + '"][data-page="' + page + '"]'); }
  function pagesOf(site){ return [].slice.call(document.querySelectorAll('template[data-site="' + site + '"]')); }
  figs.forEach(function(f){
    var t = tpl(f.dataset.site, 'home'), box = f.querySelector('[data-preview]');
    if (t && box) box.appendChild(t.content.cloneNode(true));
  });
  var lb = document.getElementById('lb'), stage = document.getElementById('lbStage'), tabs = document.getElementById('lbTabs'), idx = 0, cur = null;
  function visible(){ return figs.filter(function(f){ return !f.hidden; }); }
  function showPage(page){
    var t = tpl(cur, page); if (!t) return;
    stage.innerHTML = ''; stage.appendChild(t.content.cloneNode(true)); stage.scrollTop = 0;
    [].forEach.call(tabs.children, function(b){ b.setAttribute('aria-selected', String(b.dataset.page === page)); });
  }
  function openSite(f){
    var list = visible(); idx = list.indexOf(f); cur = f.dataset.site;
    stage.className = 'screen vscreen t-' + cur;
    document.getElementById('lbTitle').textContent = f.querySelector('figcaption strong').textContent;
    var sub = f.querySelector('figcaption small:not(.disc)') || f.querySelector('.disc');
    document.getElementById('lbSub').textContent = sub ? sub.textContent : '';
    tabs.innerHTML = '';
    pagesOf(cur).forEach(function(t){
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.dataset.page = t.dataset.page; b.textContent = t.dataset.label;
      b.addEventListener('click', function(){ showPage(t.dataset.page); });
      tabs.appendChild(b);
    });
    showPage('home');
  }
  stage.addEventListener('click', function(e){
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); showPage(g.dataset.go); }
  });
  function step(d){ var list = visible(); idx = (idx + d + list.length) % list.length; openSite(list[idx]); }
  figs.forEach(function(f){
    f.setAttribute('tabindex','0'); f.setAttribute('role','button');
    f.setAttribute('aria-label','Explore the pages of ' + f.querySelector('figcaption strong').textContent);
    f.addEventListener('click', function(){ if (f.dataset.href){ location.href = f.dataset.href; return; } openSite(f); if (lb.showModal) lb.showModal(); });
    f.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); f.click(); } });
  });
  document.getElementById('lbPrev').onclick = function(){ step(-1); };
  document.getElementById('lbNext').onclick = function(){ step(1); };
  document.getElementById('lbClose').onclick = function(){ lb.close(); };
  lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function(e){ if(e.key==='ArrowRight') step(1); if(e.key==='ArrowLeft') step(-1); });

  // open a design directly from a link like work.html#dental
  var hs = location.hash.slice(1), hf = figs.filter(function(f){ return f.dataset.site === hs && !f.dataset.href; })[0];
  if (hf){ openSite(hf); if (lb.showModal) lb.showModal(); }

  // magnetic buttons + custom cursor ring
  if (fine && !reduce){
    [].forEach.call(document.querySelectorAll('.btn'), function(b){
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * .18) + 'px,' + ((e.clientY - r.top - r.height/2) * .3) + 'px)';
      });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });
    var dot = document.getElementById('cdot'), tx=0, ty=0, cx=0, cy=0;
    addEventListener('pointermove', function(e){ tx = e.clientX; ty = e.clientY; dot.style.opacity = 1; });
    document.addEventListener('pointerleave', function(){ dot.style.opacity = 0; });
    [].forEach.call(document.querySelectorAll('a, button, .work figure, summary'), function(el){
      el.addEventListener('pointerenter', function(){ dot.classList.add('big'); });
      el.addEventListener('pointerleave', function(){ dot.classList.remove('big'); });
    });
    (function loop(){ cx += (tx - cx) * .2; cy += (ty - cy) * .2; dot.style.transform = 'translate(' + (cx-0) + 'px,' + (cy-0) + 'px) translate(-50%,-50%)'; requestAnimationFrame(loop); })();
  }
})();
