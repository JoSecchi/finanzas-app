// 1. CONFIGURACIÓN DE FIREBASE (PEGA TUS DATOS AQUÍ)
const firebaseConfig = {
    apiKey: "TAIzaSyDdT-qJImDZ062JYlD_cN2y301M8XOkLd0",
    authDomain: "gestion-de-gastos-6e5a3.firebaseapp.com",
    databaseURL: "https://gestion-de-gastos-6e5a3-default-rtdb.firebaseio.com/",
    projectId: "gestion-de-gastos-6e5a3",
    storageBucket: "gestion-de-gastos-6e5a3.firebasestorage.app",
    messagingSenderId: "1048329957738",
    appId: "1:1048329957738:web:8bc4051fa30431f6813513"
};

// 2. IMPORTACIÓN DE MÓDULOS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'finanzas_data'); 

let datos = {
    ingFijos: [], ingVar: [], gasFijos: [], gasVar: [], tarjetas: [], subs: [],
    proyIng: Array(8).fill(0), proyGas: Array(8).fill(0), proyAho: Array(8).fill(0),
    mesGuardado: new Date().getMonth()
};

// 3. SINCRONIZACIÓN EN TIEMPO REAL
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        datos = data;
        // Validaciones de seguridad para arreglos
        if(!Array.isArray(datos.proyIng)) datos.proyIng = Array(8).fill(0);
        if(!Array.isArray(datos.proyGas)) datos.proyGas = Array(8).fill(0);
        if(!Array.isArray(datos.proyAho)) datos.proyAho = Array(8).fill(0);
        
        verificarMes();
        renderAll();
    } else {
        // Si la base de datos está vacía, inicializarla
        guardar();
    }
});

const bancos = ["ITAU", "SANTANDER", "SCOTIABANK"];
const mesesArr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const listaMesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fmt(n) {
    return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function guardar() {
    set(dbRef, datos);
}

function verificarMes() {
    const actual = new Date().getMonth();
    if(actual !== datos.mesGuardado) {
        let diff = actual - datos.mesGuardado;
        if(diff < 0) diff += 12;
        for(let i=0; i<diff; i++) {
            datos.proyIng.shift(); datos.proyIng.push(0);
            datos.proyGas.shift(); datos.proyGas.push(0);
            datos.proyAho.shift(); datos.proyAho.push(0);
            datos.ingVar = []; datos.gasVar = []; 
            datos.tarjetas = (datos.tarjetas || []).map(t => { 
                if(t.delay > 0) t.delay--; else t.cant--; return t; 
            }).filter(t => t.cant > 0);
        }
        datos.mesGuardado = actual; 
        guardar();
    }
}

// 4. FUNCIONES DE CARGA (EXPUESTAS A WINDOW)
window.agregarIngresoFijo = () => { 
    const n=document.getElementById('nuevo-ingreso-fijo-n').value, m=parseFloat(document.getElementById('nuevo-ingreso-fijo-m').value); 
    if(n&&!isNaN(m)){ if(!datos.ingFijos) datos.ingFijos=[]; datos.ingFijos.push({nombre:n, monto:m}); refresh(['nuevo-ingreso-fijo-n','nuevo-ingreso-fijo-m']); }
};

window.agregarGastoFijo = () => { 
    const n=document.getElementById('nuevo-fijo-nombre').value, m=parseFloat(document.getElementById('nuevo-fijo-monto').value); 
    if(n&&!isNaN(m)){ if(!datos.gasFijos) datos.gasFijos=[]; datos.gasFijos.push({nombre:n, monto:m}); refresh(['nuevo-fijo-nombre','nuevo-fijo-monto']); }
};

window.agregarIngresoVar = () => { 
    const n=document.getElementById('nombre-ingreso-var').value, m=parseFloat(document.getElementById('monto-ingreso-var').value); 
    if(n&&!isNaN(m)){ if(!datos.ingVar) datos.ingVar=[]; datos.ingVar.push({nombre:n, monto:m}); refresh(['nombre-ingreso-var','monto-ingreso-var']); }
};

window.agregarGastoVar = () => { 
    const n=document.getElementById('nombre-gasto-var').value, m=parseFloat(document.getElementById('monto-gasto-var').value); 
    if(n&&!isNaN(m)){ if(!datos.gasVar) datos.gasVar=[]; datos.gasVar.push({nombre:n, monto:m}); refresh(['nombre-gasto-var','monto-gasto-var']); }
};

window.agregarTarjeta = () => {
    const b=document.getElementById('banco-tarjeta').value, n=document.getElementById('nombre-tarjeta').value, m=parseFloat(document.getElementById('monto-tarjeta').value), c=parseInt(document.getElementById('cuotas-tarjeta').value), d=parseInt(document.getElementById('delay-tarjeta').value);
    if(n&&m&&c){ if(!datos.tarjetas) datos.tarjetas=[]; datos.tarjetas.push({banco:b, nombre:n, cuota:m/c, cant:c, totalCuotas:c, delay:d}); refresh(['nombre-tarjeta','monto-tarjeta','cuotas-tarjeta']); }
};

window.agregarSub = () => {
    const b=document.getElementById('banco-sub').value, n=document.getElementById('nombre-sub').value, m=parseFloat(document.getElementById('monto-sub').value);
    if(n&&m){ if(!datos.subs) datos.subs=[]; datos.subs.push({banco:b, nombre:n, monto:m}); refresh(['nombre-sub','monto-sub']); }
};

window.eliminarTarjeta = (nombre, banco) => { 
    datos.tarjetas = datos.tarjetas.filter(t => !(t.nombre === nombre && t.banco === banco)); 
    guardar(); 
};

window.editarSub = (idx, valor) => {
    let nuevo = parseFloat(valor);
    if(!isNaN(nuevo)) { datos.subs[idx].monto = nuevo; guardar(); }
};

function refresh(ids) { 
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value=''; }); 
    guardar(); 
}

// 5. RENDERIZADO
function renderAll() {
    const mesNom = listaMesesNombres[new Date().getMonth()];
    const lIF = document.getElementById('lista-ingresos-fijos'), lGF = document.getElementById('lista-gastos-fijos'), lIV = document.getElementById('lista-ingresos-var'), lGV = document.getElementById('lista-gastos-var');
    if(!lIF) return;
    lIF.innerHTML=lGF.innerHTML=lIV.innerHTML=lGV.innerHTML='';

    let sIF=0, sGF=0, sIV=0, sGV=0, sTC=0;

    (datos.ingFijos || []).forEach((x,i)=> { sIF+=x.monto; lIF.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="window.eliminarItem('ingFijos',${i})">x</button></span></li>`; });
    (datos.gasFijos || []).forEach((x,i)=> { sGF+=x.monto; lGF.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="window.eliminarItem('gasFijos',${i})">x</button></span></li>`; });
    (datos.ingVar || []).forEach((x,i)=> { sIV+=x.monto; lIV.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="window.eliminarItem('ingVar',${i})">x</button></span></li>`; });
    
    if(datos.proyIng?.[0]>0) lIV.innerHTML += `<li class="item-proy-verde">INGRESOS PROYECTADOS ${mesNom} <span>$${fmt(datos.proyIng[0])}</span></li>`;

    (datos.gasVar || []).forEach((x,i)=> { sGV+=x.monto; lGV.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="window.eliminarItem('gasVar',${i})">x</button></span></li>`; });
    
    if(datos.proyGas?.[0]>0) lGV.innerHTML += `<li class="item-proy-rojo">GASTOS PROYECTADOS ${mesNom} <span>$${fmt(datos.proyGas[0])}</span></li>`;
    
    (datos.tarjetas || []).forEach(t => { if(t.delay===0) sTC += t.cuota; });
    (datos.subs || []).forEach(s => sTC += s.monto);
    if(sTC > 0) lGV.innerHTML += `<li class="item-proy-rojo">TARJETAS + SUBS ${mesNom} <span>$${fmt(sTC)}</span></li>`;
    if(datos.proyAho?.[0]>0) lGV.innerHTML += `<li class="item-proy-rojo">AHORRO ${mesNom} <span>$${fmt(datos.proyAho[0])}</span></li>`;

    document.getElementById('subtotal-ing-fijo').innerText = `$${fmt(sIF)}`;
    document.getElementById('subtotal-ing-var').innerText = `$${fmt(sIV + (datos.proyIng?.[0]||0))}`;
    document.getElementById('subtotal-gas-fijo').innerText = `$${fmt(sGF)}`;
    document.getElementById('subtotal-gas-var').innerText = `$${fmt(sGV + sTC + (datos.proyGas?.[0]||0) + (datos.proyAho?.[0]||0))}`;

    const totI = sIF + sIV + (datos.proyIng?.[0]||0), totG = sGF + sGV + sTC + (datos.proyGas?.[0]||0) + (datos.proyAho?.[0]||0);
    document.getElementById('total-ingresos-v').innerText = fmt(totI);
    document.getElementById('total-gastos-v').innerText = fmt(totG);
    document.getElementById('dinero-disponible').innerText = fmt(totI - totG);

    renderTarjetasPorBanco();
    renderProyecciones();
}

window.eliminarItem = (lista, idx) => { datos[lista].splice(idx,1); guardar(); };

function renderTarjetasPorBanco() {
    const container = document.getElementById('tablas-bancos-container');
    if(!container) return;
    container.innerHTML = '';
    let d = new Date();
    let headerMeses = '<th>Descripción</th><th>Cuota/Estado</th>';
    for(let i=0; i<8; i++) { headerMeses += `<th>${mesesArr[d.getMonth()]}</th>`; d.setMonth(d.getMonth()+1); }

    bancos.forEach(banco => {
        let totalMesActual = 0, filas = '', totalesMensuales = Array(8).fill(0);
        (datos.subs || []).filter(s => s.banco === banco).forEach((s) => {
            const globalIdx = datos.subs.indexOf(s);
            filas += `<tr style="color:#2c3e50"><td><button class="btn-del" onclick="window.eliminarItem('subs',${globalIdx})">x</button> (Sub) ${s.nombre}</td>
                <td><input type="number" class="input-edit-tabla" step="0.01" value="${s.monto.toFixed(2)}" onchange="window.editarSub(${globalIdx}, this.value)"></td>`;
            for(let j=0; j<8; j++) { filas += `<td>$${fmt(s.monto)}</td>`; totalesMensuales[j] += s.monto; }
            filas += '</tr>'; totalMesActual += s.monto;
        });
        (datos.tarjetas || []).filter(t => t.banco === banco).forEach(t => {
            let cuotaStr = t.delay === 0 ? `${t.totalCuotas - t.cant + 1}/${t.totalCuotas}` : `Inicia en ${t.delay}m`;
            if(t.delay === 0) totalMesActual += t.cuota;
            filas += `<tr><td><button class="btn-del" onclick="window.eliminarTarjeta('${t.nombre}', '${t.banco}')">x</button> ${t.nombre}</td><td>${cuotaStr}</td>`;
            for(let j=0; j<8; j++) {
                if(j>=t.delay && j<(t.delay+t.cant)) { filas += `<td>$${fmt(t.cuota)}</td>`; totalesMensuales[j] += t.cuota; }
                else filas += '<td>-</td>';
            }
            filas += '</tr>';
        });
        let footer = '<td>TOTAL</td><td>-</td>';
        totalesMensuales.forEach(v => footer += `<td>$${fmt(v)}</td>`);
        container.innerHTML += `<div class="banco-card banco-${banco.toLowerCase()}"><div class="banco-header"><span>${banco}</span><span>Este mes: $${fmt(totalMesActual)}</span></div><details><summary>Detalle de consumos</summary><div class="table-container"><table><thead><tr>${headerMeses}</tr></thead><tbody>${filas}</tbody><tr class="fila-totales">${footer}</tr></table></div></details></div>`;
    });
}

function renderProyecciones() {
    const bp = document.getElementById('b-proyecciones'); if(!bp) return;
    bp.innerHTML = '';
    let sIF=0; (datos.ingFijos || []).forEach(x=>sIF+=x.monto);
    let sGF=0; (datos.gasFijos || []).forEach(x=>sGF+=x.monto);
    let sSubs=0; (datos.subs || []).forEach(x=>sSubs+=x.monto);
    const rows = [
        {n:"Ingresos Fijos", d:Array(8).fill(sIF)}, {n:"Ingresos Proyectados", d:datos.proyIng, t:'i', k:'ing', c:'txt-green'}, 
        {n:"Gastos Fijos", d:Array(8).fill(sGF), c:'txt-red'}, {n:"Gastos Proyectados", d:datos.proyGas, t:'i', k:'gas', c:'txt-red'}, 
        {n:"Tarjetas + Subs", d:Array(8).fill(sSubs), c:'txt-red'}, {n:"Ahorro", d:datos.proyAho, t:'i', k:'aho', c:'txt-red'}, 
        {n:"SALDO FINAL", d:Array(8).fill(0), c:'txt-green'}
    ];
    for(let j=0; j<8; j++){ 
        (datos.tarjetas || []).forEach(t => { if(j>=t.delay && j<(t.delay+t.cant)) rows[4].d[j] += t.cuota; }); 
        rows[6].d[j] = (rows[0].d[j] + (rows[1].d[j]||0)) - (rows[2].d[j] + (rows[3].d[j]||0) + rows[4].d[j] + (rows[5].d[j]||0)); 
    }
    rows.forEach(r => {
        let h = `<tr class="${r.c||''}"><td>${r.n}</td>`;
        r.d.forEach((v, i) => h += r.t === 'i' ? `<td><input type="number" step="0.01" value="${(v||0).toFixed(2)}" onchange="window.updProy('${r.k}',${i},this.value)"></td>` : `<td>$${fmt(v)}</td>`);
        bp.innerHTML += h + '</tr>';
    });
}

window.updProy = (k,i,v) => { let n=parseFloat(v)||0; if(k==='ing')datos.proyIng[i]=n; if(k==='gas')datos.proyGas[i]=n; if(k==='aho')datos.proyAho[i]=n; guardar(); };
window.showSection = (id) => { ['inicio','tarjetas','proyecciones'].forEach(s => document.getElementById(s).style.display = (s === id ? 'block' : 'none')); };