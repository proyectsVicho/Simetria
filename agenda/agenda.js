const KEY='simetria_demo_citas';

const DOCTORES={
  martinez:{id:'martinez',nombre:'Dr. Martínez'},
  perez:{id:'perez',nombre:'Dr. Pérez'},
  pepito:{id:'pepito',nombre:'Dr. Pepito'}
};

const especialidades=['Odontología General','Estética Dental','Ortodoncia','Implantología','Cirugía Oral','Rehabilitación Oral','Endodoncia','ATM y Bruxismo','Estética Facial'];
const horas=['09:30','10:00','10:30','11:00','11:30','12:00','15:00','15:30','16:00','16:30','17:00','17:30'];
let PANEL_DOCTOR_ID='';

function citas(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}}
function guardar(x){localStorage.setItem(KEY,JSON.stringify(x))}
function doctorPorId(id){return DOCTORES[id]||null}
function idDoctorDeCita(c){if(c.doctorId&&DOCTORES[c.doctorId])return c.doctorId;const d=Object.values(DOCTORES).find(x=>x.nombre===c.doctor);return d?d.id:''}
function escapar(v=''){return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

function iniciarReserva(){
  const esp=document.getElementById('especialidad');
  const docSel=document.getElementById('doctor');
  const fecha=document.getElementById('fecha');
  const form=document.getElementById('reserva');
  if(esp&&esp.options.length<=1)especialidades.forEach(e=>esp.add(new Option(e,e)));
  if(fecha){const h=new Date();h.setDate(h.getDate()+1);fecha.min=h.toISOString().slice(0,10);if(!fecha.value)fecha.value=fecha.min}
  renderHoras();docSel?.addEventListener('change',renderHoras);fecha?.addEventListener('change',renderHoras);
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const slot=document.querySelector('.slot.selected');
    const doctorId=docSel.value;const doc=doctorPorId(doctorId);
    const nombre=document.getElementById('nombre').value.trim();
    const telefono=document.getElementById('telefono').value.trim();
    const email=document.getElementById('email').value.trim();
    if(!esp.value||!doc||!fecha.value||!nombre||!telefono){alert('Completa especialidad, doctor, fecha, nombre y teléfono.');return}
    if(!slot){alert('Selecciona una hora disponible.');return}
    const data={id:Date.now(),especialidad:esp.value,doctorId,doctor:doc.nombre,fecha:fecha.value,hora:slot.dataset.hora,nombre,telefono,email,estado:'Pendiente'};
    const x=citas();
    if(x.some(c=>idDoctorDeCita(c)===doctorId&&c.fecha===data.fecha&&c.hora===data.hora&&c.estado!=='Cancelada')){alert('Esa hora ya está ocupada para este doctor.');renderHoras();return}
    x.push(data);guardar(x);
    document.getElementById('resultado').innerHTML=`<div class="notice"><b>Hora registrada.</b> ${escapar(nombre)} reservó con <b>${escapar(doc.nombre)}</b> el ${escapar(data.fecha)} a las <b>${escapar(data.hora)}</b>. Ya aparece en su central.</div>`;
    renderHoras();
  });
}

function renderHoras(){
  const box=document.getElementById('horas');if(!box)return;
  const doctorId=document.getElementById('doctor')?.value||'';
  const fecha=document.getElementById('fecha')?.value||'';
  if(!doctorId||!fecha){box.innerHTML='<p class="small">Primero selecciona un doctor y una fecha.</p>';return}
  const ocupadas=citas().filter(c=>idDoctorDeCita(c)===doctorId&&c.fecha===fecha&&c.estado!=='Cancelada').map(c=>c.hora);
  box.innerHTML=horas.map(h=>`<button type="button" class="slot" data-hora="${h}" ${ocupadas.includes(h)?'disabled':''}>${ocupadas.includes(h)?'Ocupada':h}</button>`).join('');
  box.querySelectorAll('.slot:not(:disabled)').forEach(b=>b.onclick=()=>{box.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
}

function renderPanelFijo(doctorId){
  const doc=doctorPorId(doctorId);if(!doc)return;
  PANEL_DOCTOR_ID=doctorId;
  const n=document.getElementById('doctorName');if(n)n.textContent=doc.nombre;
  document.title=`Central de ${doc.nombre} — Simetría`;
  tablaDoctor();
  window.addEventListener('storage',e=>{if(e.key===KEY)tablaDoctor()});
}

function tablaDoctor(){
  const body=document.getElementById('citasBody');if(!body||!PANEL_DOCTOR_ID)return;
  const x=citas().filter(c=>idDoctorDeCita(c)===PANEL_DOCTOR_ID).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  const contador=document.getElementById('totalCitas');if(contador)contador.textContent=String(x.filter(c=>c.estado!=='Cancelada').length);
  body.innerHTML=x.length?x.map(c=>`<tr><td>${escapar(c.fecha)}<br><b>${escapar(c.hora)}</b></td><td><b>${escapar(c.nombre)}</b><br><span class="small">${escapar(c.telefono)}${c.email?'<br>'+escapar(c.email):''}</span></td><td>${escapar(c.especialidad)}</td><td><select onchange="estado(${Number(c.id)},this.value)"><option ${c.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${c.estado==='Confirmada'?'selected':''}>Confirmada</option><option ${c.estado==='Atendida'?'selected':''}>Atendida</option><option ${c.estado==='Cancelada'?'selected':''}>Cancelada</option></select></td><td><button class="btn ghost" onclick="eliminar(${Number(c.id)})">Eliminar</button></td></tr>`).join(''):'<tr><td colspan="5"><b>No hay horas registradas todavía.</b><br><span class="small">Cuando un paciente reserve con este doctor, aparecerá aquí.</span></td></tr>';
}

function estado(id,v){const x=citas();const c=x.find(c=>Number(c.id)===Number(id)&&idDoctorDeCita(c)===PANEL_DOCTOR_ID);if(c)c.estado=v;guardar(x);tablaDoctor()}
function eliminar(id){if(confirm('¿Eliminar esta reserva demo?')){guardar(citas().filter(c=>!(Number(c.id)===Number(id)&&idDoctorDeCita(c)===PANEL_DOCTOR_ID)));tablaDoctor()}}
