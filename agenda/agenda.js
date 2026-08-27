const KEY='simetria_demo_citas';
const SESSION_KEY='simetria_demo_doctor';
const doctores=['Dr. Martínez','Dr. Pérez','Dr. Pepito'];
const especialidades=['Odontología General','Estética Dental','Ortodoncia','Implantología','Cirugía Oral','Rehabilitación Oral','Endodoncia','ATM y Bruxismo','Estética Facial'];
const horas=['09:30','10:00','10:30','11:00','11:30','12:00','15:00','15:30','16:00','16:30','17:00','17:30'];

function citas(){return JSON.parse(localStorage.getItem(KEY)||'[]')}
function guardar(x){localStorage.setItem(KEY,JSON.stringify(x))}
function poblar(id,arr){const e=document.getElementById(id);if(e)e.innerHTML='<option value="">Seleccionar…</option>'+arr.map(x=>`<option>${x}</option>`).join('')}

function iniciarReserva(){
  poblar('especialidad',especialidades);
  poblar('doctor',doctores);
  const f=document.getElementById('fecha');
  if(f){const hoy=new Date();hoy.setDate(hoy.getDate()+1);f.min=hoy.toISOString().slice(0,10);f.value=f.min}
  renderHoras();
  ['doctor','fecha'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderHoras));
  document.getElementById('reserva')?.addEventListener('submit',e=>{
    e.preventDefault();
    const slot=document.querySelector('.slot.selected');
    if(!slot)return alert('Selecciona una hora.');
    const data={id:Date.now(),especialidad:especialidad.value,doctor:doctor.value,fecha:fecha.value,hora:slot.dataset.hora,nombre:nombre.value,telefono:telefono.value,email:email.value,estado:'Pendiente'};
    if(!data.especialidad||!data.doctor||!data.nombre||!data.telefono)return alert('Completa los campos obligatorios.');
    const x=citas();
    if(x.some(c=>c.doctor===data.doctor&&c.fecha===data.fecha&&c.hora===data.hora))return alert('Esa hora ya fue reservada para este profesional.');
    x.push(data);guardar(x);
    document.getElementById('resultado').innerHTML=`<div class="notice"><b>Demo:</b> reserva creada con <b>${data.doctor}</b> para ${data.nombre}, ${data.fecha} a las ${data.hora}. La cita aparecerá únicamente en el panel de ese doctor.</div>`;
    renderHoras();
  });
}

function renderHoras(){
  const box=document.getElementById('horas');if(!box)return;
  const d=document.getElementById('doctor')?.value,f=document.getElementById('fecha')?.value;
  const ocupadas=citas().filter(c=>c.doctor===d&&c.fecha===f&&c.estado!=='Cancelada').map(c=>c.hora);
  box.innerHTML=horas.map(h=>`<button type="button" class="slot" data-hora="${h}" ${ocupadas.includes(h)?'disabled':''}>${ocupadas.includes(h)?'Ocupada':h}</button>`).join('');
  box.querySelectorAll('.slot:not(:disabled)').forEach(b=>b.onclick=()=>{box.querySelectorAll('.slot').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
}

function seleccionarDoctor(nombre){
  sessionStorage.setItem(SESSION_KEY,nombre);
  window.location.href='panel.html';
}

function doctorActual(){return sessionStorage.getItem(SESSION_KEY)||''}

function renderPanel(){
  const doctor=doctorActual();
  if(!doctor||!doctores.includes(doctor)){window.location.href='doctor.html';return}
  const t=document.getElementById('doctorName');if(t)t.textContent=doctor;
  tabla();
}

function tabla(){
  const body=document.getElementById('citasBody');if(!body)return;
  const doctor=doctorActual();
  const x=citas().filter(c=>c.doctor===doctor).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  body.innerHTML=x.length?x.map(c=>`<tr><td>${c.fecha}<br><b>${c.hora}</b></td><td>${c.nombre}<br><span class="small">${c.telefono}${c.email?'<br>'+c.email:''}</span></td><td>${c.especialidad}</td><td><select onchange="estado(${c.id},this.value)"><option ${c.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${c.estado==='Confirmada'?'selected':''}>Confirmada</option><option ${c.estado==='Atendida'?'selected':''}>Atendida</option><option ${c.estado==='Cancelada'?'selected':''}>Cancelada</option></select></td><td><button class="btn ghost" onclick="eliminar(${c.id})">Eliminar</button></td></tr>`).join(''):'<tr><td colspan="5">Todavía no hay reservas para este doctor.</td></tr>';
}

function estado(id,v){
  const doctor=doctorActual(),x=citas();
  const c=x.find(c=>c.id===id&&c.doctor===doctor);
  if(c)c.estado=v;
  guardar(x);tabla();
}

function eliminar(id){
  const doctor=doctorActual();
  if(confirm('¿Eliminar esta reserva demo?')){guardar(citas().filter(c=>!(c.id===id&&c.doctor===doctor)));tabla()}
}

function cerrarSesion(){sessionStorage.removeItem(SESSION_KEY);window.location.href='doctor.html'}