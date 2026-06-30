/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/JavaScript.js to edit this template
 */

async function loadComponent(id,file){
    const response = await fetch(file);
    const data = await response.text();
    document.getElementById(id).innerHTML=data;
    
}
function loadScript(src){
    return new Promise((resolve,reject)=>{
        const script = document.createElement('script');
        script.src = src;
        script.onload=resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });  
}

async function init(){
    try {
        //cargar complementos HTML
        await loadComponent('head-placeholder','head.html');
        await loadComponent('header-placeholder','header.html');
        await loadComponent('footer-placeholder','footer.html');
        
        //cargar las librerias en orden estricto
        
        await loadScript('assets/js/jquery-3.6.0.min.js');
        await loadScript('assets/js/jquery.dataTables.min.js');
        await loadScript('assets/js/dataTables.bootstrap5.min.js');
        
        await loadScript('assets/js/bootstrap.bundle.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/sweetalert2@11');
        
        //cargar los script y funciones
        await loadScript('assets/js/tienda.js');
        setTimeout(()=>{
          if (typeof verificarSesion === 'function')
                verificarSesion();
            if (typeof cargarProductos === 'function')
                cargarProductos();
            if (typeof inicializarEventosAuth === 'function')
                inicializarEventosAuth();
            if (typeof actualizarContadorCarrito === 'function')
                actualizarContadorCarrito();
            if (typeof cargarCarrito === 'function')
                cargarCarrito();


            // Mis Compras
            if (typeof cargarMisCompras === 'function' && document.getElementById('lista-pedidos')) {
                cargarMisCompras();
                if (document.querySelector('.filtro-btn')) {
                    document.querySelectorAll('.filtro-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            document.querySelectorAll('.filtro-btn').forEach(b => {
                                b.className = 'btn btn-outline-secondary btn-sm filtro-btn';
                            });
                            this.className = 'btn btn-danger btn-sm filtro-btn active';
                            filtroActual = this.dataset.estado;
                            renderPedidos();
                        });
                    });
                }
            }

            // Mi Perfil
            if (typeof cargarPerfil === 'function' && document.getElementById('perfilTabs')) {
                cargarPerfil();
                document.querySelectorAll('[data-tab]').forEach(btn => {
                    btn.addEventListener('click', function () {
                        document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        ['datos', 'password', 'direcciones'].forEach(t =>
                            document.getElementById('tab-' + t).classList.add('d-none'));
                        document.getElementById('tab-' + this.dataset.tab).classList.remove('d-none');
                        if (this.dataset.tab === 'direcciones') cargarDirecciones();
                    });
                });
                const pwdInput = document.getElementById('new-password');
                if (pwdInput) {
                    pwdInput.addEventListener('input', function () {
                        const v = this.value;
                        const strength = document.getElementById('password-strength');
                        const bar      = document.getElementById('strength-bar');
                        const label    = document.getElementById('strength-label');
                        if (!v) { strength.classList.add('d-none'); return; }
                        strength.classList.remove('d-none');
                        let score = 0;
                        if (v.length >= 6) score++;
                        if (v.length >= 10) score++;
                        if (/[A-Z]/.test(v)) score++;
                        if (/[0-9]/.test(v)) score++;
                        if (/[^a-zA-Z0-9]/.test(v)) score++;
                        const niveles = [
                            { pct: 20,  cls: 'bg-danger',  txt: 'Muy débil'  },
                            { pct: 40,  cls: 'bg-danger',  txt: 'Débil'      },
                            { pct: 60,  cls: 'bg-warning', txt: 'Regular'    },
                            { pct: 80,  cls: 'bg-info',    txt: 'Fuerte'     },
                            { pct: 100, cls: 'bg-success', txt: 'Muy fuerte' }
                        ];
                        const n = niveles[Math.min(score, 4)];
                        bar.style.width = n.pct + '%';
                        bar.className   = 'progress-bar ' + n.cls;
                        label.textContent = n.txt;
                    });
                }
            }


            // Admin Dashboard
            if (typeof initDashboard === 'function') initDashboard();
            // Admin Productos
            if (typeof initAdminProductos === 'function') initAdminProductos();
            // Admin Pedidos
            if (typeof initAdminPedidos === 'function') initAdminPedidos();

        },500);
        
    } catch (e) {
        console.error("Error al cargar la aplicacion",e); 
    }
}
init();