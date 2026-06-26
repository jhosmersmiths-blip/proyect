$(document).ready(function () {
    verificarSesion();
    cargarProductos();
    cargarCarrito();
    cargarTablaAdmin();
    inicializarEventosAuth();
});

// ─── PRODUCTOS ─────────────────────────────────────────────
function cargarProductos() {
    const contenedor = $('#lista-productos');
    if (contenedor.length === 0)
        return;

    fetch('AppController?action=listarProductos')
            .then(res => res.json())
            .then(productos => {
                contenedor.empty();
                if (!productos || productos.length === 0) {
                    contenedor.html('<p class="text-center text-muted">No hay productos disponibles.</p>');
                    return;
                }
                productos.forEach(p => {
                    const imagen = p.imagen ? p.imagen : 'assets/img/producto/default.png';
                    const stockBadge = p.stock > 0
                            ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Stock: ${p.stock}</span>`
                            : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Sin stock</span>`;

                    contenedor.append(`
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 producto-card"
                     data-nombre="${p.nombre.toLowerCase()}"
                     data-categoria="${p.categoria ? p.categoria.nombre : ''}">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${imagen}" alt="${p.nombre}"
                             class="card-img-top p-2"
                             style="height:200px;object-fit:cover;"
                             onerror="this.src='https://via.placeholder.com/200x200?text=Sin+imagen'">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title fw-bold">${p.nombre}</h6>
                            <p class="card-text text-muted small flex-grow-1">${p.descripcion || ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="fs-5 fw-bold text-danger">S/ ${p.precio.toFixed(2)}</span>
                                ${stockBadge}
                            </div>
                            <button onclick="abrirModalTallas(${p.id_producto}, '${p.nombre}', ${p.precio})"
                                    class="btn btn-danger text-white w-100 mt-3"
                                    ${p.stock <= 0 ? 'disabled' : ''}>
                                <i class="bi bi-cart-plus me-1"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>`);
                });

                // Filtro por búsqueda
                $('#buscarProducto').on('input', function () {
                    const texto = $(this).val().toLowerCase();
                    $('.producto-card').each(function () {
                        const nombre = $(this).data('nombre');
                        $(this).toggle(nombre.includes(texto));
                    });
                });

                // Filtro por categoría
                $('.categoria-btn').on('click', function () {
                    $('.categoria-btn').removeClass('active btn-danger').addClass('btn-outline-secondary');
                    $(this).addClass('active btn-danger').removeClass('btn-outline-secondary');
                    const cat = $(this).data('categoria');
                    $('.producto-card').each(function () {
                        if (cat === 'todos') {
                            $(this).show();
                        } else {
                            $(this).toggle($(this).data('categoria') === cat);
                        }
                    });
                });
            })
            .catch(err => console.error('Error al cargar productos:', err));
}

// ─── MODAL TALLAS / COLORES ────────────────────────────────
let _variantesCache = [];

function abrirModalTallas(idProducto, nombre, precio) {
    $('#modal-producto-nombre').text(nombre);
    $('#modal-producto-precio').text(`S/ ${precio.toFixed(2)}`);
    $('#btn-agregar-variante').data('id-inventario', null).prop('disabled', true);
    _variantesCache = [];

    // Resetear estado visual
    $('#variantes-loading').removeClass('d-none');
    $('#variantes-selectores, #variantes-error, #variantes-empty, #stock-info').addClass('d-none');
    $('#select-talla').html('<option value="">-- Selecciona una talla --</option>');
    $('#select-color').html('<option value="">-- Primero selecciona una talla --</option>');
    $('#cantidad-variante').val(1);

    fetch(`AppController?action=listarInventario&id_producto=${idProducto}`)
            .then(res => res.json())
            .then(variantes => {
                $('#variantes-loading').addClass('d-none');

                if (!variantes || variantes.length === 0) {
                    $('#variantes-empty').removeClass('d-none');
                    return;
                }

                _variantesCache = variantes;
                $('#variantes-selectores').removeClass('d-none');

                // Tallas únicas (solo con stock > 0 primero, luego sin stock al final)
                const tallasConStock = [...new Set(variantes.filter(v => v.stock > 0).map(v => v.talla))];
                const tallasSinStock = [...new Set(variantes.filter(v => v.stock <= 0).map(v => v.talla))].filter(t => !tallasConStock.includes(t));

                const selectTalla = $('#select-talla');
                selectTalla.html('<option value="">-- Selecciona una talla --</option>');
                tallasConStock.forEach(t => selectTalla.append(`<option value="${t}">${t}</option>`));
                if (tallasSinStock.length > 0) {
                    const grupo = $('<optgroup label="Sin stock">');
                    tallasSinStock.forEach(t => grupo.append(`<option value="${t}" disabled>${t} (Sin stock)</option>`));
                    selectTalla.append(grupo);
                }
            })
            .catch(() => {
                $('#variantes-loading').addClass('d-none');
                $('#variantes-error').removeClass('d-none');
            });

    new bootstrap.Modal(document.getElementById('modalTallas')).show();
}

// Al cambiar talla → actualizar colores disponibles
$(document).on('change', '#select-talla', function () {
    const tallaSeleccionada = $(this).val();
    const selectColor = $('#select-color');
    $('#btn-agregar-variante').data('id-inventario', null).prop('disabled', true);
    $('#stock-info').addClass('d-none');

    if (!tallaSeleccionada) {
        selectColor.html('<option value="">-- Primero selecciona una talla --</option>');
        return;
    }

    // Filtrar variantes de esa talla
    const variantesTalla = _variantesCache.filter(v => v.talla === tallaSeleccionada);
    selectColor.html('<option value="">-- Selecciona un color --</option>');

    variantesTalla.forEach(v => {
        const label = v.stock > 0 ? v.color : `${v.color} (Sin stock)`;
        const disabled = v.stock <= 0 ? 'disabled' : '';
        selectColor.append(`<option value="${v.id_inventario}" data-stock="${v.stock}" ${disabled}>${label}</option>`);
    });
});

// Al cambiar color → mostrar stock y habilitar botón
$(document).on('change', '#select-color', function () {
    const opt = $(this).find('option:selected');
    const idInv = $(this).val();
    const stock = parseInt(opt.data('stock')) || 0;

    if (!idInv) {
        $('#stock-info').addClass('d-none');
        $('#btn-agregar-variante').data('id-inventario', null).prop('disabled', true);
        return;
    }

    $('#stock-valor').text(stock);
    $('#stock-info').removeClass('d-none');
    $('#cantidad-variante').attr('max', stock);
    if (parseInt($('#cantidad-variante').val()) > stock)
        $('#cantidad-variante').val(stock);

    $('#btn-agregar-variante').data('id-inventario', idInv).prop('disabled', false);
});

$(document).on('click', '#btn-agregar-variante', function () {
    const idInv = $(this).data('id-inventario');
    const cantidad = parseInt($('#cantidad-variante').val()) || 1;
    if (!idInv) {
        Swal.fire({icon: 'warning', title: 'Selecciona una variante', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false});
        return;
    }
    agregarCarrito(idInv, cantidad);
    bootstrap.Modal.getInstance(document.getElementById('modalTallas')).hide();
});

// ─── CARRITO ───────────────────────────────────────────────
function agregarCarrito(idInventario, cantidad = 1) {
    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({action: 'AddCarrito', id_inventario: idInventario, cantidad: cantidad})
    })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    $('#cart-count').text(data.itemsEnCarrito);
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500});
                } else {
                    Swal.fire({toast: true, position: 'top-end', icon: 'error', title: data.message, showConfirmButton: false, timer: 2000});
                }
            })
            .catch(() => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error'));
}

function cargarCarrito() {
    const tabla = $('#tabla-carrito tbody');
    if (tabla.length === 0)
        return;

    fetch('AppController?action=listarCarrito')
            .then(res => res.json())
            .then(data => {
                tabla.empty();
                if (!data.items || data.items.length === 0) {
                    tabla.append('<tr><td colspan="6" class="text-center py-4 text-muted"><i class="bi bi-cart-x fs-3"></i><br>El carrito está vacío</td></tr>');
                    $('#resumen-total, #resumen-subtotal').text('S/ 0.00');
                    $('#cart-count').text('0');
                    return;
                }

                data.items.forEach((item, index) => {
                    tabla.append(`
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <span class="fw-bold">${item.producto.nombre}</span><br>
                        <small class="text-muted">
                            Talla: ${item.inventario.talla} | Color: ${item.inventario.color}
                        </small>
                    </td>
                    <td>S/ ${item.precio_unitario.toFixed(2)}</td>
                    <td><span class="badge bg-light text-dark border p-2">${item.cantidad}</span></td>
                    <td class="fw-bold text-danger">S/ ${item.subtotal.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-link text-danger p-0"
                                onclick="eliminarItemCarrito(${item.inventario.id_inventario})">
                            <i class="bi bi-x-circle-fill fs-5"></i>
                        </button>
                    </td>
                </tr>`);
                });

                $('#resumen-total, #resumen-subtotal').text(`S/ ${data.total.toFixed(2)}`);
                $('#cart-count').text(data.items.length);
            })
            .catch(err => console.error('Error al cargar carrito:', err));
}

function eliminarItemCarrito(idInventario) {
    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({action: 'delete', id_inventario: idInventario})
    })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500});
                    cargarCarrito();
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            });
}

function actualizarContadorCarrito() {
    fetch('AppController?action=listarCarrito')
            .then(res => res.json())
            .then(data => {
                $('#cart-count').text(data.items ? data.items.length : 0);
            });
}

// ─── GENERAR COMPRA ────────────────────────────────────────
function procesarCompra() {
    const cantidadProductos = parseInt($('#cart-count').text()) || 0;
    if (cantidadProductos === 0) {
        Swal.fire({title: 'Carrito Vacío', text: 'No tienes productos en el carrito.', icon: 'warning', confirmButtonColor: '#c9536a', confirmButtonText: 'Ir a la tienda'})
                .then(() => window.location.href = 'index.html');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('usuario'));
    if (!user) {
        Swal.fire({title: 'Inicia Sesión', text: 'Debes estar logueado para finalizar la compra.', icon: 'info', showCancelButton: true, confirmButtonColor: '#c9536a', cancelButtonColor: '#6c757d', confirmButtonText: 'Ir al Login', cancelButtonText: 'Cancelar'})
                .then(result => {
                    if (result.isConfirmed)
                        $('#modalLogin').modal('show');
                });
        return;
    }

    // Cargar direcciones del usuario para seleccionar
    cargarDireccionesYConfirmar(user);
}

function cargarDireccionesYConfirmar(user) {
    // Verificar que el usuario tiene persona
    if (!user || !user.persona) {
        Swal.fire({
            title: 'Error de sesión',
            text: 'No se pudo obtener los datos del usuario. Vuelve a iniciar sesión.',
            icon: 'error',
            confirmButtonColor: '#c9536a'
        });
        return;
    }

    fetch('DireccionController?action=listar')
            .then(res => res.json())
            .then(direcciones => {
                // ✅ == en vez de === para evitar mismatch de tipos
                const misDirecciones = direcciones.filter(
                        d => d.persona && d.persona.id_persona == user.persona.id_persona
                );

                if (misDirecciones.length === 0) {
                    // No tiene direcciones → ofrecer registrar una o continuar
                    Swal.fire({
                        title: 'Sin dirección registrada',
                        html: `
                        <p>No tienes una dirección de envío registrada.</p>
                        <p class="text-muted small">¿Deseas agregar una ahora?</p>
                    `,
                        icon: 'warning',
                        showDenyButton: true,
                        showCancelButton: true,
                        confirmButtonColor: '#c9536a',
                        denyButtonColor: '#6c757d',
                        cancelButtonColor: '#adb5bd',
                        confirmButtonText: 'Agregar dirección',
                        denyButtonText: 'Continuar sin dirección',
                        cancelButtonText: 'Cancelar'
                    }).then(result => {
                        if (result.isConfirmed) {
                            // Mostrar form para agregar dirección
                            agregarDireccionRapida(user, () => cargarDireccionesYConfirmar(user));
                        } else if (result.isDenied) {
                            // Continuar con id_direccion = 1 como fallback
                            mostrarPasarelaPago(1);
                        }
                    });
                    return;
                }

                // Tiene direcciones → mostrar selector
                let opcionesHTML = misDirecciones.map(d =>
                        `<option value="${d.id_direccion}">
                    ${d.ciudad} — ${d.calle}
                    ${d.es_principal ? ' ⭐' : ''}
                 </option>`
                ).join('');

                Swal.fire({
                    title: '<i class="bi bi-geo-alt me-2"></i>Dirección de envío',
                    html: `
                    <p class="text-muted small mb-2">Selecciona dónde quieres recibir tu pedido:</p>
                    <select id="swal-direccion" class="form-select">${opcionesHTML}</select>
                `,
                    showCancelButton: true,
                    confirmButtonColor: '#c9536a',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Cancelar',
                    preConfirm: () => {
                        const val = document.getElementById('swal-direccion').value;
                        if (!val) {
                            Swal.showValidationMessage('Selecciona una dirección');
                            return false;
                        }
                        return val;
                    }
                }).then(result => {
                    if (result.isConfirmed && result.value) {
                        mostrarPasarelaPago(result.value);
                    }
                });
            })
            .catch(err => {
                console.error('Error al cargar direcciones:', err);
                // Fallback si el controller falla
                Swal.fire({
                    title: '¿Confirmar Compra?',
                    text: 'Se procesará con tu dirección principal.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#c9536a',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, comprar',
                    cancelButtonText: 'Cancelar'
                }).then(result => {
                    if (result.isConfirmed)
                        mostrarPasarelaPago(1);
                });
            });
}

// ─── AGREGAR DIRECCIÓN RÁPIDA ──────────────────────────────
function agregarDireccionRapida(user, callback) {
    Swal.fire({
        title: 'Nueva dirección',
        html: `
            <input id="dir-ciudad" class="swal2-input" placeholder="Ciudad" type="text">
            <input id="dir-calle" class="swal2-input" placeholder="Calle / Dirección completa" type="text">
            <div class="form-check mt-2 text-start ps-5">
                <input class="form-check-input" type="checkbox" id="dir-principal">
                <label class="form-check-label" for="dir-principal">Establecer como principal</label>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const ciudad = document.getElementById('dir-ciudad').value.trim();
            const calle = document.getElementById('dir-calle').value.trim();
            if (!ciudad) {
                Swal.showValidationMessage('Ingresa la ciudad');
                return false;
            }
            if (!calle) {
                Swal.showValidationMessage('Ingresa la dirección');
                return false;
            }
            return {ciudad, calle, principal: document.getElementById('dir-principal').checked};
        }
    }).then(result => {
        if (result.isConfirmed) {
            fetch('DireccionController', {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'guardar',
                    id_persona: user.persona.id_persona,
                    ciudad: result.value.ciudad,
                    calle: result.value.calle,
                    es_principal: result.value.principal
                })
            })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                toast: true, position: 'top-end', icon: 'success',
                                title: '¡Dirección guardada!',
                                showConfirmButton: false, timer: 1500
                            }).then(() => callback()); // ← vuelve a cargar las direcciones
                        } else {
                            Swal.fire('Error', data.message, 'error');
                        }
                    });
        }
    });
}
// ─── PASARELA DE PAGO ──────────────────────────────────────
function mostrarPasarelaPago(idDireccion) {
    const resumenTotal = $('#resumen-total').text() || 'S/ 0.00';

    Swal.fire({
        title: '<span style="color:#c9536a"><i class="bi bi-credit-card me-2"></i>Método de Pago</span>',
        html: `
            <p class="text-muted mb-3">Total a pagar: <strong class="text-danger fs-5">${resumenTotal}</strong></p>
            <div class="metodos-pago-grid">

                <!-- Tarjeta -->
                <label class="metodo-card" for="pago-tarjeta">
                    <input type="radio" name="metodoPago" id="pago-tarjeta" value="TARJETA" hidden>
                    <div class="metodo-icon">💳</div>
                    <div class="metodo-label">Tarjeta</div>
                    <small class="text-muted">Visa / Mastercard</small>
                </label>

                <!-- Yape -->
                <label class="metodo-card" for="pago-yape">
                    <input type="radio" name="metodoPago" id="pago-yape" value="YAPE" hidden>
                    <div class="metodo-icon">📱</div>
                    <div class="metodo-label">Yape</div>
                    <small class="text-muted">Pago con QR</small>
                </label>

            </div>

            <!-- Detalle Tarjeta -->
            <div id="detalle-tarjeta" class="detalle-pago mt-3" style="display:none">
                <input class="swal2-input" id="card-numero" type="text" placeholder="Número de tarjeta" maxlength="19">
                <div style="display:flex;gap:8px;margin:4px 0;">
                    <input class="swal2-input" id="card-expira" type="text" placeholder="MM/AA" maxlength="5" style="flex:1">
                    <input class="swal2-input" id="card-cvv" type="text" placeholder="CVV" maxlength="3" style="flex:1">
                </div>
                <input class="swal2-input" id="card-nombre" type="text" placeholder="Nombre en la tarjeta">
            </div>

<!-- Detalle Yape -->
<div id="detalle-yape" class="detalle-pago mt-3" style="display:none">
    <div class="yape-qr-box text-center">

        <!-- Imagen QR fija -->
        <img src="assets/img/QR.jpeg"
             alt="Código QR de Yape"
             style="width:200px; height:200px; object-fit:contain; border-radius:12px; border:2px solid #6B21A8;">

        <small class="text-muted d-block mt-2">Número: <strong>+51 963 359 561</strong></small>
        <p class="fw-bold mt-1" style="color:#6B21A8">Escanea el QR</p>

    </div>
    <p class="text-center text-muted small mt-2">
        Una vez realizado el pago, haz clic en <strong>Confirmar</strong>
    </p>
</div>

<script>
function cargarQRYape(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('yape-qr-img');
            const placeholder = document.getElementById('yape-qr-placeholder-icon');
            img.src = e.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
</script>

        `,
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-bag-check me-1"></i> Confirmar pago',
        cancelButtonText: 'Cancelar',
        customClass: {popup: 'pasarela-popup'},
        didOpen: () => {
            // Estilo tarjetas de método
            const style = document.createElement('style');
            style.textContent = `
                .pasarela-popup { width: 480px !important; }
                .metodos-pago-grid { display:flex; gap:12px; justify-content:center; margin-bottom:4px; }
                .metodo-card {
                    display:flex; flex-direction:column; align-items:center;
                    border:2px solid #e5e7eb; border-radius:12px; padding:16px 20px;
                    cursor:pointer; transition:all .2s; flex:1; user-select:none;
                }
                .metodo-card:hover { border-color:#c9536a; background:#fff5f6; }
                .metodo-card:has(input:checked) { border-color:#c9536a; background:#fff5f6; box-shadow:0 0 0 3px rgba(201,83,106,.15); }
                .metodo-icon { font-size:32px; line-height:1; margin-bottom:6px; }
                .metodo-label { font-weight:700; font-size:14px; color:#1f2937; }
                .detalle-pago { background:#f9fafb; border-radius:10px; padding:14px; border:1px solid #e5e7eb; }
                .yape-qr-box { display:flex; justify-content:center; }
                .yape-qr-placeholder { text-align:center; background:linear-gradient(135deg,#f3e8ff,#ede9fe); border-radius:12px; padding:20px 40px; border:2px dashed #a855f7; }
                .banco-info { background:#eff6ff; border-radius:10px; padding:12px 16px; border-left:4px solid #3b82f6; font-size:14px; }
                .swal2-input { margin:4px 0 !important; }
            `;
            document.head.appendChild(style);

            // Máscara número de tarjeta
            const numInput = document.getElementById('card-numero');
            if (numInput) {
                numInput.addEventListener('input', function () {
                    let v = this.value.replace(/\D/g, '').substring(0, 16);
                    this.value = v.replace(/(.{4})/g, '$1 ').trim();
                });
            }
            // Máscara MM/AA
            const expInput = document.getElementById('card-expira');
            if (expInput) {
                expInput.addEventListener('input', function () {
                    let v = this.value.replace(/\D/g, '').substring(0, 4);
                    if (v.length > 2)
                        v = v.substring(0, 2) + '/' + v.substring(2);
                    this.value = v;
                });
            }

            // Mostrar/ocultar detalles según método seleccionado
            document.querySelectorAll('input[name="metodoPago"]').forEach(radio => {
                radio.addEventListener('change', function () {
                    document.querySelectorAll('.detalle-pago').forEach(d => d.style.display = 'none');
                    const detalle = document.getElementById('detalle-' + this.value.toLowerCase());
                    if (detalle)
                        detalle.style.display = 'block';
                });
            });
        },
        preConfirm: () => {
            const metodo = document.querySelector('input[name="metodoPago"]:checked');
            if (!metodo) {
                Swal.showValidationMessage('Por favor selecciona un método de pago');
                return false;
            }

            // Validar campos de tarjeta
            if (metodo.value === 'TARJETA') {
                const num = document.getElementById('card-numero').value.replace(/\s/g, '');
                const expira = document.getElementById('card-expira').value;
                const cvv = document.getElementById('card-cvv').value;

                if (num.length < 16) {
                    Swal.showValidationMessage('Número de tarjeta inválido');
                    return false;
                }
                if (!/^\d{2}\/\d{2}$/.test(expira)) {
                    Swal.showValidationMessage('Fecha de expiración inválida (MM/AA)');
                    return false;
                }
                if (cvv.length < 3) {
                    Swal.showValidationMessage('CVV inválido');
                    return false;
                }
            }

            return metodo.value;
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            simularProcesamientoPago(result.value, idDireccion);
        }
    });
}

function simularProcesamientoPago(metodoPago, idDireccion) {
    // Barra de progreso simulando procesamiento
    let timerInterval;
    Swal.fire({
        title: 'Procesando pago...',
        html: `
            <div class="mb-3">
                <div class="progress" style="height:8px;border-radius:4px;">
                    <div id="barra-pago" class="progress-bar bg-danger progress-bar-striped progress-bar-animated"
                         style="width:0%;transition:width .3s;border-radius:4px;"></div>
                </div>
            </div>
            <p id="msg-pago" class="text-muted small">Verificando datos...</p>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            const barra = document.getElementById('barra-pago');
            const msg = document.getElementById('msg-pago');
            const pasos = [
                {pct: 20, txt: 'Verificando datos de pago...'},
                {pct: 45, txt: 'Autenticando con el banco...'},
                {pct: 70, txt: 'Aprobando transacción...'},
                {pct: 90, txt: 'Registrando pedido...'},
                {pct: 100, txt: '¡Pago aprobado!'}
            ];
            let i = 0;
            timerInterval = setInterval(() => {
                if (i < pasos.length) {
                    barra.style.width = pasos[i].pct + '%';
                    msg.textContent = pasos[i].txt;
                    i++;
                } else {
                    clearInterval(timerInterval);
                    confirmarCompra(idDireccion, metodoPago);
                }
            }, 600);
        },
        willClose: () => clearInterval(timerInterval)
    });
}

// ─── SESIÓN ────────────────────────────────────────────────
function verificarSesion() {
    const user = JSON.parse(sessionStorage.getItem('usuario'));
    if (user) {
        $('#btn-login-modal').addClass('d-none');
        $('#user-profile').removeClass('d-none');
        $('#user-name').text(user.persona ? user.persona.nombre : user.usuario);

        if (user.rol === 'ADMIN') {
            setTimeout(() => {
                $('#link-admin').removeClass('d-none');
                $('#separator-admin').removeClass('d-none');
            }, 300);
        }
    }
    actualizarContadorCarrito();
}

function logout() {
    fetch('AuthController', {method: 'POST', body: new URLSearchParams({action: 'Salir'})})
            .then(() => {
                sessionStorage.clear();
                window.location.href = 'index.html';
            });
}

// ─── AUTH (LOGIN / REGISTRO) ───────────────────────────────
function inicializarEventosAuth() {
    // LOGIN
    $(document).on('submit', '#form-login', function (e) {
        e.preventDefault();
        const datos = new FormData(this);
        datos.append('action', 'validar');

        fetch('AuthController', {method: 'POST', body: new URLSearchParams(datos)})
                .then(res => res.json())
                .then(data => {
                    // El AuthController usa "sucess" (con typo) — lo manejamos en ambas formas
                    if (data.sucess || data.success) {
                        sessionStorage.setItem('usuario', JSON.stringify(data.userData));
                        $('#modalLogin').modal('hide');
                        Swal.fire({toast: true, position: 'top-end', icon: 'success', title: '¡Bienvenido!', showConfirmButton: false, timer: 1500})
                                .then(() => location.reload());
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                });
    });

    // REGISTRO
    $(document).on('submit', '#form-register', function (e) {
        e.preventDefault();
        const datos = new FormData(this);
        datos.append('action', 'register');

        fetch('AuthController', {method: 'POST', body: new URLSearchParams(datos)})
                .then(res => res.json())
                .then(data => {
                    if (data.sucess || data.success) {
                        Swal.fire({icon: 'success', title: '¡Registro exitoso!', text: 'Ya puedes iniciar sesión.', confirmButtonColor: '#c9536a'})
                                .then(() => {
                                    $('#modalRegister').modal('hide');
                                    $('#modalLogin').modal('show');
                                });
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                });
    });
}

// ─── ADMIN PRODUCTOS ───────────────────────────────────────
function cargarTablaAdmin() {
    const tablaElemento = $('#tabla-productos');
    if (tablaElemento.length === 0)
        return;

    if ($.fn.DataTable) {
        if ($.fn.DataTable.isDataTable('#tabla-productos')) {
            tablaElemento.DataTable().destroy();
        }
        tablaElemento.DataTable({
            ajax: {url: 'ProductoController?action=listar', dataSrc: ''},
            columns: [
                {data: null, render: (d, t, r, m) => m.row + 1},
                {data: 'imagen', render: d => `<img src="${d || 'assets/img/producto/default.png'}" width="50" class="img-thumbnail shadow-sm" onerror="this.src='https://via.placeholder.com/50'">`},
                {data: 'nombre'},
                {data: 'descripcion'},
                {data: 'precio', render: d => `<b>S/ ${d.toFixed(2)}</b>`},
                {
                    data: null, render: d => `
                    <div class="btn-group">
                        <button class="btn btn-warning btn-sm" onclick="editarProducto(${d.id_producto})">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${d.id_producto})">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-info btn-sm text-white" onclick="verInventario(${d.id_producto})">
                            <i class="bi bi-boxes"></i>
                        </button>
                    </div>`
                }
            ],
            language: {
                lengthMenu: 'Mostrar _MENU_ registros',
                zeroRecords: 'No se encontraron resultados',
                info: 'Mostrando _START_ al _END_ de _TOTAL_ registros',
                infoEmpty: 'Sin registros',
                infoFiltered: '(filtrado de _MAX_ total)',
                sSearch: 'Buscar:',
                oPaginate: {sFirst: 'Primero', sLast: 'Último', sNext: 'Siguiente', sPrevious: 'Anterior'},
                sProcessing: 'Procesando...'
            }
        });
    }
}

function abrirModalNuevo() {
    $('#form-producto')[0].reset();
    $('#action').val('guardar');
    $('#id_producto').val('');
    $('#id_categoria').val('');
    $('#tituloModal').text('Nuevo Producto');
    $('#modalProducto').modal('show');
    cargarCategoriasSelect();
}

function cargarCategoriasSelect() {
    fetch('CategoriaController?action=listar')
            .then(res => res.json())
            .then(cats => {
                const sel = $('#id_categoria');
                sel.empty().append('<option value="">-- Seleccionar --</option>');
                cats.forEach(c => sel.append(`<option value="${c.id_categoria}">${c.nombre}</option>`));
            });
}

$(document).on('submit', '#form-producto', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('ProductoController', {method: 'POST', body: formData})
            .then(res => res.json())
            .then(res => {
                if (res) {
                    Swal.fire({icon: 'success', title: '¡Éxito!', text: 'Producto guardado correctamente.', confirmButtonColor: '#c9536a'});
                    $('#modalProducto').modal('hide');
                    cargarTablaAdmin();
                } else {
                    Swal.fire('Error', 'No se pudo guardar el producto.', 'error');
                }
            });
});

function editarProducto(id) {
    fetch(`ProductoController?action=buscar&id=${id}`)
            .then(res => res.json())
            .then(p => {
                cargarCategoriasSelect();
                setTimeout(() => $('#id_categoria').val(p.categoria ? p.categoria.id_categoria : ''), 300);
                $('#id_producto').val(p.id_producto);
                $('#nombre').val(p.nombre);
                $('#descripcion').val(p.descripcion);
                $('#precio').val(p.precio);
                $('#action').val('editar');
                $('#tituloModal').text('Editar Producto');
                $('#modalProducto').modal('show');
            })
            .catch(() => Swal.fire('Error', 'No se pudo obtener el producto.', 'error'));
}

function eliminarProducto(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¡Esta acción no se puede deshacer!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`ProductoController?action=eliminar&id=${id}`, {method: 'POST'})
                    .then(res => res.json())
                    .then(res => {
                        if (res) {
                            Swal.fire({icon: 'success', title: 'Eliminado', text: 'Producto borrado.', confirmButtonColor: '#c9536a'});
                            cargarTablaAdmin();
                        }
                    });
        }
    });
}

// ─── ADMIN INVENTARIO ──────────────────────────────────────
function verInventario(idProducto) {
    $('#inventario-id-producto').val(idProducto);
    cargarInventarioTabla(idProducto);
    new bootstrap.Modal(document.getElementById('modalInventario')).show();
}

function cargarInventarioTabla(idProducto) {
    fetch(`InventarioController?action=listar`)
            .then(res => res.json())
            .then(lista => {
                const tbody = $('#tabla-inventario tbody');
                tbody.empty();
                const filtrados = lista.filter(i => i.producto.id_producto == idProducto);
                if (filtrados.length === 0) {
                    tbody.append('<tr><td colspan="5" class="text-center text-muted">Sin variantes</td></tr>');
                    return;
                }
                filtrados.forEach(i => {
                    tbody.append(`
                <tr>
                    <td>${i.talla}</td>
                    <td>${i.color}</td>
                    <td>${i.stock}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-warning btn-sm" onclick="editarInventario(${i.id_inventario})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="eliminarInventario(${i.id_inventario}, ${idProducto})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`);
                });
            });
}

$(document).on('submit', '#form-inventario', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const action = $('#inventario-action').val() || 'guardar';
    formData.append('action', action);

    fetch('InventarioController', {method: 'POST', body: new URLSearchParams(formData)})
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500});
                    this.reset();
                    $('#inventario-action').val('guardar');
                    cargarInventarioTabla($('#inventario-id-producto').val());
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            });
});

function editarInventario(id) {
    fetch(`InventarioController?action=buscar&id_inventario=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const i = data.inventario;
                    $('#inv-talla').val(i.talla);
                    $('#inv-color').val(i.color);
                    $('#inv-stock').val(i.stock);
                    $('#inv-id').val(i.id_inventario);
                    $('#inventario-action').val('editar');
                }
            });
}

function eliminarInventario(id, idProducto) {
    Swal.fire({
        title: '¿Eliminar variante?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar'
    }).then(result => {
        if (result.isConfirmed) {
            fetch('InventarioController', {
                method: 'POST',
                body: new URLSearchParams({action: 'eliminar', id_inventario: id})
            })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500});
                            cargarInventarioTabla(idProducto);
                        }
                    });
        }
    });
}

// ─── CONFIRMAR COMPRA (llamada desde pasarela) ─────────────
function confirmarCompra(idDireccion, metodoPago) {
    // Enviar id_persona como fallback en caso de que la sesion del servidor expire
    const userLocal = JSON.parse(sessionStorage.getItem('usuario'));
    const idPersona = (userLocal && userLocal.persona) ? userLocal.persona.id_persona : 0;

    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({
            action: 'GenerarCompra',
            id_direccion: idDireccion,
            id_persona: idPersona
        })
    })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Compra exitosa!',
                        html: `
                    <p>Método de pago: <strong>${metodoPago}</strong></p>
                    <p>Total pagado: <strong class="text-danger">S/ ${data.total ? data.total.toFixed(2) : '0.00'}</strong></p>
                `,
                        confirmButtonColor: '#c9536a',
                        confirmButtonText: 'Ver mis compras'
                    }).then(() => {
                        $('#cart-count').text('0');
                        window.location.href = 'index.html';
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error en la compra',
                        text: data.message,
                        confirmButtonColor: '#c9536a'
                    });
                }
            })
            .catch(() => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error'));
}
// ─── MIS COMPRAS ────────────────────────────────────────────
let todosPedidos = [];
let filtroActual = 'todos';

function cargarMisCompras() {
    fetch('AppController?action=listarMisCompras')
            .then(r => r.json())
            .then(data => {
                todosPedidos = Array.isArray(data) ? data : [];
                renderPedidos();
            })
            .catch(() => {
                document.getElementById('lista-pedidos').innerHTML =
                        '<div class="alert alert-danger">Error al cargar los pedidos. Verifica tu sesión.</div>';
            });
}

function renderPedidos() {
    const lista = filtroActual === 'todos'
            ? todosPedidos
            : todosPedidos.filter(p => p.estado === filtroActual);

    const contenedor = document.getElementById('lista-pedidos');
    const empty = document.getElementById('empty-pedidos');

    if (lista.length === 0) {
        contenedor.innerHTML = '';
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

    const estadoConfig = {
        PENDIENTE: {badge: 'warning', icon: '🕐', label: 'Pendiente'},
        ENVIADO: {badge: 'info', icon: '📦', label: 'Enviado'},
        ENTREGADO: {badge: 'success', icon: '✅', label: 'Entregado'},
        CANCELADO: {badge: 'danger', icon: '❌', label: 'Cancelado'}
    };

    contenedor.innerHTML = lista.map(p => {
        const cfg = estadoConfig[p.estado] || {badge: 'secondary', icon: '❓', label: p.estado};
        const fecha = p.fecha
                ? new Date(p.fecha).toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})
                : '—';
        const items = p.detallepedido ? p.detallepedido.length : 0;
        return `
        <div class="card border-0 shadow-sm mb-3 pedido-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                        <span class="text-muted small">Pedido #</span>
                        <span class="fw-bold text-dark">${p.id_pedido}</span>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-danger fs-5">S/ ${(p.total || 0).toFixed(2)}</div>
                        <div class="text-muted small">${fecha}</div>
                    </div>
                </div>
                <hr class="my-2">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted small"><i class="bi bi-box me-1"></i>${items} producto${items !== 1 ? 's' : ''}</span>
                    <button class="btn btn-outline-danger btn-sm" onclick="verDetalle(${p.id_pedido})" title="Ver detalle del pedido">
                        <i class="bi bi-eye fs-5"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function verDetalle(idPedido) {
    document.getElementById('modal-id-pedido').textContent = '#' + idPedido;
    document.getElementById('modal-detalle-body').innerHTML =
            '<div class="text-center py-4"><div class="spinner-border text-danger" role="status"></div></div>';

    new bootstrap.Modal(document.getElementById('modalDetallePedido')).show();

    fetch('AppController?action=detallePedido&id_pedido=' + idPedido)
            .then(r => r.json())
            .then(pedido => {
                if (!pedido || pedido.error) {
                    document.getElementById('modal-detalle-body').innerHTML =
                            '<p class="text-danger text-center">No se pudo cargar el detalle.</p>';
                    return;
                }

                const items = (pedido.detallepedido || []).map(d => `
                <tr>
                    <td class="fw-bold">${d.producto?.nombre || '—'}</td>
                    <td class="text-muted">${d.inventario?.talla || '—'} / ${d.inventario?.color || '—'}</td>
                    <td class="text-center">${d.cantidad}</td>
                    <td class="text-end">S/ ${(d.precio_unitario || 0).toFixed(2)}</td>
                    <td class="text-end fw-bold text-danger">S/ ${(d.subtotal || 0).toFixed(2)}</td>
                </tr>`).join('');

                const fecha = pedido.fecha ? new Date(pedido.fecha).toLocaleString('es-PE') : '—';
                const dir = [pedido.direccion?.calle, pedido.direccion?.ciudad].filter(Boolean).join(', ') || '—';

                document.getElementById('modal-detalle-body').innerHTML = `
                <div class="row g-3 mb-3">
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded">
                            <div class="small text-muted mb-1">📅 Fecha</div>
                            <div class="fw-bold">${fecha}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded">
                            <div class="small text-muted mb-1">📍 Dirección de envío</div>
                            <div class="fw-bold">${dir}</div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Producto</th>
                                <th>Talla / Color</th>
                                <th class="text-center">Cant.</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${items}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-end fw-bold">TOTAL</td>
                                <td class="text-end fw-bold text-danger fs-5">S/ ${(pedido.total || 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;
            });
}

// Filtros
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-pedidos')) {
        setTimeout(cargarMisCompras, 500);
    }
});
// ─── MI PERFIL ───────────────────────────────────────────────
let datosPersona = null;

function cargarPerfil() {
    // Leer datos del sessionStorage (guardados al hacer login)
    const userLocal = JSON.parse(sessionStorage.getItem('usuario'));

    if (!userLocal) {
        Swal.fire({
            icon: 'warning', title: 'Sesión requerida',
            text: 'Debes iniciar sesión para ver tu perfil.',
            confirmButtonColor: '#c9536a'
        }).then(() => window.location.href = 'index.html');
        return;
    }

    const p = userLocal.persona || {};
    datosPersona = {
        id_persona:    p.id_persona    || 0,
        nombre:        p.nombre        || '',
        apell_paterno: p.apell_paterno || '',
        apell_materno: p.apell_materno || '',
        correo:        p.correo        || '',
        telefono:      p.telefono      || ''
    };

    rellenarFormulario(datosPersona);
    actualizarAvatar(datosPersona);

    // Mostrar rol (viene como objeto { nombre: "ADMIN" } o string)
    const rol = userLocal.rol;
    const rolNombre = rol ? (typeof rol === 'object' ? (rol.nombre || 'CLIENTE') : rol) : 'CLIENTE';
    document.getElementById('perfil-rol').textContent = rolNombre;
}

function rellenarFormulario(p) {
    // Campos de solo lectura (mostrar como texto)
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    set('info-nombre',        p.nombre);
    set('info-apell-paterno', p.apell_paterno);
    set('info-apell-materno', p.apell_materno);
    set('info-correo',        p.correo);
    // Campo editable
    const telEl = document.getElementById('edit-telefono');
    if (telEl) telEl.value = p.telefono || '';
}

function actualizarAvatar(p) {
    const nombre = `${p.nombre || ''} ${p.apell_paterno || ''}`.trim();
    const iniciales = nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('avatar-iniciales').textContent = iniciales || '?';
    document.getElementById('perfil-nombre-completo').textContent = nombre || 'Sin nombre';
    document.getElementById('perfil-correo-header').textContent = p.correo || '';
}

function guardarDatos() {
    const telefono = (document.getElementById('edit-telefono')?.value || '').trim();

    if (!telefono) {
        Swal.fire({
            icon: 'warning', title: 'Campo requerido',
            text: 'Ingresa un número de teléfono.',
            confirmButtonColor: '#c9536a'
        });
        return;
    }

    // Actualizar sessionStorage de inmediato (sin depender del servidor)
    const userLocal = JSON.parse(sessionStorage.getItem('usuario')) || {};
    if (!userLocal.persona) userLocal.persona = {};
    userLocal.persona.telefono = telefono;
    sessionStorage.setItem('usuario', JSON.stringify(userLocal));
    datosPersona = {...datosPersona, telefono};

    // Intentar persistir en el servidor
    fetch('AuthController', {
        method: 'POST',
        body: new URLSearchParams({
            action: 'actualizarPerfil',
            id_persona:    datosPersona.id_persona,
            nombre:        datosPersona.nombre        || '',
            apell_paterno: datosPersona.apell_paterno || '',
            apell_materno: datosPersona.apell_materno || '',
            correo:        datosPersona.correo        || '',
            telefono
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data && data.success) {
            Swal.fire({toast: true, position: 'top-end', icon: 'success',
                title: 'Teléfono actualizado', showConfirmButton: false, timer: 2000});
        } else {
            // El endpoint puede no existir aún — igual mostramos éxito local
            Swal.fire({toast: true, position: 'top-end', icon: 'success',
                title: 'Teléfono guardado', showConfirmButton: false, timer: 2000});
        }
    })
    .catch(() => {
        // Sin conexión al servidor — cambio guardado solo en sesión local
        Swal.fire({toast: true, position: 'top-end', icon: 'success',
            title: 'Teléfono guardado', showConfirmButton: false, timer: 2000});
    });
}

// ─── DIRECCIONES ─────────────────────────────────────────────
function cargarDirecciones() {
    fetch('DireccionController?action=listar')
            .then(r => r.json())
            .then(data => {
                const lista = document.getElementById('lista-direcciones');
                const dirs = Array.isArray(data) ? data : [];

                if (dirs.length === 0) {
                    lista.innerHTML = '<p class="text-muted text-center py-3">No tienes direcciones guardadas.</p>';
                    return;
                }
                lista.innerHTML = dirs.map(d => `
                <div class="card border-0 shadow-sm mb-2">
                    <div class="card-body d-flex justify-content-between align-items-start py-3">
                        <div>
                            <div class="fw-bold">
                                <i class="bi bi-geo-alt-fill text-danger me-1"></i>
                                ${d.ciudad || 'Sin ciudad'}
                            </div>
                            <div class="text-muted small mt-1">${d.calle || '—'}</div>
                        </div>
                        <button class="btn btn-outline-danger btn-sm ms-3" onclick="eliminarDireccion(${d.id_direccion})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>`).join('');
            });
}

function mostrarFormDireccion() {
    document.getElementById('form-nueva-direccion').classList.remove('d-none');
}

function ocultarFormDireccion() {
    document.getElementById('form-nueva-direccion').classList.add('d-none');
    document.getElementById('nueva-dir-descripcion').value = '';
    document.getElementById('nueva-dir-detalle').value = '';
}

function guardarDireccion() {
    const ciudad = document.getElementById('nueva-dir-descripcion').value.trim();
    const calle = document.getElementById('nueva-dir-detalle').value.trim();

    if (!ciudad || !calle) {
        Swal.fire({icon: 'warning', title: 'Completa los campos', confirmButtonColor: '#c9536a'});
        return;
    }

    fetch('DireccionController', {
        method: 'POST',
        body: new URLSearchParams({action: 'insertar', ciudad, calle})
    })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    ocultarFormDireccion();
                    cargarDirecciones();
                    Swal.fire({toast: true, position: 'top-end', icon: 'success',
                        title: 'Dirección guardada', showConfirmButton: false, timer: 2000});
                } else {
                    Swal.fire({icon: 'error', title: 'Error', text: data.message, confirmButtonColor: '#c9536a'});
                }
            });
}

function eliminarDireccion(id) {
    Swal.fire({
        title: '¿Eliminar dirección?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(r => {
        if (r.isConfirmed) {
            fetch('DireccionController', {
                method: 'POST',
                body: new URLSearchParams({action: 'eliminar', id_direccion: id})
            })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success)
                            cargarDirecciones();
                    });
        }
    });
}

// ─── TABS ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('perfilTabs'))
        return;

    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            ['datos', 'password', 'direcciones'].forEach(t =>
                document.getElementById('tab-' + t).classList.add('d-none'));
            document.getElementById('tab-' + this.dataset.tab).classList.remove('d-none');
            if (this.dataset.tab === 'direcciones')
                cargarDirecciones();
        });
    });

    setTimeout(cargarPerfil, 500);
});