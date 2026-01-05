let datos = JSON.parse(localStorage.getItem('finanzas_vFinal_Clean')) || {
    ingFijos: [], ingVar: [], gasFijos: [], gasVar: [], tarjetas: [], subs: [],
    proyIng: Array(8).fill(0), proyGas: Array(8).fill(0), proyAho: Array(8).fill(0),
    mesGuardado: new Date().getMonth()
};

const bancos = ["ITAU", "SANTANDER", "SCOTIABANK"];
const mesesArr = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const listaMesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', () => {
    verificarMes();
    generarHeaders();
    renderAll();
});

function fmt(n) {
    return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function guardar() { localStorage.setItem('finanzas_vFinal_Clean', JSON.stringify(datos)); }

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
            datos.tarjetas = datos.tarjetas.map(t => { if(t.delay > 0) t.delay--; else t.cant--; return t; }).filter(t => t.cant > 0);
        }
        datos.mesGuardado = actual; guardar();
    }
}

function generarHeaders() {
    const hP = document.getElementById('h-meses-p');
    let d = new Date();
    hP.innerHTML = '<th>Concepto</th>';
    for(let i=0; i<8; i++) {
        hP.innerHTML += `<th>${mesesArr[d.getMonth()]}</th>`;
        d.setMonth(d.getMonth()+1);
    }
}

function agregarIngresoFijo() { const n=document.getElementById('nuevo-ingreso-fijo-n').value, m=parseFloat(document.getElementById('nuevo-ingreso-fijo-m').value); if(n&&!isNaN(m)){datos.ingFijos.push({nombre:n, monto:m}); refresh(['nuevo-ingreso-fijo-n','nuevo-ingreso-fijo-m']);}}
function agregarGastoFijo() { const n=document.getElementById('nuevo-fijo-nombre').value, m=parseFloat(document.getElementById('nuevo-fijo-monto').value); if(n&&!isNaN(m)){datos.gasFijos.push({nombre:n, monto:m}); refresh(['nuevo-fijo-nombre','nuevo-fijo-monto']);}}
function agregarIngresoVar() { const n=document.getElementById('nombre-ingreso-var').value, m=parseFloat(document.getElementById('monto-ingreso-var').value); if(n&&!isNaN(m)){datos.ingVar.push({nombre:n, monto:m}); refresh(['nombre-ingreso-var','monto-ingreso-var']);}}
function agregarGastoVar() { const n=document.getElementById('nombre-gasto-var').value, m=parseFloat(document.getElementById('monto-gasto-var').value); if(n&&!isNaN(m)){datos.gasVar.push({nombre:n, monto:m}); refresh(['nombre-gasto-var','monto-gasto-var']);}}

function agregarTarjeta() {
    const b=document.getElementById('banco-tarjeta').value, n=document.getElementById('nombre-tarjeta').value, m=parseFloat(document.getElementById('monto-tarjeta').value), c=parseInt(document.getElementById('cuotas-tarjeta').value), d=parseInt(document.getElementById('delay-tarjeta').value);
    if(n&&m&&c){ datos.tarjetas.push({banco:b, nombre:n, cuota:m/c, cant:c, totalCuotas:c, delay:d}); refresh(['nombre-tarjeta','monto-tarjeta','cuotas-tarjeta']); }
}
function agregarSub() {
    const b=document.getElementById('banco-sub').value, n=document.getElementById('nombre-sub').value, m=parseFloat(document.getElementById('monto-sub').value);
    if(n&&m){ datos.subs.push({banco:b, nombre:n, monto:m}); refresh(['nombre-sub','monto-sub']); }
}

function refresh(ids) { ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value=''; }); guardar(); renderAll(); }

function renderAll() {
    const mesNom = listaMesesNombres[new Date().getMonth()];
    const lIF = document.getElementById('lista-ingresos-fijos'), lGF = document.getElementById('lista-gastos-fijos'), lIV = document.getElementById('lista-ingresos-var'), lGV = document.getElementById('lista-gastos-var');
    lIF.innerHTML=lGF.innerHTML=lIV.innerHTML=lGV.innerHTML='';

    let sIF=0, sGF=0, sIV=0, sGV=0, sTC=0;

    datos.ingFijos.forEach((x,i)=> { sIF+=x.monto; lIF.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="datos.ingFijos.splice(${i},1);refresh([])">x</button></span></li>`; });
    datos.gasFijos.forEach((x,i)=> { sGF+=x.monto; lGF.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="datos.gasFijos.splice(${i},1);refresh([])">x</button></span></li>`; });
    datos.ingVar.forEach((x,i)=> { sIV+=x.monto; lIV.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="datos.ingVar.splice(${i},1);refresh([])">x</button></span></li>`; });
    if(datos.proyIng[0]>0) lIV.innerHTML += `<li class="item-proy-verde">INGRESOS PROYECTADOS ${mesNom} <span>$${fmt(datos.proyIng[0])}</span></li>`;
    datos.gasVar.forEach((x,i)=> { sGV+=x.monto; lGV.innerHTML+=`<li>${x.nombre} <span>$${fmt(x.monto)} <button class="btn-del" onclick="datos.gasVar.splice(${i},1);refresh([])">x</button></span></li>`; });
    if(datos.proyGas[0]>0) lGV.innerHTML += `<li class="item-proy-rojo">GASTOS PROYECTADOS ${mesNom} <span>$${fmt(datos.proyGas[0])}</span></li>`;
    
    datos.tarjetas.forEach(t => { if(t.delay===0) sTC += t.cuota; });
    datos.subs.forEach(s => sTC += s.monto);
    if(sTC > 0) lGV.innerHTML += `<li class="item-proy-rojo">TARJETAS + SUBS ${mesNom} <span>$${fmt(sTC)}</span></li>`;
    if(datos.proyAho[0]>0) lGV.innerHTML += `<li class="item-proy-rojo">AHORRO ${mesNom} <span>$${fmt(datos.proyAho[0])}</span></li>`;

    document.getElementById('subtotal-ing-fijo').innerText = `$${fmt(sIF)}`;
    document.getElementById('subtotal-ing-var').innerText = `$${fmt(sIV + datos.proyIng[0])}`;
    document.getElementById('subtotal-gas-fijo').innerText = `$${fmt(sGF)}`;
    document.getElementById('subtotal-gas-var').innerText = `$${fmt(sGV + sTC + datos.proyGas[0] + datos.proyAho[0])}`;

    const totI = sIF + sIV + datos.proyIng[0], totG = sGF + sGV + sTC + datos.proyGas[0] + datos.proyAho[0];
    document.getElementById('total-ingresos-v').innerText = fmt(totI);
    document.getElementById('total-gastos-v').innerText = fmt(totG);
    document.getElementById('dinero-disponible').innerText = fmt(totI - totG);

    renderTarjetasPorBanco();
    renderProyecciones();
}

function renderTarjetasPorBanco() {
    const container = document.getElementById('tablas-bancos-container');
    container.innerHTML = '';
    let d = new Date();
    let headerMeses = '<th>Descripción</th><th>Cuota/Estado</th>';
    for(let i=0; i<8; i++) { headerMeses += `<th>${mesesArr[d.getMonth()]}</th>`; d.setMonth(d.getMonth()+1); }

    bancos.forEach(banco => {
        let totalMesActual = 0, filas = '', totalesMensuales = Array(8).fill(0);
        
        // SUSCRIPCIONES (Corregido: ahora con botón eliminar y edición)
        datos.subs.filter(s => s.banco === banco).forEach((s, realIdx) => {
            const indexOriginal = datos.subs.findIndex(x => x === s);
            filas += `<tr style="color:#2c3e50">
                <td><button class="btn-del" onclick="datos.subs.splice(${indexOriginal},1);refresh([])">x</button> (Sub) ${s.nombre}</td>
                <td><input type="number" class="input-edit-tabla" step="0.01" value="${s.monto.toFixed(2)}" onchange="editarSub(${indexOriginal}, this.value)"></td>`;
            for(let j=0; j<8; j++) { filas += `<td>$${fmt(s.monto)}</td>`; totalesMensuales[j] += s.monto; }
            filas += '</tr>'; totalMesActual += s.monto;
        });

        // TARJETAS
        datos.tarjetas.filter(t => t.banco === banco).forEach(t => {
            let cuotaStr = t.delay === 0 ? `${t.totalCuotas - t.cant + 1}/${t.totalCuotas}` : `Inicia en ${t.delay}m`;
            if(t.delay === 0) totalMesActual += t.cuota;
            filas += `<tr><td><button class="btn-del" onclick="eliminarTarjeta('${t.nombre}', '${t.banco}')">x</button> ${t.nombre}</td><td>${cuotaStr}</td>`;
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

function editarSub(idx, valor) {
    let nuevo = parseFloat(valor);
    if(!isNaN(nuevo)) { datos.subs[idx].monto = nuevo; guardar(); renderAll(); }
}

function eliminarTarjeta(nombre, banco) { 
    datos.tarjetas = datos.tarjetas.filter(t => !(t.nombre === nombre && t.banco === banco)); 
    refresh([]); 
}

function renderProyecciones() {
    const bp = document.getElementById('b-proyecciones'); if(!bp) return;
    bp.innerHTML = '';
    let sIF=0; datos.ingFijos.forEach(x=>sIF+=x.monto);
    let sGF=0; datos.gasFijos.forEach(x=>sGF+=x.monto);
    let sSubs=0; datos.subs.forEach(x=>sSubs+=x.monto);
    const rows = [
        {n:"Ingresos Fijos", d:Array(8).fill(sIF)}, {n:"Ingresos Proyectados", d:datos.proyIng, t:'i', k:'ing', c:'txt-green'}, 
        {n:"Gastos Fijos", d:Array(8).fill(sGF), c:'txt-red'}, {n:"Gastos Proyectados", d:datos.proyGas, t:'i', k:'gas', c:'txt-red'}, 
        {n:"Tarjetas + Subs", d:Array(8).fill(sSubs), c:'txt-red'}, {n:"Ahorro", d:datos.proyAho, t:'i', k:'aho', c:'txt-red'}, 
        {n:"SALDO FINAL", d:Array(8).fill(0), c:'txt-green'}
    ];
    for(let j=0; j<8; j++){ 
        datos.tarjetas.forEach(t => { if(j>=t.delay && j<(t.delay+t.cant)) rows[4].d[j] += t.cuota; }); 
        rows[6].d[j] = (rows[0].d[j] + rows[1].d[j]) - (rows[2].d[j] + rows[3].d[j] + rows[4].d[j] + rows[5].d[j]); 
    }
    rows.forEach(r => {
        let h = `<tr class="${r.c||''}"><td>${r.n}</td>`;
        r.d.forEach((v, i) => h += r.t === 'i' ? `<td><input type="number" step="0.01" value="${v.toFixed(2)}" onchange="updProy('${r.k}',${i},this.value)"></td>` : `<td>$${fmt(v)}</td>`);
        bp.innerHTML += h + '</tr>';
    });
}

function updProy(k,i,v){ let n=parseFloat(v)||0; if(k==='ing')datos.proyIng[i]=n; if(k==='gas')datos.proyGas[i]=n; if(k==='aho')datos.proyAho[i]=n; guardar(); renderAll(); }
function showSection(id){ ['inicio','tarjetas','proyecciones'].forEach(s => document.getElementById(s).style.display = (s === id ? 'block' : 'none')); }