const KEY='simetria_demo_citas';

const DOCTORES={
  martinez:{id:'martinez',nombre:'Dr. Martínez'},
  perez:{id:'perez',nombre:'Dr. Pérez'},
  pepito:{id:'pepito',nombre:'Dr. Pepito'}
};

const especialidades=['Odontología General','Estética Dental','Ortodoncia','Implantología','Cirugía Oral','Rehabilitación Oral','Endodoncia','ATM y Bruxismo','Estética Facial'];
const horas=['09:30','10:00','10:30','11:00','11:30','12:00','15:00','15:30','16:00','16:30','17:00','17:30'];

function citas(){
  try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return []}
}
function guardar(x){localStorage.setItem(KEY,JSON.stringify(x))}
function doctorPorId(id){return DOCTORES[id]||null}
function idDoctorDeCita(c){
  if(c.doctorId&&DOCTORES[c.doctorId])return c.doctorId;
  const encontrado=Object.values(DOCTORES).find(d=>d.nombre===c.doctor);
  return encontrado?encontrado.id:'';
}
function escapar(v=''){
  return String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function iniciarReserva(){
  const especialidad=document.getElementById('especialidad');
  const doctor=document.getElementById('doctor');
  const fecha=document.getElementById('fecha');
  const form=document.getElementById('reserva');

  if(especialidad && especialidad.options.length<=1){
    especialidades.forEach(e=>especialidad.add(new Option(e,e)));
  }

  if(fecha){
    const hoy=new Date();
    hoy.setDate(hoy.getDate()+1);
    fecha.min=hoy.toISOString().slice(0,10);
    if(!fecha.value)fecha.value=fecha.min;
  }

  renderHoras();
  doctor?.addEventListener('change',renderHoras);
  fecha?.addEventListener('change',renderHoras);

  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const slot=document.querySelector('.slot.selected');
    const nombre=document.getElementById('nombre').value.trim();
    const telefono=document.getElementById('telefono').value.trim();
    const email=document.getElementById('email').value.trim();
    const doctorId=doctor.value;
    const doc=doctorPorId(doctorId);

    if(!especialidad.value||!doc||!fecha.value||!nombre||!telefono){
      alert('Completa especialidad, doctor, fecha, nombre y teléfono.');return;
    }
    if(!slot){alert('Selecciona una hora disponible.');return;}

    const data={
      id:Date.now(),
      creadoEn:new Date().toISOString(),
      especialidad:especialidad.value,
      doctorId:doc.id,
      doctor:doc.nombre,
      fecha:fecha.value,
      hora:slot.dataset.hora,
      nombre,
      telefono,
      email,
      estado:'Pendiente'
    };

    const x=citas();
    const ocupada=x.some(c=>idDoctorDeCita(c)===doctorId&&c.fecha===data.fecha&&c.hora===data.hora&&c.estado!=='Cancelada');
    if(ocupada){alert('Esa hora acaba de ocuparse con este doctor. Elige otra.');renderHoras();return;}

    x.push(data);
    guardar(x);
    document.getElementById('resultado').innerHTML=`<div class="notice"><b>Hora registrada.</b> ${escapar(nombre)} reservó con <b>${escapar(doc.nombre)}</b> el ${escapar(data.fecha)} a las <b>${escapar(data.hora)}</b>. Ya aparece en la central de ${escapar(doc.nombre)}.</div>`;
    form.reset();
    especialidad.value='';
    doctor.value=doctorId;
    fecha.value=data.fecha;
    renderHoras();
  });
}

function renderHoras(){
  const box=document.getElementById('horas');
  if(!box)return;
  const doctorId=document.getElementById('doctor')?.value||'';
  const fecha=document.getElementById('fecha')?.value||'';

  if(!doctorId||!fecha){
    box.innerHTML='<p class="small">Primero selecciona un doctor y una fecha.</p>';
    return;
  }

  const ocupadas=citas()
    .filter(c=>idDoctorDeCita(c)===doctorId&&c.fecha===fecha&&c.estado!=='Cancelada')
    .map(c=>c.hora);

  box.innerHTML=horas.map(h=>`<button type="button" class="slot" data-hora="${h}" ${ocupadas.includes(h)?'disabled':''}>${ocupadas.includes(h)?'Ocupada':h}</button>`).join('');
  box.querySelectorAll('.slot:not(:disabled)').forEach(b=>b.addEventListener('click',()=>{
    box.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
  }));
}

function doctorActualId(){
  const params=new URLSearchParams(location.search);
  const id=params.get('doctor')||'';
  return DOCTORES[id]?id:'';
}

function renderPanel(){
  const doctorId=doctorActualId();
  const doc=doctorPorId(doctorId);
  if(!doc){location.href='doctor.html';return;}

  document.getElementById('doctorName').textContent=doc.nombre;
  document.title=`Central de ${doc.nombre} — Simetría`;
  tabla();

  window.addEventListener('storage',ev=>{
    if(ev.key===KEY)tabla();
  });
}

function tabla(){
  const body=document.getElementById('citasBody');
  if(!body)return;
  const doctorId=doctorActualId();
  const x=citas()
    .filter(c=>idDoctorDeCita(c)===doctorId)
    .sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));

  const contador=document.getElementById('totalCitas');
  if(contador)contador.textContent=String(x.filter(c=>c.estado!=='Cancelada').length);

  body.innerHTML=x.length?x.map(c=>`<tr>
    <td>${escapar(c.fecha)}<br><b>${escapar(c.hora)}</b></td>
    <td><b>${escapar(c.nombre)}</b><br><span class="small">${escapar(c.telefono)}${c.email?'<br>'+escapar(c.email):''}</span></td>
    <td>${escapar(c.especialidad)}</td>
    <td><select onchange="estado(${Number(c.id)},this.value)">
      <option ${c.estado==='Pendiente'?'selected':''}>Pendiente</option>
      <option ${c.estado==='Confirmada'?'selected':''}>Confirmada</option>
      <option ${c.estado==='Atendida'?'selected':''}>Atendida</option>
      <option ${c.estado==='Cancelada'?'selected':''}>Cancelada</option>
    </select></td>
    <td><button class="btn ghost" onclick="eliminar(${Number(c.id)})">Eliminar</button></td>
  </tr>`).join(''):`<tr><td colspan="5"><b>No hay horas registradas todavía.</b><br><span class="small">Cuando un paciente seleccione este doctor en el formulario, la cita aparecerá aquí.</span></td></tr>`;
}

function estado(id,v){
  const doctorId=doctorActualId();
  const x=citas();
  const c=x.find(c=>Number(c.id)===Number(id)&&idDoctorDeCita(c)===doctorId);
  if(c)c.estado=v;
  guardar(x);
  tabla();
}

function eliminar(id){
  const doctorId=doctorActualId();
  if(confirm('¿Eliminar esta reserva demo?')){
    guardar(citas().filter(c=>!(Number(c.id)===Number(id)&&idDoctorDeCita(c)===doctorId)));
    tabla();
  }
}