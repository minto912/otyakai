/**
 * お茶会 — サイト全体の挙動
 *
 * 依存ライブラリなし。すべての機能は、対象の要素が無ければ静かに何もしない。
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- モバイルナビ ---------- */

  function initNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('siteNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      toggle.querySelector('.visually-hidden').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // リンクを押したら閉じる（同一ページ内遷移のため）
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // 幅が広がったらメニュー状態をリセット
    window.matchMedia('(min-width: 721px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- ヘッダーの影 ---------- */

  function initStickyHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ---------- スクロールに応じた表示アニメーション ---------- */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, i) {
      // 同じ画面に並ぶ要素を少しずつずらして出す
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      observer.observe(el);
    });
  }

  /* ---------- 現在地に応じたナビのハイライト ---------- */

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------- 開催までのカウントダウン ---------- */

  function initCountdown() {
    var box = document.getElementById('countdown');
    var values = document.getElementById('countdownValues');
    if (!box || !values) return;

    var target = new Date(box.dataset.event).getTime();
    if (isNaN(target)) return;

    function render() {
      var diff = target - Date.now();
      if (diff <= 0) {
        values.textContent = '本日開催です';
        box.hidden = false;
        return false;
      }

      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);

      values.innerHTML =
        '<span class="num">' + days + '</span>日' +
        '<span class="num">' + hours + '</span>時間' +
        '<span class="num">' + minutes + '</span>分';
      box.hidden = false;
      return true;
    }

    if (render()) {
      // 分単位の表示なので、更新も分に合わせれば十分
      setInterval(render, 30000);
    }
  }

  /* ---------- 申し込みフォーム ---------- */

  var STORAGE_KEY = 'otyakai:rsvp';

  var FIELD_LABELS = {
    name: 'お名前',
    kana: 'ふりがな',
    email: 'メールアドレス',
    party: '参加人数',
    session: 'ご希望の部',
    experience: 'お茶の経験',
    notes: '備考'
  };

  function validate(form) {
    var errors = {};
    var data = new FormData(form);

    var name = (data.get('name') || '').toString().trim();
    if (!name) errors.name = 'お名前を入力してください。';

    var email = (data.get('email') || '').toString().trim();
    if (!email) {
      errors.email = 'メールアドレスを入力してください。';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'メールアドレスの形式が正しくないようです。';
    }

    var party = Number(data.get('party'));
    if (!party || party < 1 || party > 4) {
      errors.party = '参加人数は 1 〜 4 名の範囲でご指定ください。';
    }

    if (!data.get('session')) errors.session = 'ご希望の部を選んでください。';
    if (!data.get('agree')) errors.agree = 'キャンセル規定へのご同意が必要です。';

    return errors;
  }

  function showErrors(form, errors) {
    form.querySelectorAll('.error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });

    Object.keys(errors).forEach(function (key) {
      var slot = form.querySelector('[data-error-for="' + key + '"]');
      if (slot) slot.textContent = errors[key];
      var input = form.elements[key];
      if (input && input.setAttribute) input.setAttribute('aria-invalid', 'true');
    });
  }

  function buildSummary(form) {
    var data = new FormData(form);
    var rows = [];

    Object.keys(FIELD_LABELS).forEach(function (key) {
      var value = (data.get(key) || '').toString().trim();
      if (!value) return;
      if (key === 'party') value = value + ' 名';
      rows.push({ label: FIELD_LABELS[key], value: value });
    });

    return rows;
  }

  function renderSummary(rows) {
    var list = document.getElementById('rsvpSummary');
    if (!list) return;

    list.textContent = '';
    rows.forEach(function (row) {
      var wrapper = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = row.label;
      dd.textContent = row.value;
      wrapper.append(dt, dd);
      list.append(wrapper);
    });
  }

  function save(rows) {
    try {
      var record = { submittedAt: new Date().toISOString(), fields: rows };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      // プライベートモードなどで保存できなくても、表示は続行する
    }
  }

  function initForm() {
    var form = document.getElementById('rsvpForm');
    var success = document.getElementById('rsvpSuccess');
    var resetBtn = document.getElementById('rsvpReset');
    if (!form || !success) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var errors = validate(form);
      showErrors(form, errors);

      var firstKey = Object.keys(errors)[0];
      if (firstKey) {
        var field = form.elements[firstKey];
        if (field && field.focus) field.focus();
        return;
      }

      var rows = buildSummary(form);
      renderSummary(rows);
      save(rows);

      form.hidden = true;
      success.hidden = false;
      success.focus();
    });

    // 一度エラーを出した項目は、入力し直した時点でエラー表示を消す
    form.addEventListener('input', function (e) {
      var field = e.target;
      if (!field.name || field.getAttribute('aria-invalid') !== 'true') return;
      field.removeAttribute('aria-invalid');
      var slot = form.querySelector('[data-error-for="' + field.name + '"]');
      if (slot) slot.textContent = '';
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        showErrors(form, {});
        success.hidden = true;
        form.hidden = false;
        form.elements.name.focus();
      });
    }
  }

  /* ---------- フッターの年表示 ---------- */

  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- 起動 ---------- */

  function init() {
    initNav();
    initStickyHeader();
    initReveal();
    initScrollSpy();
    initCountdown();
    initForm();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
