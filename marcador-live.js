(function () {
  "use strict";

  var cfg = window.MARCADOR_CONFIG || {};
  var rawUrl = cfg.proxyUrl || "";
  var PROXY_URL = rawUrl
    ? rawUrl.replace(/\/api\/marcadores\/live$/, "") + "/api/marcadores/live"
    : null;
  var INTERVALO = cfg.intervalo || 60000;

  var CANONICAL = {
    argentina: "argentina", brasil: "brazil", brazil: "brazil",
    colombia: "colombia", chile: "chile", uruguay: "uruguay",
    peru: "peru", ecuador: "ecuador", venezuela: "venezuela",
    bolivia: "bolivia", paraguay: "paraguay",
    mexico: "mexico", "costa rica": "costa-rica",
    "estados unidos": "usa", usa: "usa",
    panama: "panama", honduras: "honduras", "el salvador": "el-salvador",
    guatemala: "guatemala", haiti: "haiti", cuba: "cuba",
    jamaica: "jamaica", trinidad: "trinidad",
    "trinidad and tobago": "trinidad",
    islandia: "iceland", iceland: "iceland",
    moldavia: "moldova", moldova: "moldova",
    bielorrusia: "belarus", belorrusia: "belarus", belarus: "belarus",
    letonia: "latvia", latvia: "latvia",
    lituania: "lithuania", lithuania: "lithuania",
    estonia: "estonia",
    "islas feroe": "faroe-islands", "faroe islands": "faroe-islands",
    hungria: "hungary", hungary: "hungary",
    kazajstan: "kazakhstan", kazajistan: "kazakhstan", kazakhstan: "kazakhstan",
    azerbaiyan: "azerbaijan", azerbaijan: "azerbaijan",
    "san marino": "san-marino",
    alemania: "germany", germany: "germany",
    francia: "france", france: "france",
    espana: "spain", spain: "spain",
    italia: "italy", italy: "italy",
    holanda: "netherlands", netherlands: "netherlands",
    belgica: "belgium", belgium: "belgium",
    suecia: "sweden", sweden: "sweden",
    noruega: "norway", norway: "norway",
    suiza: "switzerland", switzerland: "switzerland",
    austria: "austria",
    dinamarca: "denmark", denmark: "denmark",
    escocia: "scotland", scotland: "scotland",
    gales: "wales", wales: "wales",
    turquia: "turkey", turkey: "turkey",
    grecia: "greece", greece: "greece",
    rumania: "romania", romania: "romania",
    eslovaquia: "slovakia", slovakia: "slovakia",
    "republica checa": "czech-republic", "czech republic": "czech-republic",
    servia: "serbia", serbia: "serbia",
    croacia: "croatia", croatia: "croatia",
    eslovenia: "slovenia", slovenia: "slovenia",
    ucrania: "ukraine", ukraine: "ukraine",
    rusia: "russia", russia: "russia",
    chipre: "cyprus", cyprus: "cyprus",
    albania: "albania", georgia: "georgia",
    armenia: "armenia",
    "rd del congo": "congo-dr", "congo dr": "congo-dr",
    "congo democratic republic": "congo-dr",
    "burkina faso": "burkina-faso",
    marruecos: "morocco", morocco: "morocco",
    nigeria: "nigeria", ghana: "ghana", senegal: "senegal",
    camerun: "cameroon", cameroon: "cameroon",
    "costa de marfil": "ivory-coast", "ivory coast": "ivory-coast",
    tunez: "tunisia", tunisia: "tunisia",
    etiopia: "ethiopia", ethiopia: "ethiopia",
    malaui: "malawi", malawi: "malawi",
    mozambique: "mozambique",
    iran: "iran", iraq: "iraq", irak: "iraq",
    siria: "syria", syria: "syria",
    bahrein: "bahrain", bahrain: "bahrain",
    oman: "oman", kuwait: "kuwait",
    palestina: "palestine", palestine: "palestine",
    kirguistan: "kyrgyz-republic", "kyrgyz republic": "kyrgyz-republic",
    japon: "japan", japan: "japan",
    "corea del sur": "south-korea", "south korea": "south-korea",
    corea: "south-korea",
    china: "china",
    tailandia: "thailand", thailand: "thailand",
    indonesia: "indonesia",
    myanmar: "myanmar", birmania: "myanmar",
    camboya: "cambodia", cambodia: "cambodia",
    filipinas: "philippines", philippines: "philippines",
    "hong kong": "hong-kong",
  };

  function norm(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonical(str) {
    var n = norm(str);
    return CANONICAL[n] || n;
  }

  function equiposDelId(eventoId) {
    var id = (eventoId || "").toLowerCase().replace(/-vs-/g, "|||vs|||");
    var partes = id.split("|||vs|||");
    if (partes.length !== 2) return null;
    var awaySlug = partes[1].replace(/-/g, " ").trim();
    var localWords = partes[0].split("-");
    var localSlug = null;
    for (var len = Math.min(localWords.length, 5); len >= 1; len--) {
      var candidate = localWords.slice(localWords.length - len).join(" ");
      if (CANONICAL[candidate]) { localSlug = candidate; break; }
    }
    if (!localSlug) localSlug = localWords[localWords.length - 1];
    return { local: localSlug, visitante: awaySlug };
  }

  function equiposDelTexto(li) {
    var anchor = li.querySelector(":scope > a");
    if (!anchor) return null;
    var texto = "";
    anchor.childNodes.forEach(function (n) {
      if (n.nodeType === 3) texto += n.textContent;
    });
    texto = texto.trim();
    var colon = texto.indexOf(":");
    if (colon > 0) texto = texto.substring(colon + 1).trim();
    var partes = texto.split(/\s+vs\s+/i);
    if (partes.length === 2) return { local: partes[0].trim(), visitante: partes[1].trim() };
    return null;
  }

  var partidos = [];

  async function cargarPartidos() {
    if (!PROXY_URL) return;
    try {
      var r = await fetch(PROXY_URL, { cache: "no-store" });
      if (!r.ok) return;
      var d = await r.json();
      partidos = d.eventos || [];
    } catch (_) {}
  }

  function buscarPartido(equipos) {
    if (!equipos) return null;
    var cl = canonical(equipos.local);
    var cv = canonical(equipos.visitante);
    for (var i = 0; i < partidos.length; i++) {
      var p = partidos[i];
      if (canonical(p.local) === cl && canonical(p.visitante) === cv) return p;
    }
    return null;
  }

  function actualizarScores() {
    document.querySelectorAll("li[data-evento-id]").forEach(function (li) {
      var equipos = equiposDelTexto(li) || equiposDelId(li.getAttribute("data-evento-id"));
      var partido = buscarPartido(equipos);
      var viejo = li.querySelector(".df-score-badge");
      if (viejo) viejo.remove();
      if (!partido || partido.marcador === null) return;
      var span = document.createElement("span");
      span.className = "marcador-badge df-score-badge";
      if (partido.estado === "en_vivo") span.className += " marcador-score-vivo";
      else if (partido.estado === "descanso") span.className += " marcador-score-dt";
      else span.className += " marcador-score-fin";
      span.textContent = partido.marcador;
      var primerBadge = li.querySelector(".marcador-badge:not(.df-score-badge)");
      var hora = li.querySelector("a > .t");
      if (primerBadge) primerBadge.before(span);
      else if (hora) hora.before(span);
      else { var a = li.querySelector(":scope > a"); if (a) a.appendChild(span); }
    });
  }

  async function actualizar() {
    await cargarPartidos();
    actualizarScores();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizar);
  } else {
    actualizar();
  }

  setInterval(actualizar, INTERVALO);
})();
