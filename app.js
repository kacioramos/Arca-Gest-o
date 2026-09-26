const DB="creche_mensalidades",VER=1;let db,S={students:[],payments:[]};
const $=x=>document.getElementById(x),uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random(),today=()=>new Date().toISOString().slice(0,10),month=()=>today().slice(0,7);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const br=s=>s?`${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`:"—";

function formatPhone(v){
  v=(v||"").replace(/\D/g,"").slice(0,11);
  if(v.length<=2) return v;
  if(v.length<=7) return `(${v.slice(0,2)}) ${v.slice(2)}`;
  return v.length<=10 ? `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}` : `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
}
function bindPhoneMasks(){
  ["payerPhone","payPhone","responsiblePhone"].forEach(id=>{
    const el=$(id);
    if(el && !el.dataset.phoneBound){
      el.dataset.phoneBound="1";
      el.addEventListener("input",()=>{el.value=formatPhone(el.value)});
    }
  });
}

const THEME_KEY="arca_gestao_theme_v11";
function applyTheme(theme){
  const dark=theme==="dark"; document.documentElement.dataset.theme=dark?"dark":"light";
  const b=$("themeToggle"); if(b){b.textContent=dark?"☀ Claro":"☾ Escuro";b.setAttribute("aria-label",dark?"Ativar modo claro":"Ativar modo escuro");}
  const meta=$("themeColor"); if(meta) meta.content=dark?"#0b1117":"#0b2239";
}
function initTheme(){let t=localStorage.getItem(THEME_KEY);if(!t)t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";applyTheme(t);}
function toggleTheme(){const t=document.documentElement.dataset.theme==="dark"?"light":"dark";localStorage.setItem(THEME_KEY,t);applyTheme(t);}

function openDB(){return new Promise((ok,no)=>{let r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains("students"))d.createObjectStore("students",{keyPath:"id"});if(!d.objectStoreNames.contains("payments"))d.createObjectStore("payments",{keyPath:"id"});};r.onsuccess=()=>{db=r.result;ok()};r.onerror=()=>no(r.error)})}
function all(n){return new Promise((ok,no)=>{let r=db.transaction(n).objectStore(n).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function put(n,o){return new Promise((ok,no)=>{let r=db.transaction(n,"readwrite").objectStore(n).put(o);r.onsuccess=ok;r.onerror=()=>no(r.error)})}
function del(n,id){return new Promise((ok,no)=>{let r=db.transaction(n,"readwrite").objectStore(n).delete(id);r.onsuccess=ok;r.onerror=()=>no(r.error)})}
async function load(){S.students=await all("students");S.payments=await all("payments");S.students.sort((a,b)=>a.name.localeCompare(b.name));render()}
function toast(x){$("toast").textContent=x;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function go(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id==="page-"+p));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));render()}
function phone(v){return formatPhone(v)}
function st(id){return S.students.find(x=>x.id===id)}
function pay(stid,m){return S.payments.find(x=>x.studentId===stid&&x.month===m)}
function render(){renderHome();renderStudents();renderMonth()}
function renderHome(){let m=($("homeMonthYear").value||month().slice(0,4))+"-"+($("homeMonthMonth").value||month().slice(5,7)),ps=S.students.map(s=>pay(s.id,m)).filter(Boolean),paid=ps.length,total=ps.reduce((a,p)=>a+Number(p.amount||0),0),rate=S.students.length?Math.round(paid/S.students.length*100):0;$("totalStudents").textContent=S.students.length;$("paidCount").textContent=paid;$("pendingCount").textContent=Math.max(0,S.students.length-paid);$("received").textContent=money(total);
$("paidPercent").textContent=rate+"% da turma";$("averagePayment").textContent="média: "+money(paid?total/paid:0);
$("collectionRate").textContent=rate+"%";$("collectionProgress").style.width=rate+"%";$("progressPaid").textContent=paid+" pagos";$("progressPending").textContent=Math.max(0,S.students.length-paid)+" pendentes";$("homeMonthTitle").textContent="Situação de "+m.slice(5,7)+"/"+m.slice(0,4);$("homeList").innerHTML=S.students.map(s=>{let p=pay(s.id,m);return `<div class="row"><div><b>${esc(s.name)}</b><div class="muted">${esc(s.payerName)} • ${esc(s.payerPhone||"Telefone não informado")}</div></div><span class="status ${p?"paid":"pending"}">${p?"Pago":"Pendente"}</span></div>`}).join("")||'<div class="empty">Cadastre o primeiro aluno.</div>'}
function renderStudents(){let q=$("studentSearch").value.trim().toLowerCase();let a=S.students.filter(s=>{let names=[s.payerName,s.payerPhone,...(s.responsibles||[]).flatMap(r=>[r.name,r.phone])].join(" ");return(s.name+" "+names).toLowerCase().includes(q)});$("studentCount").textContent=a.length+" "+(a.length===1?"aluno":"alunos");$("studentGrid").innerHTML=a.map(s=>{let extra=(s.responsibles||[]).map(r=>`<p>👤 ${esc(r.name)}${r.phone?" • Telefone: "+esc(r.phone):""}</p>`).join("");return `<article class="student-card"><div class="student-top"><div class="student-avatar">${esc((s.name||"?").trim().charAt(0).toUpperCase())}</div><div><h3>${esc(s.name)}</h3><small>${(s.responsibles||[]).length+1} responsável(is)</small></div></div><p class="principal">👤 ${esc(s.payerName)} <span class="muted">(principal)</span></p><p>📞 ${esc(s.payerPhone||"Não informado")}</p>${extra}<div class="student-actions"><button class="btn ghost small" onclick="editStudent('${s.id}')">Editar</button><button class="btn primary small" onclick="openPayment('${s.id}')">Registrar mês</button><button class="btn ghost small" onclick="showHistory('${s.id}')">Histórico</button><button class="btn ghost small" onclick="removeStudent('${s.id}')">Excluir</button></div></article>`}).join("");$("emptyStudents").classList.toggle("hidden",a.length>0)}
function renderMonth(){
  let m=monthlyReferenceMonth(),f=$("paymentFilter").value||"all",q=($("paymentSearch")?.value||"").trim().toLowerCase();
  let a=S.students.filter(s=>{
    let p=pay(s.id,m);
    let names=[s.name,s.payerName,s.payerPhone,...(s.responsibles||[]).flatMap(r=>[r.name,r.phone])].join(" ").toLowerCase();
    return (!q||names.includes(q))&&(f==="all"||(f==="paid"&&p)||(f==="unpaid"&&!p));
  });
  $("monthTable").innerHTML=a.map(s=>{
    let p=pay(s.id,m);
    let attachment=p?.file?`<button class="attachment-chip" onclick="viewFile('${p.id}')" title="Abrir comprovante"><span>📎</span><span>Comprovante</span></button>`:`<span class="no-attachment">—</span>`;
    let action=p?`<button class="icon" onclick="openPayment('${s.id}','${m}')">✏️ Editar</button><button class="icon" onclick="unpay('${p.id}')">↩ Desmarcar</button>`:`<button class="icon" onclick="openPayment('${s.id}','${m}')">✓ Marcar pago</button>`;
    return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(p?.payerName||s.payerName)}</td><td>${esc(p?.payerPhone||s.payerPhone||"—")}</td><td>${p?money(p.amount):"—"}</td><td>${p?br(p.date):"—"}</td><td><span class="status ${p?"paid":"pending"}">${p?"Pago":"Pendente"}</span></td><td>${attachment}</td><td><div class="actions-cell">${action}</div></td></tr>`;
  }).join("");
  $("emptyMonth").classList.toggle("hidden",a.length>0);
}
function renderResponsibles(list=[]){$("responsiblesList").innerHTML=list.map((r,i)=>`<div class="responsible-row"><input class="resp-name" placeholder="Nome do responsável" maxlength="120" value="${esc(r.name||"")}"><input class="resp-phone" inputmode="numeric" maxlength="14" placeholder="Telefone" value="${esc(r.phone||"")}"><button type="button" class="icon" onclick="this.parentElement.remove()">🗑️</button></div>`).join("");document.querySelectorAll(".resp-phone").forEach(x=>x.oninput=e=>e.target.value=phone(e.target.value))}
function addResponsible(){let d=document.createElement("div");d.className="responsible-row";d.innerHTML='<input class="resp-name" placeholder="Nome do responsável" maxlength="120"><input class="resp-phone" inputmode="numeric" maxlength="14" placeholder="Telefone" maxlength="14"><button type="button" class="icon">🗑️</button>';d.querySelector("button").onclick=()=>d.remove();d.querySelector(".resp-phone").oninput=e=>e.target.value=phone(e.target.value);$("responsiblesList").appendChild(d)}
function getResponsibles(){return [...document.querySelectorAll("#responsiblesList .responsible-row")].map(r=>({name:r.querySelector(".resp-name").value.trim(),phone:phone(r.querySelector(".resp-phone").value)})).filter(r=>r.name)}
function openStudent(id){$("studentForm").reset();$("studentId").value=id||"";$("studentTitle").textContent=id?"Editar aluno":"Novo aluno";$("studentModalSubtitle").textContent=id?"Atualize os dados do aluno e seus responsáveis.":"Preencha os dados principais e os responsáveis.";if(id){let s=st(id);$("studentName").value=s.name;$("payerName").value=s.payerName;$("payerPhone").value=s.payerPhone||"";$("payerPhone").value=s.payerPhone||"";$("studentNote").value=s.note||"";renderResponsibles(s.responsibles||[])}else renderResponsibles([]);$("studentDialog").showModal()}
function editStudent(id){openStudent(id)}
async function removeStudent(id){if(confirm("Excluir este aluno e todos os pagamentos/comprovantes dele?")){for(let p of S.payments.filter(x=>x.studentId===id))await del("payments",p.id);await del("students",id);await load();toast("Aluno excluído.")}}
$("studentForm").onsubmit=async e=>{e.preventDefault();let id=$("studentId").value||uid(),s={id,name:$("studentName").value.trim(),payerName:$("payerName").value.trim(),payerPhone:phone($("payerPhone").value),note:$("studentNote").value.trim(),responsibles:getResponsibles()};await put("students",s);$("studentDialog").close();await load();toast("Aluno salvo.")};
function responsibleOptions(s, selectedName){
  const list=[];
  if(s?.payerName) list.push({name:s.payerName,phone:s.payerPhone||""});
  (s?.responsibles||[]).forEach(r=>{if(r.name && !list.some(x=>x.name.toLowerCase()===r.name.toLowerCase())) list.push({name:r.name,phone:r.phone||""})});
  return `<option value="">Selecione um responsável...</option>`+
    list.map(r=>`<option value="${esc(r.name)}" data-phone="${esc(r.phone)}" ${r.name===selectedName?"selected":""}>${esc(r.name)}${r.phone?" • "+esc(r.phone):""}</option>`).join("")+
    `<option value="__other__" ${selectedName&&!list.some(x=>x.name===selectedName)?"selected":""}>Outro responsável</option>`;
}
function syncResponsible(){
  const sel=$("payResponsible"), opt=sel.options[sel.selectedIndex];
  if(!sel || !opt) return;
  if(sel.value && sel.value!=="__other__"){
    $("payName").value=sel.value;
    $("payPhone").value=opt.dataset.phone||"";
    $("payName").readOnly=true; $("payPhone").readOnly=true;
  }else{
    $("payName").readOnly=false; $("payPhone").readOnly=false;
    if(sel.value==="__other__"){ $("payName").value=""; $("payPhone").value=""; $("payName").focus(); }
  }
}
function openPayment(id,m){m=m||$("monthView").value||(( $("homeMonthYear").value||month().slice(0,4))+"-"+($("homeMonthMonth").value||month().slice(5,7)))||month();let p=pay(id,m),s=st(id);$("paymentForm").reset();$("paymentStudentId").value=id;$("paymentMonth").value=m;$("paymentTitle").textContent=(p?"Editar":"Registrar")+" pagamento";$("paymentSubtitle").textContent=`${s.name} • ${m.slice(5,7)}/${m.slice(0,4)}`;$("payResponsible").innerHTML=responsibleOptions(s,p?.payerName||s.payerName);
$("payName").value=p?.payerName||s.payerName;$("payPhone").value=p?.payerPhone||s.payerPhone||"";
$("payName").readOnly=false;$("payPhone").readOnly=false;
$("payAmount").value=p?.amount||"";$("payDate").value=p?.date||today();
if(p?.payerName && [...$("payResponsible").options].some(o=>o.value===p.payerName)) syncResponsible();$("currentFile").innerHTML=p?.file?`<div class="attachment">📎 Comprovante atual: ${esc(p.file.name)}. Se não escolher outro, ele será mantido.</div>`:"";$("paymentDialog").showModal()}
$("paymentForm").onsubmit=async e=>{e.preventDefault();let id=$("paymentStudentId").value,m=$("paymentMonth").value,old=pay(id,m),file=$("payFile").files[0],data=old?.file||null;if(file){if(file.size>8*1024*1024){toast("O comprovante deve ter até 8 MB.");return}data={name:file.name,type:file.type,data:await read(file)}}let p={id:old?.id||uid(),studentId:id,month:m,payerName:$("payName").value.trim(),payerPhone:phone($("payPhone").value),amount:Number($("payAmount").value||0),date:$("payDate").value||today(),file:data};await put("payments",p);$("paymentDialog").close();await load();toast("Pagamento registrado para este mês.")};
function read(f){return new Promise((ok,no)=>{let r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})}
function viewFile(id){let p=S.payments.find(x=>x.id===id);if(!p?.file)return;let w=window.open("","_blank");if(!w){toast("Permita pop-ups para visualizar o comprovante.");return;}if(p.file.type==="application/pdf")w.document.write(`<iframe src="${p.file.data}" style="width:100%;height:100vh;border:0"></iframe>`);else w.document.write(`<img src="${p.file.data}" style="max-width:100%;display:block;margin:auto">`)}

function showHistory(id){let s=st(id);if(!s)return;let rows=S.payments.filter(p=>p.studentId===id).sort((a,b)=>b.month.localeCompare(a.month));let total=rows.reduce((a,p)=>a+Number(p.amount||0),0);$("historyTitle").textContent=s.name;$("historyBody").innerHTML=rows.length?`<div class="history-summary"><div><span>Pagamentos</span><b>${rows.length}</b></div><div><span>Total pago</span><b>${money(total)}</b></div><div><span>Último pagamento</span><b>${rows[0].month.slice(5,7)}/${rows[0].month.slice(0,4)}</b></div></div><div class="history-list">${rows.map(p=>`<div class="history-item"><div class="history-month"><b>${monthName(p.month)}</b><span>${p.month.slice(0,4)}</span></div><div class="history-info"><strong>${money(p.amount)}</strong><span>${br(p.date)} • ${esc(p.payerName||"Pagador não informado")}</span></div><span class="status paid">Pago</span><button class="history-edit" onclick="openPayment('${s.id}','${p.month}')">✎ Editar</button></div>`).join("")}</div>`:`<div class="history-empty"><div class="history-empty-icon">R$</div><b>Nenhum pagamento registrado</b><span>Quando uma mensalidade for paga, ela aparecerá aqui.</span></div>`;$("historyDialog").showModal()}
function monthName(m){return ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][Number(m.slice(5,7))-1]||m}
async function unpay(id){if(confirm("Desmarcar este mês como pago? O comprovante também será removido.")){await del("payments",id);await load();toast("Pagamento desmarcado.")}}
async function backup(){let d={version:2,exportedAt:new Date().toISOString(),students:S.students,payments:S.payments},b=new Blob([JSON.stringify(d)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="backup-creche-"+today()+".json";a.click();toast("Backup criado.")}
function clearStore(n){return new Promise((ok,no)=>{let r=db.transaction(n,"readwrite").objectStore(n).clear();r.onsuccess=ok;r.onerror=()=>no(r.error)})}
async function restore(f){try{let d=JSON.parse(await f.text());if(!Array.isArray(d.students)||!Array.isArray(d.payments))throw 0;if(!confirm("Restaurar este backup? Os dados atuais com os mesmos IDs serão substituídos."))return;await clearStore("students");await clearStore("payments");for(let s of d.students)await put("students",s);for(let p of d.payments)await put("payments",p);await load();toast("Backup restaurado com sucesso.")}catch(e){toast("Arquivo de backup inválido.")}}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
$("themeToggle").onclick=toggleTheme;
initTheme();
$("addStudent2").onclick=()=>openStudent();$("studentSearch").oninput=renderStudents;$("paymentSearch").oninput=renderMonth;$("payResponsible").onchange=syncResponsible;$("quickPayment").onclick=()=>{if(S.students.length)openPayment(S.students[0].id);else toast("Cadastre um aluno primeiro.")};$("quickBackup").onclick=backup;$("backupPageBtn").onclick=backup;$("restorePage").onchange=e=>e.target.files[0]&&restore(e.target.files[0]);$("addResponsible").onclick=addResponsible;const nowMonth=month(), nowYear=nowMonth.slice(0,4), nowMon=nowMonth.slice(5,7);$("homeMonthMonth").value=nowMon;let years=[];for(let y=Number(nowYear)-5;y<=Number(nowYear)+5;y++)years.push(`<option value="${y}">${y}</option>`);$("homeMonthYear").innerHTML=years.join("");$("homeMonthYear").value=nowYear;$("monthViewYear").innerHTML=years.join("");$("monthViewMonth").value=nowMon;$("monthViewYear").value=nowYear;$("homeMonthMonth").onchange=()=>{syncMonthReference();};$("homeMonthYear").onchange=()=>{syncMonthReference();};$("monthViewMonth").onchange=()=>{syncDashboardReferenceFromMonthly();};$("monthViewYear").onchange=()=>{syncDashboardReferenceFromMonthly();};$("paymentFilter").onchange=renderMonth;$("backup").onclick=backup;$("restore").onchange=e=>e.target.files[0]&&restore(e.target.files[0]);$("payerPhone").oninput=e=>e.target.value=phone(e.target.value);$("payPhone").oninput=e=>e.target.value=phone(e.target.value);document.querySelectorAll("[data-close]").forEach(x=>x.onclick=()=>x.closest("dialog").close());
openDB().then(load).catch(()=>toast("Não foi possível abrir o armazenamento local."));


// Máscaras de telefone
setTimeout(bindPhoneMasks, 0);

document.addEventListener("input", e=>{
  if(["payerPhone","payPhone","responsiblePhone"].includes(e.target.id)){
    e.target.value=formatPhone(e.target.value);
  }
});


function dashboardReferenceMonth(){
  const y=$("homeMonthYear")?.value || month().slice(0,4);
  const m=$("homeMonthMonth")?.value || month().slice(5,7);
  return `${y}-${String(m).padStart(2,"0")}`;
}
function monthlyReferenceMonth(){
  const y=$("monthViewYear")?.value || dashboardReferenceMonth().slice(0,4);
  const m=$("monthViewMonth")?.value || dashboardReferenceMonth().slice(5,7);
  return `${y}-${String(m).padStart(2,"0")}`;
}
function updateMonthlyReferenceBadge(ref){
  const el=$("monthsReferenceBadge");
  if(!el) return;
  const [y,m]=ref.split("-");
  const names=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  el.textContent=`${names[Number(m)-1]} de ${y}`;
}
function syncMonthReference(){
  const ref=dashboardReferenceMonth();
  const [y,m]=ref.split("-");
  if($("monthViewMonth")) $("monthViewMonth").value=m;
  if($("monthViewYear")) $("monthViewYear").value=y;
  updateMonthlyReferenceBadge(ref);
  renderHome();
  renderMonth();
}
function syncDashboardReferenceFromMonthly(){
  const ref=monthlyReferenceMonth();
  const [y,m]=ref.split("-");
  if($("homeMonthMonth")) $("homeMonthMonth").value=m;
  if($("homeMonthYear")) $("homeMonthYear").value=y;
  updateMonthlyReferenceBadge(ref);
  renderHome();
  renderMonth();
}



window.addEventListener('load',()=>setTimeout(syncMonthReference,100));




setTimeout(()=>{try{bindPhoneMasks();syncMonthReference();}catch(e){}},250);


