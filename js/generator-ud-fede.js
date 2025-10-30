<script>
// --- Table des départements (codes → libellés lisibles) ---
const DEPTS = {
  "01":"Ain","02":"Aisne","03":"Allier","04":"Alpes-de-Haute-Provence","05":"Hautes-Alpes","06":"Alpes-Maritimes",
  "07":"Ardèche","08":"Ardennes","09":"Ariège","10":"Aube","11":"Aude","12":"Aveyron","13":"Bouches-du-Rhône",
  "14":"Calvados","15":"Cantal","16":"Charente","17":"Charente-Maritime","18":"Cher","19":"Corrèze","2A":"Corse-du-Sud",
  "2B":"Haute-Corse","21":"Côte-d'Or","22":"Côtes-d'Armor","23":"Creuse","24":"Dordogne","25":"Doubs","26":"Drôme",
  "27":"Eure","28":"Eure-et-Loir","29":"Finistère","30":"Gard","31":"Haute-Garonne","32":"Gers","33":"Gironde",
  "34":"Hérault","35":"Ille-et-Vilaine","36":"Indre","37":"Indre-et-Loire","38":"Isère","39":"Jura","40":"Landes",
  "41":"Loir-et-Cher","42":"Loire","43":"Haute-Loire","44":"Loire-Atlantique","45":"Loiret","46":"Lot","47":"Lot-et-Garonne",
  "48":"Lozère","49":"Maine-et-Loire","50":"Manche","51":"Marne","52":"Haute-Marne","53":"Mayenne","54":"Meurthe-et-Moselle",
  "55":"Meuse","56":"Morbihan","57":"Moselle","58":"Nièvre","59":"Nord","60":"Oise","61":"Orne","62":"Pas-de-Calais",
  "63":"Puy-de-Dôme","64":"Pyrénées-Atlantiques","65":"Hautes-Pyrénées","66":"Pyrénées-Orientales","67":"Bas-Rhin",
  "68":"Haut-Rhin","69":"Rhône","70":"Haute-Saône","71":"Saône-et-Loire","72":"Sarthe","73":"Savoie","74":"Haute-Savoie",
  "75":"Paris","76":"Seine-Maritime","77":"Seine-et-Marne","78":"Yvelines","79":"Deux-Sèvres","80":"Somme","81":"Tarn",
  "82":"Tarn-et-Garonne","83":"Var","84":"Vaucluse","85":"Vendée","86":"Vienne","87":"Haute-Vienne","88":"Vosges",
  "89":"Yonne","90":"Territoire de Belfort","91":"Essonne","92":"Hauts-de-Seine","93":"Seine-Saint-Denis",
  "94":"Val-de-Marne","95":"Val-d'Oise",
  "971":"Guadeloupe","972":"Martinique","973":"Guyane","974":"La Réunion","975":"Saint-Pierre-et-Miquelon",
  "976":"Mayotte","977":"Saint-Barthélemy","978":"Saint-Martin","986":"Wallis-et-Futuna","987":"Polynésie française",
  "988":"Nouvelle-Calédonie"
};

// --- Chargement de la base JSON structurée ---
let DB = {};
async function loadDB(){
  const here = location.pathname.replace(/[^/]+$/, '');
  for (const url of [here+'data/emails-syndicats.json','/journeesansnous/data/emails-syndicats.json']){
    try { const r = await fetch(url,{cache:'no-store'}); if(r.ok){ DB = await r.json(); break; } } catch(e){}
  }
  fillSyndicats();
}

// --- Liste des syndicats ---
function fillSyndicats(){
  const s = document.getElementById('syndicat');
  s.innerHTML = '';
  s.add(new Option('— choisir —',''));
  const keys = Object.keys(DB).sort();
  (keys.length?keys:['CGT','CFDT','FO','CFE-CGC','CFTC','UNSA','Solidaires','FSU','CNT'])
    .forEach(k => s.add(new Option(k,k)));
  fillStructures();
}

// --- Liste UD + Fédés en fonction du syndicat choisi ---
function fillStructures(){
  const synd = document.getElementById('syndicat').value;
  const dept = document.getElementById('dept') || createDeptSelect();
  const fede = document.getElementById('fede') || createFedeSelect();

  dept.innerHTML = '';  dept.add(new Option('— UD (département) —',''));
  fede.innerHTML = '';  fede.add(new Option('— Fédération (secteur) —',''));

  const rec = DB[synd] || {};

  // Fédérations (libellés tels quels)
  (rec.fede || []).forEach(x => {
    fede.add(new Option(x.label, x.email || ''));
  });

  // UD → afficher « code – nom » si connu, sinon libellé existant
  const uds = (rec.ud || []).slice().sort(udSortKey);
  uds.forEach(x => {
    const code = x.code || '';
    const nice = code && DEPTS[code] ? `${code} – ${DEPTS[code]}` : (x.label || code || 'UD');
    dept.add(new Option(nice, x.email || ''));
  });

  updateEmail();
}

// tri UD : 01→…→2A→2B→…→976→986→987→988
function udSortKey(x){
  const c = (x.code || '').toUpperCase();
  const m = c.match(/^(\d+)([A-Z]?)$/);
  if(!m) return [9999, c];
  const n = parseInt(m[1],10);
  const frac = m[2]==='A' ? 0.1 : (m[2]==='B' ? 0.2 : 0);
  return [n + frac, c];
}

// met à jour l’email selon la priorité Fédé ➜ UD ➜ National
function updateEmail(){
  const fedeVal = (document.getElementById('fede')||{}).value || '';
  const deptVal = (document.getElementById('dept')||{}).value || '';
  const synd = document.getElementById('syndicat').value;
  const national = (DB[synd]||{}).national || '';
  document.getElementById('destinataire').value = fedeVal || deptVal || national || '';
}

// helpers : si tu n’as pas encore créé les <select> #dept / #fede dans ton HTML
function createDeptSelect(){
  const host = document.querySelector('label[for=\"structure\"]').parentElement;
  // remplace l’ancien champ « Section / Territoire » par deux selects
  host.innerHTML = `
    <label for=\"dept\">Département (UD)</label>
    <select id=\"dept\"></select>
  `;
  const dept = document.getElementById('dept');
  dept.addEventListener('change', updateEmail);
  // ajoute le select fédé à droite si besoin
  const two = host.parentElement;
  const fedeWrap = document.createElement('div');
  fedeWrap.innerHTML = `
    <label for=\"fede\">Fédération (secteur)</label>
    <select id=\"fede\"></select>
  `;
  two.insertBefore(fedeWrap, host.nextSibling);
  document.getElementById('fede').addEventListener('change', updateEmail);
  return dept;
}
function createFedeSelect(){ return document.getElementById('fede'); }

// init
document.addEventListener('DOMContentLoaded', ()=>{ loadDB(); });
</script>
