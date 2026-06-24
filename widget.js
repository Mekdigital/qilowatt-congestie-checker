(function () {
  // Qilowatt congestie-checker. Zelf-mountende widget.
  // Mount: in #qw-congestie-root indien aanwezig, anders onderaan de body.
  var DATA_VERSION = '2026-06-23'; // git-tag van het databestand
  var DATA_URL = 'https://cdn.jsdelivr.net/gh/Mekdigital/qilowatt-congestie-checker@' + DATA_VERSION + '/data/congestie.bin';
  var FUNNEL_URL = '/funnel-congestie';

  var CSS = ''
    + ".qw-congestie{font-family:'Satoshi',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F3EA;border-radius:10px;padding:24px;max-width:560px;color:#444;}"
    + ".qw-congestie *{box-sizing:border-box;}"
    + ".qw-congestie .qw-card{background:#fff;border-radius:8px;padding:24px;}"
    + ".qw-congestie .qw-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#99502D;}"
    + ".qw-congestie .qw-h{font-size:22px;line-height:1.25;font-weight:700;color:#000;margin:10px 0 6px;}"
    + ".qw-congestie .qw-p{font-size:14px;line-height:1.6;margin:0 0 14px;color:#444;}"
    + ".qw-congestie .qw-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;}"
    + ".qw-congestie .qw-pc{flex:1;min-width:150px;border:1px solid #000;background:#fff;padding:11px 13px;font-size:15px;font-family:inherit;color:#000;border-radius:0;}"
    + ".qw-congestie .qw-pc:focus{outline:2px solid #FF6933;outline-offset:-2px;}"
    + ".qw-congestie .qw-btn{background:#FF6933;color:#fff;border:none;border-radius:24px;padding:11px 22px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;}"
    + ".qw-congestie .qw-btn.qw-secondary{background:#111;}"
    + ".qw-congestie .qw-btn[disabled]{opacity:.6;cursor:default;}"
    + ".qw-congestie .qw-note{font-size:12px;color:#888;margin-top:13px;}"
    + ".qw-congestie .qw-error{font-size:13px;color:#A32D2D;margin-top:10px;}"
    + ".qw-congestie .qw-badge{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;padding:6px 13px;border-radius:20px;}"
    + ".qw-congestie .qw-badge.qw-wel{background:#EAF3DE;color:#3B6D11;}"
    + ".qw-congestie .qw-badge.qw-geen{background:#EDEBE3;color:#5F5E5A;}"
    + ".qw-congestie .qw-money{background:#FDEEE4;border-radius:8px;padding:15px 17px;margin:4px 0 10px;}"
    + ".qw-congestie .qw-money .qw-big{font-size:28px;font-weight:700;color:#000;}"
    + ".qw-congestie .qw-money .qw-big span{color:#FF6933;}"
    + ".qw-congestie .qw-foot{font-size:11.5px;color:#999;line-height:1.45;margin:0 0 16px;}"
    + ".qw-congestie [hidden]{display:none!important;}";

  var MARKUP = ''
    + '<div class="qw-card qw-view-input">'
    + '<span class="qw-eyebrow">Congestievoordeel</span>'
    + '<div class="qw-h">Kun jij extra verdienen in jouw buurt?</div>'
    + '<p class="qw-p">Vul je postcode in en check of jij in een congestiegebied woont. Juist daar levert een thuisbatterij extra op.</p>'
    + '<div class="qw-row"><input class="qw-pc" placeholder="1234 AB" aria-label="Postcode" autocomplete="postal-code" maxlength="8"><button class="qw-btn qw-check">Check mijn postcode</button></div>'
    + '<p class="qw-error" hidden></p>'
    + '<p class="qw-note">Gratis en anoniem. Je postcode wordt nergens opgeslagen.</p>'
    + '</div>'
    + '<div class="qw-card qw-view-wel" hidden>'
    + '<span class="qw-badge qw-wel">Jouw postcode komt in aanmerking</span>'
    + '<div class="qw-h">Goed nieuws, <span class="qw-pc-out"></span> ligt in een congestiegebied</div>'
    + '<p class="qw-p">Het net in jouw buurt zit vol. Juist daarom kun jij extra verdienen. Laat je thuisbatterij meesturen om het net te ontlasten en ontvang daarvoor een vergoeding, bovenop je normale opbrengst.</p>'
    + '<div class="qw-money"><div class="qw-big">tot € <span>50</span> per kW per jaar</div></div>'
    + '<p class="qw-foot">Indicatief bedrag uit de lopende pilot. Definitieve vergoeding en voorwaarden volgen van Frank Energie.</p>'
    + '<button class="qw-btn qw-cta">Vraag gratis advies aan</button>'
    + '</div>'
    + '<div class="qw-card qw-view-geen" hidden>'
    + '<span class="qw-badge qw-geen">Geen congestie bekend</span>'
    + '<div class="qw-h"><span class="qw-pc-out"></span> ligt niet in een congestiegebied</div>'
    + '<p class="qw-p">In jouw buurt is op dit moment geen netcongestie bekend. De extra congestievergoeding geldt hier dus nog niet. Een thuisbatterij blijft alsnog de moeite waard.</p>'
    + '<p class="qw-p">Je wordt minder afhankelijk van het net en profiteert van dynamische prijzen. En zodra congestie jouw kant op komt, ben je er meteen klaar voor.</p>'
    + '<button class="qw-btn qw-secondary qw-cta">Bekijk wat een batterij oplevert</button>'
    + '</div>';

  var VERSION = 1;
  var PC6_RE = /^[1-9][0-9]{3}[A-Z]{2}$/;
  function normalizePc6(raw) { return String(raw).replace(/\s+/g, '').toUpperCase(); }
  function isValidPc6(pc) { return PC6_RE.test(pc); }
  function encodePc6(pc) {
    var d = parseInt(pc.slice(0, 4), 10) - 1000;
    return d * 676 + (pc.charCodeAt(4) - 65) * 26 + (pc.charCodeAt(5) - 65);
  }
  function readUvarint(buf, pos) {
    var result = 0, shift = 0, byte;
    do { byte = buf[pos++]; result |= (byte & 0x7f) << shift; shift += 7; } while (byte & 0x80);
    return [result >>> 0, pos];
  }
  function decodeData(buf) {
    if (buf[0] !== VERSION) throw new Error('onbekende dataversie ' + buf[0]);
    var pos = 1, r = readUvarint(buf, pos), count = r[0]; pos = r[1];
    var set = new Set(), prev = 0;
    for (var i = 0; i < count; i++) { var d = readUvarint(buf, pos); prev += d[0]; pos = d[1]; set.add(prev); }
    return set;
  }

  function ensureFont() {
    if (document.getElementById('qw-congestie-font')) return;
    var l = document.createElement('link');
    l.id = 'qw-congestie-font';
    l.rel = 'stylesheet';
    l.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap';
    document.head.appendChild(l);
  }
  function ensureStyle() {
    if (document.getElementById('qw-congestie-style')) return;
    var s = document.createElement('style');
    s.id = 'qw-congestie-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function mount() {
    ensureFont();
    ensureStyle();
    var root = document.getElementById('qw-congestie-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'qw-congestie-root';
      document.body.appendChild(root);
    }
    root.className = 'qw-congestie';
    root.innerHTML = MARKUP;

    var input = root.querySelector('.qw-pc');
    var btn = root.querySelector('.qw-check');
    var errEl = root.querySelector('.qw-error');
    var dataPromise = null;

    function loadData() {
      if (!dataPromise) {
        dataPromise = fetch(DATA_URL).then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.arrayBuffer();
        }).then(function (b) { return decodeData(new Uint8Array(b)); });
      }
      return dataPromise;
    }
    function showError(msg) { errEl.textContent = msg; errEl.hidden = false; }
    function clearError() { errEl.hidden = true; }
    function showResult(pc, inCongestie) {
      root.querySelector('.qw-view-input').hidden = true;
      var view = root.querySelector(inCongestie ? '.qw-view-wel' : '.qw-view-geen');
      view.hidden = false;
      view.querySelector('.qw-pc-out').textContent = pc.slice(0, 4) + ' ' + pc.slice(4);
      var href = FUNNEL_URL + '?Postcode=' + encodeURIComponent(pc) + '&herkomst=congestie';
      view.querySelector('.qw-cta').onclick = function () { window.location.href = href; };
    }
    function check() {
      var pc = normalizePc6(input.value);
      if (!isValidPc6(pc)) { showError('Vul een geldige postcode in, bijvoorbeeld 1234 AB.'); return; }
      clearError();
      btn.disabled = true; btn.textContent = 'Even checken...';
      loadData().then(function (set) {
        showResult(pc, set.has(encodePc6(pc)));
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Check mijn postcode';
        showError('De check is even niet beschikbaar. Probeer het later opnieuw of bel ons.');
      });
    }
    btn.addEventListener('click', check);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
