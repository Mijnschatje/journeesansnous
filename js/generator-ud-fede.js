<script>
async function loadDB(){
  const status = (msg,isErr=false)=>{
    const box = document.querySelector('.card:has(h2:contains("Base d’emails")) .card-body') 
              || document.querySelectorAll('.card .card-body')[3];
    if(!box) return;
    const id='dbstatus';
    let el=document.getElementById(id);
    if(!el){ el=document.createElement('div'); el.id=id; el.style.marginTop='8px'; box.appendChild(el); }
    el.textContent = msg;
    el.style.color = isErr ? '#b91c1c' : '#0f766e';
    el.style.fontWeight = '600';
  };

  const tryPaths = [
    './data/emails-syndicats.json',
    '/journeesansnous/data/emails-syndicats.json' // fallback absolu au cas où
  ];
  let ok = false;
  for (const url of tryPaths){
    try{
      const res = await fetch(url, {cache:'no-store'});
      if(res.ok){
        DB = await res.json();
        status('Base d’emails chargée ✅');
        ok = true;
        break;
      }
    }catch(e){}
  }
  if(!ok){
    DB = {};
    status('Base introuvable — saisis l’email manuellement ou ajoute data/emails-syndicats.json', true);
  }
  fillSyndicats();
}
</script>
