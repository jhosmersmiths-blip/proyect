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
          if (typeof verificarSesion() === 'function')
                verificarSesion();
            if (typeof cargarProductos() === 'function')
                cargarProductos();
            if (typeof inicializarEventosAuth() === 'function')
                inicializarEventosAuth();
            if (typeof agregarCarrito() === 'function')
                agregarCarrito();
            if (typeof actualizarContadorCarrito() === 'function')
                actualizarContadorCarrito();
            if (typeof cargarCarrito() === 'function')
                cargarCarrito();
              if (typeof cargarTablaAdmin === 'function')
                cargarTablaAdmin();
            
            
        },200);
        
    } catch (e) {
        console.error("Error al cargar la aplicacion",e); 
    }
}
init();