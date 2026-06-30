$(document).ready(function () {
    verificarSesion();
    cargarCarrito();
    inicializarEventosAuth();
});

// PRODUCTOS 
let categoriaActivaId = 'todos'; 

function cargarProductos() {
    const contenedor = $('#lista-productos');
    if (contenedor.length === 0) return;

    // Cargar botones de categoría dinámicamente
    fetch('CategoriaController?action=listar')
        .then(res => res.json())
        .then(cats => {
            const filtros = $('#filtros-categoria');
            if (filtros.length === 0) return;
            cats.forEach(c => {
                filtros.append(
                    `<button class="btn btn-outline-secondary btn-sm categoria-btn"
                             data-id-categoria="${c.id_categoria}">${c.nombre}</button>`
                );
            });
            // Activar  filtros despues de añadir los botones
            activarFiltroCategoria();
        })
        .catch(() => activarFiltroCategoria()); 

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
                const idCat  = p.categoria ? p.categoria.id_categoria : '';
                
                contenedor.append(`
                <div class="col-12 col-sm-6 col-md-4 col-lg-3 producto-card"
                     data-nombre="${p.nombre.toLowerCase()}"
                     data-id-categoria="${idCat}">
                    <div class="card h-100 shadow-sm border-0">
                        <img src="${imagen}" alt="${p.nombre}"
                             class="card-img-top prod-card-img p-2"
                             onerror="this.src='https://via.placeholder.com/200x200?text=Sin+imagen'">
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title fw-bold prod-card-title">${p.nombre}</h6>
                            <p class="card-text text-muted small flex-grow-1 prod-card-desc">${p.descripcion || ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-2">
                                <span class="fs-5 fw-bold text-danger">S/ ${p.precio.toFixed(2)}</span>   
                            </div>
                            <button onclick="abrirModalTallas(${p.id_producto}, '${p.nombre}', ${p.precio})"
                                    class="btn btn-danger text-white w-100 mt-3"
                                <i class="bi bi-cart-plus me-1"></i> Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>`);
            });

            // Aplicar el filtro activo por si ya estaba seleccionado uno
            aplicarFiltro();

            // Búsqueda por nombre
            $('#buscarProducto').off('input').on('input', function () {
                const texto = $(this).val().toLowerCase();
                $('.producto-card').each(function () {
                    const nombre = $(this).data('nombre');
                    const idCatCard = String($(this).data('id-categoria'));
                    const matchNombre = nombre.includes(texto);
                    const matchCat = categoriaActivaId === 'todos' || idCatCard === String(categoriaActivaId);
                    $(this).toggle(matchNombre && matchCat);
                });
            });
        })
        .catch(err => console.error('Error al cargar productos:', err));
}

function aplicarFiltro() {
    $('.producto-card').each(function () {
        if (categoriaActivaId === 'todos') {
            $(this).show();
        } else {
            $(this).toggle(String($(this).data('id-categoria')) === String(categoriaActivaId));
        }
    });
}

function activarFiltroCategoria() {
    $(document).off('click', '.categoria-btn').on('click', '.categoria-btn', function () {
        $('.categoria-btn').removeClass('active btn-danger').addClass('btn-outline-secondary');
        $(this).addClass('active btn-danger').removeClass('btn-outline-secondary');
        categoriaActivaId = $(this).data('id-categoria');

        $('#buscarProducto').val('');
        aplicarFiltro();
    });
}

// MODAL TALLAS / COLORES 
let _variantesCache = [];

function abrirModalTallas(idProducto, nombre, precio) {
    $('#modal-producto-nombre').text(nombre);
    $('#modal-producto-precio').text(`S/ ${precio.toFixed(2)}`);
    $('#btn-agregar-variante').data('id-inventario', null).prop('disabled', true);
    _variantesCache = [];

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

// Al cambiar color mostrar stock y habilitar botón
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

// CARRITO 
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

// GENERAR COMPRA 
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
                // en vez de  para evitar mismatch de tipos
                const misDirecciones = direcciones.filter(
                        d => d.persona && d.persona.id_persona == user.persona.id_persona
                );
 
                if (misDirecciones.length === 0) {
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
                    <select id="swal-direccion" class="form-select mb-3">${opcionesHTML}</select>
                    <button type="button" id="btn-nueva-dir-swal"
                            class="btn btn-sm btn-outline-secondary w-100"
                            style="border:1.5px dashed #c9536a;color:#c9536a;background:transparent;border-radius:8px;padding:7px">
                        <i class="bi bi-plus-circle me-1"></i> Agregar nueva dirección
                    </button>
                `,
                    showCancelButton: true,
                    confirmButtonColor: '#c9536a',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Continuar',
                    cancelButtonText: 'Cancelar',
                    didOpen: () => {
                        document.getElementById('btn-nueva-dir-swal').addEventListener('click', () => {
                            Swal.close();
                            agregarDireccionRapida(user, () => cargarDireccionesYConfirmar(user));
                        });
                    },
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
 
// AGREGAR DIRECCIÓN RÁPIDA 
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
                            }).then(() => callback()); 
                        } else {
                            Swal.fire('Error', data.message, 'error');
                        }
                    });
        }
    });
}
// PASARELA DE PAGO 
function mostrarPasarelaPago(idDireccion) {
    const resumenTotal = $('#resumen-total').text() || 'S/ 0.00';

    Swal.fire({
        title: '',
        html: `
        <div class="pasarela-header">
            <div class="pasarela-header-icon"><i class="bi bi-shield-lock-fill"></i></div>
            <h4 class="pasarela-header-titulo">Pago Seguro</h4>
            <div class="pasarela-total-badge">Total: <strong>${resumenTotal}</strong></div>
        </div>

        <p class="pasarela-elige">Elige tu método de pago</p>

        <div class="metodos-pago-grid">
            <label class="metodo-card" for="pago-tarjeta">
                <input type="radio" name="metodoPago" id="pago-tarjeta" value="TARJETA" hidden>
                <div class="metodo-logos">
                    <span class="logo-visa">VISA</span>
                    <span class="logo-mc">MC</span>
                </div>
                <div class="metodo-icon"><i class="bi bi-credit-card-2-front"></i></div>
                <div class="metodo-label">Tarjeta</div>
                <small class="text-muted">Visa / Mastercard</small>
            </label>

            <label class="metodo-card" for="pago-yape">
                <input type="radio" name="metodoPago" id="pago-yape" value="YAPE" hidden>
                <div class="metodo-logos">
                    <span class="logo-yape">yape</span>
                </div>
                <div class="metodo-icon yape-icon-color"><i class="bi bi-phone-fill"></i></div>
                <div class="metodo-label">Yape</div>
                <small class="text-muted">Pago con QR</small>
            </label>
        </div>

        <!-- Detalle Tarjeta -->
        <div id="detalle-tarjeta" class="detalle-pago detalle-pago-oculto">
            <div class="card-input-group">
                <label class="card-field-label"><i class="bi bi-credit-card me-1"></i>Número de tarjeta</label>
                <div class="card-numero-wrap">
                    <input class="card-field" id="card-numero" type="text" placeholder="0000 0000 0000 0000" maxlength="19">
                    <div class="card-chip"></div>
                </div>
            </div>
            <div class="card-row-2">
                <div class="card-input-group">
                    <label class="card-field-label"><i class="bi bi-calendar3 me-1"></i>Vencimiento</label>
                    <input class="card-field" id="card-expira" type="text" placeholder="MM/AA" maxlength="5">
                </div>
                <div class="card-input-group">
                    <label class="card-field-label"><i class="bi bi-lock me-1"></i>CVV</label>
                    <input class="card-field" id="card-cvv" type="text" placeholder="•••" maxlength="3">
                </div>
            </div>
            <div class="card-input-group">
                <label class="card-field-label"><i class="bi bi-person me-1"></i>Nombre en la tarjeta</label>
                <input class="card-field" id="card-nombre" type="text" placeholder="Como aparece en tu tarjeta">
            </div>
            <div class="card-seguro-badge"><i class="bi bi-shield-check me-1"></i>Pago cifrado SSL 256-bit</div>
        </div>

        <!-- Detalle Yape -->
        <div id="detalle-yape" class="detalle-pago detalle-pago-oculto">
            <div class="yape-layout">
                <div class="yape-qr-panel">
                    <div class="yape-qr-frame">
                        <img src="assets/img/QR_YAPE.jpeg" alt="QR Yape" class="yape-qr-img">
                    </div>
                    <div class="yape-numero"><i class="bi bi-telephone-fill me-1"></i>+51 963 359 561</div>
                    <div class="yape-steps">
                        <span class="yape-step"><span class="step-num">1</span>Abre Yape</span>
                        <span class="yape-step-sep">→</span>
                        <span class="yape-step"><span class="step-num">2</span>Escanea QR</span>
                        <span class="yape-step-sep">→</span>
                        <span class="yape-step"><span class="step-num">3</span>Confirma</span>
                    </div>
                </div>

                <div class="yape-comprobante-panel">
                    <label class="card-field-label mb-2"><i class="bi bi-image me-1"></i>Sube tu comprobante</label>
                    <div id="yape-drop-zone" onclick="document.getElementById('yape-comprobante-input').click()">
                        <input type="file" id="yape-comprobante-input" accept="image/*" hidden onchange="previewComprobanteYape(this)">
                        <div id="yape-drop-placeholder">
                            <i class="bi bi-cloud-arrow-up"></i>
                            <p>Haz clic para subir</p>
                            <small>PNG, JPG, WEBP</small>
                        </div>
                        <img id="yape-preview-img" src="" alt="Comprobante">
                    </div>
                    <p class="yape-tip"><i class="bi bi-info-circle me-1"></i>Adjunta la captura del pago realizado</p>
                </div>
            </div>
        </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="bi bi-bag-check-fill me-1"></i> Confirmar pago',
        cancelButtonText: '<i class="bi bi-x me-1"></i> Cancelar',
        customClass: { popup: 'pasarela-popup', confirmButton: 'pasarela-btn-confirm', cancelButton: 'pasarela-btn-cancel' },
        didOpen: () => {
            const style = document.createElement('style');
            style.textContent = `
                .pasarela-popup { width: 520px !important; border-radius: 20px !important; padding: 0 !important; overflow: hidden !important; }
                .swal2-html-container { margin: 0 !important; padding: 0 !important; }

                /* Header */
                .pasarela-header { background: linear-gradient(135deg, #c9536a, #a03050); color:#fff; padding: 22px 24px 18px; text-align:center; }
                .pasarela-header-icon { font-size: 2rem; margin-bottom: 4px; opacity: .9; }
                .pasarela-header-titulo { margin: 0 0 10px; font-size: 1.15rem; font-weight: 700; letter-spacing:.5px; }
                .pasarela-total-badge { display:inline-block; background:rgba(255,255,255,.18); border:1.5px solid rgba(255,255,255,.35); border-radius:30px; padding: 5px 20px; font-size:.95rem; }
                .pasarela-elige { font-size:.8rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:1px; margin: 16px 0 8px; padding: 0 20px; }

                /* Métodos grid */
                .metodos-pago-grid { display:flex; gap:10px; padding: 0 20px 4px; }
                .metodo-card { display:flex; flex-direction:column; align-items:center; border:2px solid #e5e7eb; border-radius:14px; padding:14px 10px 10px; cursor:pointer; transition:all .2s; flex:1; user-select:none; background:#fff; position:relative; overflow:hidden; }
                .metodo-card:hover { border-color:#c9536a; background:#fff8f9; transform:translateY(-2px); box-shadow:0 4px 12px rgba(201,83,106,.15); }
                .metodo-card:has(input:checked) { border-color:#c9536a; background:#fff1f3; box-shadow:0 0 0 3px rgba(201,83,106,.18); transform:translateY(-2px); }
                .metodo-logos { display:flex; gap:4px; margin-bottom:8px; min-height:20px; }
                .logo-visa { background:#1a1f71; color:#fff; font-size:.6rem; font-weight:900; padding:2px 5px; border-radius:3px; letter-spacing:.5px; }
                .logo-mc { background: linear-gradient(90deg,#eb001b 40%,#f79e1b 60%); color:#fff; font-size:.6rem; font-weight:900; padding:2px 5px; border-radius:3px; }
                .logo-yape { background:#6c198e; color:#fff; font-size:.65rem; font-weight:900; padding:2px 8px; border-radius:20px; }
                .metodo-icon { font-size:26px; margin-bottom:4px; color:#374151; }
                .yape-icon-color { color:#6c198e !important; }
                .metodo-label { font-weight:700; font-size:.85rem; color:#1f2937; }

                /* Detalle panel */
                .detalle-pago { margin: 10px 20px 0; background:#f9fafb; border-radius:14px; padding:16px; border:1px solid #e5e7eb; text-align:left; }
                .detalle-pago-oculto { display:none; }

                /* Campos tarjeta */
                .card-input-group { margin-bottom:10px; }
                .card-field-label { font-size:.75rem; font-weight:600; color:#6b7280; margin-bottom:4px; display:block; }
                .card-field { width:100%; border:1.5px solid #e5e7eb; border-radius:10px; padding:10px 14px; font-size:.9rem; outline:none; transition:border .2s; background:#fff; box-sizing:border-box; }
                .card-field:focus { border-color:#c9536a; box-shadow:0 0 0 3px rgba(201,83,106,.1); }
                .card-numero-wrap { position:relative; }
                .card-chip { position:absolute; right:12px; top:50%; transform:translateY(-50%); width:22px; height:16px; background:linear-gradient(135deg,#f0c040,#d4a020); border-radius:3px; }
                .card-row-2 { display:flex; gap:10px; }
                .card-row-2 .card-input-group { flex:1; }
                .card-seguro-badge { text-align:center; font-size:.72rem; color:#059669; font-weight:600; margin-top:10px; background:#ecfdf5; border-radius:8px; padding:6px; }

                /* Yape layout */
                .yape-layout { display:flex; gap:14px; }
                .yape-qr-panel { flex:0 0 140px; text-align:center; }
                .yape-qr-frame { background:#fff; border-radius:12px; padding:6px; box-shadow:0 2px 8px rgba(0,0,0,.1); display:inline-block; margin-bottom:8px; }
                .yape-qr-img { width:120px; height:120px; object-fit:contain; border-radius:6px; display:block; }
                .yape-numero { font-size:.72rem; font-weight:700; color:#6c198e; background:#f3e8ff; border-radius:20px; padding:3px 10px; display:inline-block; }
                .yape-steps { display:flex; align-items:center; gap:4px; margin-top:10px; justify-content:center; flex-wrap:wrap; }
                .yape-step { display:flex; flex-direction:column; align-items:center; font-size:.6rem; color:#6b7280; font-weight:600; }
                .step-num { background:#6c198e; color:#fff; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:.6rem; font-weight:700; margin-bottom:2px; }
                .yape-step-sep { color:#d1d5db; font-size:.7rem; }
                .yape-comprobante-panel { flex:1; display:flex; flex-direction:column; }
                #yape-drop-zone { border:2px dashed #c9536a; border-radius:12px; padding:14px 10px; cursor:pointer; text-align:center; background:#fff5f5; transition:all .2s; flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; min-height:100px; }
                #yape-drop-zone:hover { background:#ffe8ec; border-color:#a03050; }
                #yape-drop-placeholder i { font-size:1.6rem; color:#c9536a; }
                #yape-drop-placeholder p { font-size:.75rem; color:#6b7280; margin:4px 0 0; font-weight:600; }
                #yape-drop-placeholder small { font-size:.65rem; color:#9ca3af; }
                #yape-preview-img { display:none; max-height:100px; border-radius:8px; object-fit:contain; }
                .yape-tip { font-size:.68rem; color:#9ca3af; margin-top:6px; margin-bottom:0; }

                /* Botones */
                .pasarela-btn-confirm { border-radius:10px !important; padding: 10px 24px !important; font-weight:600 !important; }
                .pasarela-btn-cancel { border-radius:10px !important; padding: 10px 20px !important; }
                .swal2-actions { padding: 16px 20px 20px !important; gap:10px !important; }
            `;
            document.head.appendChild(style);

            // Máscara número tarjeta
            const numInput = document.getElementById('card-numero');
            if (numInput) {
                numInput.addEventListener('input', function () {
                    let v = this.value.replace(/\D/g, '').substring(0, 16);
                    this.value = v.replace(/(.{4})/g, '$1 ').trim();
                });
            }
            const expInput = document.getElementById('card-expira');
            if (expInput) {
                expInput.addEventListener('input', function () {
                    let v = this.value.replace(/\D/g, '').substring(0, 4);
                    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
                    this.value = v;
                });
            }

            // Mostrar/ocultar detalles según método
            document.querySelectorAll('input[name="metodoPago"]').forEach(radio => {
                radio.addEventListener('change', function () {
                    document.querySelectorAll('.detalle-pago').forEach(d => d.style.display = 'none');
                    const detalle = document.getElementById('detalle-' + this.value.toLowerCase());
                    if (detalle) detalle.style.display = 'block';
                });
            });
        },
        preConfirm: () => {
            const metodo = document.querySelector('input[name="metodoPago"]:checked');
            if (!metodo) {
                Swal.showValidationMessage('Por favor selecciona un método de pago');
                return false;
            }
            if (metodo.value === 'TARJETA') {
                const num = document.getElementById('card-numero').value.replace(/\s/g, '');
                const expira = document.getElementById('card-expira').value;
                const cvv = document.getElementById('card-cvv').value;
                if (num.length < 16) { Swal.showValidationMessage('Número de tarjeta inválido'); return false; }
                if (!/^\d{2}\/\d{2}$/.test(expira)) { Swal.showValidationMessage('Fecha de expiración inválida (MM/AA)'); return false; }
                if (cvv.length < 3) { Swal.showValidationMessage('CVV inválido'); return false; }
            }
            return metodo.value;
        }
    }).then(result => {
        if (result.isConfirmed && result.value) {
            simularProcesamientoPago(result.value, idDireccion);
        }
    });
}

function previewComprobanteYape(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('yape-preview-img');
            const placeholder = document.getElementById('yape-drop-placeholder');
            if (img) { img.src = e.target.result; img.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function simularProcesamientoPago(metodoPago, idDireccion) {
    // Barra de progreso simulando procesamiento
    let timerInterval;
    Swal.fire({
        title: 'Procesando pago...',
        html: `
            <div class="mb-3">
                <div class="progress" class="progreso-barra">
                    <div id="barra-pago" class="progress-bar bg-danger progress-bar-striped progress-bar-animated"
                         class="progreso-fill"></div>
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

//  SESIÓN 
function verificarSesion() {
    const user = JSON.parse(sessionStorage.getItem('usuario'));
    if (user) {
        $('#btn-login-modal').addClass('d-none');
        $('#user-profile').removeClass('d-none');
        $('#user-name').text(user.persona ? user.persona.nombre : user.usuario);

        const rolStr = (typeof user.rol === 'object' && user.rol !== null)
            ? (user.rol.name || user.rol.nombre || JSON.stringify(user.rol))
            : String(user.rol || '');

        if (rolStr.toUpperCase() === 'ADMIN') {
            
            let intentos = 0;
            const mostrarAdmin = setInterval(() => {
                intentos++;
                
                const linkAdmin = document.getElementById('menu-admin-productos');
                if (linkAdmin) {
                    clearInterval(mostrarAdmin);
                    
                    $('#menu-admin-productos').removeClass('d-none');
                    $('#menu-admin-pedidos').removeClass('d-none');
                    $('#menu-admin-dashboard').removeClass('d-none');
                    $('#separator-admin').removeClass('d-none');

                    $('#menu-mis-compras').addClass('d-none');
                }
                if (intentos > 20) clearInterval(mostrarAdmin); 
            }, 100);
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

// AUTH (LOGIN  REGISTRO) 
function inicializarEventosAuth() {
    // LOGIN
    $(document).on('submit', '#form-login', function (e) {
        e.preventDefault();
        const datos = new FormData(this);
        datos.append('action', 'validar');

        fetch('AuthController', {method: 'POST', body: new URLSearchParams(datos)})
                .then(res => res.json())
                .then(data => {
                    if (data.sucess || data.success) {
                        const uData = data.userData;
                        if (uData && uData.rol && typeof uData.rol === 'object') {
                            uData.rol = uData.rol.name || uData.rol.nombre || String(uData.rol);
                        }
                        sessionStorage.setItem('usuario', JSON.stringify(uData));
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

// ADMIN PRODUCTOS 
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

//  ADMIN INVENTARIO 
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

// CONFIRMAR COMPRA 
function confirmarCompra(idDireccion, metodoPago) {
    const userLocal = JSON.parse(sessionStorage.getItem('usuario'));
    const idPersona = (userLocal && userLocal.persona) ? userLocal.persona.id_persona : 0;

    // Si es Yape, enviar como FormData para incluir el comprobante
    const comprobanteInput = document.getElementById('yape-comprobante-input');
    const tieneComprobante = metodoPago === 'YAPE' && comprobanteInput && comprobanteInput.files[0];

    let fetchOptions;
    if (tieneComprobante) {
        const fd = new FormData();
        fd.append('action', 'GenerarCompra');
        fd.append('id_direccion', idDireccion);
        fd.append('id_persona', idPersona);
        fd.append('metodo_pago', metodoPago);
        fd.append('comprobante', comprobanteInput.files[0]);
        fetchOptions = { method: 'POST', body: fd };
    } else {
        fetchOptions = {
            method: 'POST',
            body: new URLSearchParams({
                action: 'GenerarCompra',
                id_direccion: idDireccion,
                id_persona: idPersona,
                metodo_pago: metodoPago
            })
        };
    }

    fetch('AppController', fetchOptions)
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
//  MIS COMPRAS 
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
        PENDIENTE: {badge: 'warning', icon: '<i class="bi bi-clock-history"></i>', label: 'Pendiente'},
        CONFIRMADO: {badge: 'primary', icon: '<i class="bi bi-patch-check"></i>', label: 'Confirmado'},
        ENVIADO: {badge: 'info', icon: '<i class="bi bi-truck"></i>', label: 'Enviado'},
        ENTREGADO: {badge: 'success', icon: '<i class="bi bi-check-circle"></i>', label: 'Entregado'},
        CANCELADO: {badge: 'danger', icon: '<i class="bi bi-x-circle"></i>', label: 'Cancelado'}
    };

    contenedor.innerHTML = lista.map(p => {
        const cfg = estadoConfig[p.estado] || {badge: 'secondary', icon: '<i class="bi bi-question-circle"></i>', label: p.estado};
        const fecha = p.fecha
                ? new Date(p.fecha).toLocaleDateString('es-PE', {day: '2-digit', month: 'short', year: 'numeric'})
                : '—';
        const items = p.detallepedido ? p.detallepedido.length : 0;
        const editable = (p.estado === 'PENDIENTE' || p.estado === 'CONFIRMADO');
        const botonesGestion = editable ? `
                    <button class="btn btn-outline-primary btn-sm" onclick="abrirEditarPedido(${p.id_pedido})" title="Editar pedido">
                        <i class="bi bi-pencil-square"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="abrirCancelarPedido(${p.id_pedido})" title="Cancelar pedido">
                        <i class="bi bi-x-circle"></i> Cancelar
                    </button>` : '';
        return `
        <div class="card border-0 shadow-sm mb-3 pedido-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                        <span class="text-muted small">Pedido #</span>
                        <span class="fw-bold text-dark">${p.id_pedido}</span>
                        <span class="badge bg-${cfg.badge} ms-2">${cfg.icon} ${cfg.label}</span>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-danger fs-5">S/ ${(p.total || 0).toFixed(2)}</div>
                        <div class="text-muted small">${fecha}</div>
                    </div>
                </div>
                <hr class="my-2">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span class="text-muted small"><i class="bi bi-box me-1"></i>${items} producto${items !== 1 ? 's' : ''}</span>
                    <div class="d-flex gap-2">
                        ${botonesGestion}
                        <button class="btn btn-outline-secondary btn-sm" onclick="verDetalle(${p.id_pedido})" title="Ver detalle del pedido">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
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
                            <div class="small text-muted mb-1"><i class="bi bi-calendar3 me-1"></i>Fecha</div>
                            <div class="fw-bold">${fecha}</div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 bg-light rounded">
                            <div class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i>Dirección de envío</div>
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

// EDITAR Y CANCELAR PEDIDO 
let pedidoEnEdicion = null;
let itemsEdicionState = [];

function abrirEditarPedido(idPedido) {
    document.getElementById('editar-id-pedido').textContent = '#' + idPedido;
    document.getElementById('editar-detalle-body').innerHTML =
            '<div class="text-center py-4"><div class="spinner-border text-danger" role="status"></div></div>';
    document.getElementById('editar-nuevo-total').textContent = 'S/ 0.00';

    new bootstrap.Modal(document.getElementById('modalEditarPedido')).show();

    fetch('AppController?action=detallePedido&id_pedido=' + idPedido)
            .then(r => r.json())
            .then(pedido => {
                if (!pedido || pedido.error) {
                    document.getElementById('editar-detalle-body').innerHTML =
                            '<p class="text-danger text-center">No se pudo cargar el pedido.</p>';
                    return;
                }
                if (pedido.estado !== 'PENDIENTE' && pedido.estado !== 'CONFIRMADO') {
                    document.getElementById('editar-detalle-body').innerHTML =
                            '<p class="text-warning text-center"><i class="bi bi-exclamation-triangle me-1"></i>' +
                            (pedido.estado === 'ENVIADO'
                                    ? 'Su pedido ya está en camino, para cambios contacte a soporte.'
                                    : 'Este pedido ya no se puede modificar.') + '</p>';
                    return;
                }

                pedidoEnEdicion = pedido;
                itemsEdicionState = (pedido.detallepedido || []).map(d => ({
                    id_det_pedido: d.id_det_pedido,
                    id_producto: d.producto.id_producto,
                    nombre_producto: d.producto.nombre,
                    id_inventario_original: d.inventario.id_inventario,
                    id_inventario: d.inventario.id_inventario,
                    talla: d.inventario.talla,
                    color: d.inventario.color,
                    cantidad_original: d.cantidad,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                    opciones: [],
                    eliminado: false
                }));

                // Cargar variantes disponibles (tallas/colores) de cada producto
                const idsUnicos = [...new Set(itemsEdicionState.map(it => it.id_producto))];
                Promise.all(idsUnicos.map(id =>
                    fetch('AppController?action=listarInventario&id_producto=' + id)
                            .then(r => r.json()).then(data => ({id, data}))
                )).then(resultados => {
                    const mapaOpciones = {};
                    resultados.forEach(r => mapaOpciones[r.id] = r.data);
                    itemsEdicionState.forEach(it => it.opciones = mapaOpciones[it.id_producto] || []);
                    renderFilasEdicion();
                });
            })
            .catch(() => {
                document.getElementById('editar-detalle-body').innerHTML =
                        '<p class="text-danger text-center">Error al cargar el pedido.</p>';
            });
}

function renderFilasEdicion() {
    const cont = document.getElementById('editar-detalle-body');
    if (!cont)
        return;

    if (itemsEdicionState.every(it => it.eliminado)) {
        cont.innerHTML = '<div class="alert alert-warning text-center">Debes mantener al menos un producto en el pedido.</div>';
        recalcularTotalEdicion();
        return;
    }

    cont.innerHTML = `
        <p class="text-muted small mb-3"><i class="bi bi-info-circle me-1"></i>
            Puedes cambiar la talla/color, ajustar la cantidad o quitar un producto del pedido.</p>
        <div class="table-responsive">
            <table class="table align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Producto</th>
                        <th>Talla / Color</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-end">Subtotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsEdicionState.map((it, idx) => {
                        if (it.eliminado)
                            return '';
                        const opcionesHTML = it.opciones.map(op => {
                            const esActual = op.id_inventario === it.id_inventario;
                            const stockMostrado = op.id_inventario === it.id_inventario_original
                                    ? op.stock + it.cantidad_original
                                    : op.stock;
                            return `<option value="${op.id_inventario}" ${esActual ? 'selected' : ''}>
                                ${op.talla} / ${op.color} (disp: ${stockMostrado})
                            </option>`;
                        }).join('');
                        return `
                        <tr id="fila-edicion-${idx}">
                            <td class="fw-semibold">${it.nombre_producto}</td>
                            <td>
                                <select class="form-select form-select-sm" class="carrito-select-inline"
                                        onchange="cambiarVarianteEdicion(${idx}, this.value)">
                                    ${opcionesHTML}
                                </select>
                            </td>
                            <td class="text-center">
                                <input type="number" min="1" value="${it.cantidad}"
                                       class="form-control form-control-sm text-center" class="carrito-qty-input"
                                       onchange="cambiarCantidadEdicion(${idx}, this.value)">
                            </td>
                            <td class="text-end fw-bold text-danger" id="subtotal-edicion-${idx}">
                                S/ ${(it.cantidad * it.precio_unitario).toFixed(2)}
                            </td>
                            <td class="text-center">
                                <button class="btn btn-link text-danger p-0" title="Quitar producto"
                                        onclick="quitarItemEdicion(${idx})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    recalcularTotalEdicion();
}

function cambiarVarianteEdicion(idx, idInventario) {
    itemsEdicionState[idx].id_inventario = parseInt(idInventario);
    const op = itemsEdicionState[idx].opciones.find(o => o.id_inventario === parseInt(idInventario));
    if (op) {
        itemsEdicionState[idx].talla = op.talla;
        itemsEdicionState[idx].color = op.color;
    }
    recalcularTotalEdicion();
}

function cambiarCantidadEdicion(idx, valor) {
    let cant = parseInt(valor);
    if (isNaN(cant) || cant < 1)
        cant = 1;
    itemsEdicionState[idx].cantidad = cant;
    const subtotalEl = document.getElementById('subtotal-edicion-' + idx);
    if (subtotalEl) {
        subtotalEl.textContent = 'S/ ' + (cant * itemsEdicionState[idx].precio_unitario).toFixed(2);
    }
    recalcularTotalEdicion();
}

function quitarItemEdicion(idx) {
    Swal.fire({
        title: '¿Quitar producto del pedido?',
        text: itemsEdicionState[idx].nombre_producto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, quitar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            itemsEdicionState[idx].eliminado = true;
            renderFilasEdicion();
        }
    });
}

function recalcularTotalEdicion() {
    const total = itemsEdicionState
            .filter(it => !it.eliminado)
            .reduce((s, it) => s + (it.cantidad * it.precio_unitario), 0);
    const el = document.getElementById('editar-nuevo-total');
    if (el)
        el.textContent = 'S/ ' + total.toFixed(2);
}

function guardarEdicionPedido() {
    if (!pedidoEnEdicion)
        return;

    if (itemsEdicionState.every(it => it.eliminado)) {
        Swal.fire('Atención', 'Debes mantener al menos un producto en el pedido. Usa la opción Cancelar si deseas anular todo el pedido.', 'warning');
        return;
    }

    const payload = itemsEdicionState.map(it => ({
        id_det_pedido: it.id_det_pedido,
        id_inventario: it.eliminado ? it.id_inventario_original : it.id_inventario,
        cantidad: it.eliminado ? 0 : it.cantidad
    }));

    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({
            action: 'editarPedido',
            id_pedido: pedidoEnEdicion.id_pedido,
            items: JSON.stringify(payload)
        })
    })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('modalEditarPedido')).hide();
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 2500});
                    cargarMisCompras();
                } else {
                    Swal.fire('No se pudo actualizar', data.message, 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error de conexión al actualizar el pedido.', 'error'));
}

function abrirCancelarPedido(idPedido) {
    Swal.fire({
        title: '¿Cancelar Pedido #' + idPedido + '?',
        html: `
            <p class="text-muted small">Indícanos brevemente el motivo de tu cancelación:</p>
            <textarea id="swal-motivo-cancel" class="swal2-textarea" placeholder="Motivo de la cancelación..." maxlength="300"></textarea>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#c9536a',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cancelar pedido',
        cancelButtonText: 'Volver',
        preConfirm: () => {
            const motivo = document.getElementById('swal-motivo-cancel').value.trim();
            if (!motivo) {
                Swal.showValidationMessage('Debes indicar un motivo breve de la cancelación');
                return false;
            }
            return motivo;
        }
    }).then(result => {
        if (result.isConfirmed) {
            fetch('AppController', {
                method: 'POST',
                body: new URLSearchParams({action: 'cancelarPedido', id_pedido: idPedido, motivo: result.value})
            })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({title: '¡Pedido cancelado!', text: data.message, icon: 'success', confirmButtonColor: '#c9536a'});
                            cargarMisCompras();
                        } else {
                            Swal.fire('No se pudo cancelar', data.message, 'error');
                        }
                    })
                    .catch(() => Swal.fire('Error', 'Error de conexión al cancelar el pedido.', 'error'));
        }
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
// MI PERFIL 
let datosPersona = null;

function cargarPerfil() {
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

    const rol = userLocal.rol;
    const rolNombre = rol ? (typeof rol === 'object' ? (rol.nombre || 'CLIENTE') : rol) : 'CLIENTE';
    document.getElementById('perfil-rol').textContent = rolNombre;
}

function rellenarFormulario(p) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    set('info-nombre',        p.nombre);
    set('info-apell-paterno', p.apell_paterno);
    set('info-apell-materno', p.apell_materno);
    set('info-correo',        p.correo);
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

    const userLocal = JSON.parse(sessionStorage.getItem('usuario')) || {};
    if (!userLocal.persona) userLocal.persona = {};
    userLocal.persona.telefono = telefono;
    sessionStorage.setItem('usuario', JSON.stringify(userLocal));
    datosPersona = {...datosPersona, telefono};

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
            Swal.fire({toast: true, position: 'top-end', icon: 'success',
                title: 'Teléfono guardado', showConfirmButton: false, timer: 2000});
        }
    })
    .catch(() => {
        Swal.fire({toast: true, position: 'top-end', icon: 'success',
            title: 'Teléfono guardado', showConfirmButton: false, timer: 2000});
    });
}

// DIRECCIONES 
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

// TABLAS 
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

//  ADMIN DASHBOARD 


function initDashboard() {
    if (!document.getElementById('kpi-productos')) return;
    cargarKpisProductos();
    cargarKpisPedidos();
}

function cargarKpisProductos() {
    fetch('ProductoController')
        .then(r => r.json())
        .then(data => {
            document.getElementById('kpi-productos').textContent = data.length;
            renderStockBajo(data);
        })
        .catch(() => { document.getElementById('kpi-productos').textContent = '—'; });
}

function renderStockBajo(productos) {
    fetch('InventarioController')
        .then(r => r.json())
        .then(inventarios => {
            const stockPorProd = {};
            inventarios.forEach(inv => {
                const id = inv.producto ? inv.producto.id_producto : null;
                if (!id) return;
                stockPorProd[id] = (stockPorProd[id] || 0) + inv.stock;
            });
            const bajos = productos
                .map(p => ({ ...p, stockTotal: stockPorProd[p.id_producto] || 0 }))
                .filter(p => p.stockTotal <= 5)
                .sort((a, b) => a.stockTotal - b.stockTotal)
                .slice(0, 6);

            const contenedor = document.getElementById('lista-stock-bajo');
            if (!contenedor) return;
            if (bajos.length === 0) {
                contenedor.innerHTML = '<p class="text-muted text-center py-3 small">Sin productos con stock bajo.</p>';
                return;
            }
            contenedor.innerHTML = bajos.map(p => `
                <div class="d-flex justify-content-between align-items-center px-4 py-2 border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${p.imagen || 'assets/img/producto/no-image.png'}" alt=""
                             class="rounded dash-stock-icon"
                             onerror="this.src='https://via.placeholder.com/36'">
                        <span class="small fw-semibold">${p.nombre}</span>
                    </div>
                    <span class="badge ${p.stockTotal === 0 ? 'bg-danger' : 'bg-warning text-dark'}">
                        ${p.stockTotal} uds.
                    </span>
                </div>`).join('');
        })
        .catch(() => {
            const c = document.getElementById('lista-stock-bajo');
            if (c) c.innerHTML = '<p class="text-muted text-center py-3 small">No se pudo cargar.</p>';
        });
}

function cargarKpisPedidos() {
    fetch('AppController?action=listarTodosPedidos')
        .then(r => r.json())
        .then(pedidos => {
            if (!Array.isArray(pedidos)) pedidos = [];
            document.getElementById('kpi-pedidos').textContent    = pedidos.length;
            document.getElementById('kpi-pendientes').textContent = pedidos.filter(p => p.estado === 'PENDIENTE').length;
            const entregados = pedidos.filter(p => p.estado === 'ENTREGADO');
            const ganancias  = entregados.reduce((s, p) => s + (p.total || 0), 0);
            const ingresos   = pedidos.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + (p.total || 0), 0);
            const elGanancias = document.getElementById('kpi-ganancias');
            const elIngresos  = document.getElementById('kpi-ingresos');
            if (elGanancias) elGanancias.textContent = 'S/ ' + ganancias.toFixed(2);
            if (elIngresos)  elIngresos.textContent  = 'S/ ' + ingresos.toFixed(2);
            renderUltimosPedidosDash(pedidos.slice(0, 8));
            renderEstadoBars(pedidos);
        })
        .catch(() => {
            ['kpi-pedidos','kpi-pendientes','kpi-ingresos'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '—';
            });
        });
}

function renderUltimosPedidosDash(pedidos) {
    const tbody = document.getElementById('tabla-ultimos-pedidos');
    if (!tbody) return;
    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin pedidos aún.</td></tr>';
        return;
    }
    tbody.innerHTML = pedidos.map(p => {
        const persona = p.persona || {};
        const nombre  = `${persona.nombre||''} ${persona.apell_paterno||''}`.trim() || '—';
        return `
        <tr>
            <td class="ps-4 text-muted small">#${p.id_pedido}</td>
            <td>
                <div class="fw-semibold small">${nombre}</div>
                <div class="text-muted" class="dash-fecha-sm">${adminFormatFecha(p.fecha)}</div>
            </td>
            <td class="text-end fw-bold small text-danger">S/ ${(p.total||0).toFixed(2)}</td>
            <td class="text-center">
                <span class="badge rounded-pill ${adminBadgeEstado(p.estado)}" class="dash-badge-sm">
                    ${(p.estado||'—').replace('_',' ')}
                </span>
            </td>
        </tr>`;
    }).join('');
}

function renderEstadoBars(pedidos) {
    const contenedor = document.getElementById('estado-pedidos-bars');
    if (!contenedor) return;
    const total = pedidos.length || 1;
    const estados = [
        { key:'PENDIENTE',  label:'Pendiente',  clase:'bg-warning' },
        { key:'ENVIADO',    label:'Enviado',    clase:'bg-info'    },
        { key:'ENTREGADO',  label:'Entregado',  clase:'bg-success' },
        { key:'CANCELADO',  label:'Cancelado',  clase:'bg-secondary'}
    ];
    contenedor.innerHTML = estados.map(e => {
        const cnt = pedidos.filter(p => p.estado === e.key).length;
        const pct = Math.round((cnt / total) * 100);
        return `
        <div class="mb-3">
            <div class="d-flex justify-content-between small mb-1">
                <span class="fw-semibold">${e.label}</span>
                <span class="text-muted">${cnt} (${pct}%)</span>
            </div>
            <div class="progress" class="dash-barra">
                <div class="progress-bar ${e.clase}" style="width:${pct}%"></div>
            </div>
        </div>`;
    }).join('');
}


// ADMIN PRODUCTOS 

let adminTodosProductos = [];
let adminTodasCategorias = [];

function initAdminProductos() {
    if (!document.getElementById('tbody-productos')) return;
    adminCargarCategorias();
    adminCargarProductos();
}

function adminCargarCategorias() {
    fetch('CategoriaController')
        .then(r => r.json())
        .then(cats => {
            adminTodasCategorias = cats;
            const selFiltro = document.getElementById('filtro-categoria');
            const selModal  = document.getElementById('prod-categoria');
            if (selFiltro) selFiltro.innerHTML = '<option value="">Todas las categorías</option>';
            if (selModal)  selModal.innerHTML  = '<option value="">-- Seleccionar --</option>';
            cats.forEach(c => {
                if (selFiltro) selFiltro.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`;
                if (selModal)  selModal.innerHTML  += `<option value="${c.id_categoria}">${c.nombre}</option>`;
            });
        })
        .catch(e => console.error('Error categorías', e));
}

function adminCargarProductos() {
    fetch('ProductoController')
        .then(r => r.json())
        .then(data => {
            adminTodosProductos = data;
            adminRenderProductos(data);
        })
        .catch(() => {
            const t = document.getElementById('tbody-productos');
            if (t) t.innerHTML = '<tr><td colspan="8" class="text-danger text-center py-4">Error al cargar.</td></tr>';
        });
}

function adminRenderProductos(lista) {
    const tbody = document.getElementById('tbody-productos');
    const label = document.getElementById('total-productos');
    if (!tbody) return;
    if (label) label.textContent = `${lista.length} producto(s)`;
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay productos.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(p => `
        <tr>
            <td class="ps-4 text-muted small">${p.id_producto}</td>
            <td>
                <img src="${p.imagen || 'assets/img/producto/no-image.png'}" alt="${p.nombre}"
                     class="rounded tabla-prod-img"
                     onerror="this.src='https://via.placeholder.com/55'">
            </td>
            <td class="fw-semibold">${p.nombre}</td>
            <td><span class="badge bg-info text-dark">${p.categoria ? p.categoria.nombre : '—'}</span></td>
            <td class="text-muted small" class="tabla-prod-desc">
                ${p.descripcion || '—'}
            </td>
            <td class="text-end fw-bold text-danger">S/ ${p.precio.toFixed(2)}</td>
            <td>
                <button class="btn btn-outline-info btn-sm"
                        onclick="adminAbrirInventario(${p.id_producto}, '${adminEscHtml(p.nombre)}')">
                    <i class="bi bi-boxes me-1"></i>Ver stock
                </button>
            </td>
            <td class="text-center">
                <button class="btn btn-outline-warning btn-sm me-1" onclick="adminAbrirEditar(${p.id_producto})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="adminEliminarProducto(${p.id_producto}, '${adminEscHtml(p.nombre)}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`).join('');
}

function adminFiltrarProductos() {
    const texto = (document.getElementById('buscar-prod')?.value || '').toLowerCase();
    const catId = document.getElementById('filtro-categoria')?.value || '';
    const filtro = adminTodosProductos.filter(p => {
        const matchTexto = p.nombre.toLowerCase().includes(texto) || (p.descripcion||'').toLowerCase().includes(texto);
        const matchCat   = !catId || (p.categoria && p.categoria.id_categoria == catId);
        return matchTexto && matchCat;
    });
    adminRenderProductos(filtro);
}

function adminAbrirModalNuevo() {
    document.getElementById('modal-prod-titulo').textContent = 'Nuevo Producto';
    document.getElementById('prod-id').value           = '';
    document.getElementById('prod-nombre').value       = '';
    document.getElementById('prod-precio').value       = '';
    document.getElementById('prod-descripcion').value  = '';
    document.getElementById('prod-categoria').value    = '';
    document.getElementById('prod-imagen').value       = '';
    document.getElementById('prod-imagen-actual').value= '';
    document.getElementById('preview-container').classList.add('d-none');

    adminVariantesNuevas = [];
    adminRenderVariantesInline();
    adminLimpiarFormVarianteInline();
    const secVariantes = document.getElementById('seccion-variantes-inline');
    if (secVariantes) secVariantes.classList.remove('d-none');
    new bootstrap.Modal(document.getElementById('modalProducto')).show();
}

function adminAbrirEditar(idProducto) {
    fetch(`ProductoController?action=buscar&id=${idProducto}`)
        .then(r => r.json())
        .then(p => {
            document.getElementById('modal-prod-titulo').textContent = 'Editar Producto';
            document.getElementById('prod-id').value            = p.id_producto;
            document.getElementById('prod-nombre').value        = p.nombre;
            document.getElementById('prod-precio').value        = p.precio;
            document.getElementById('prod-descripcion').value   = p.descripcion || '';
            document.getElementById('prod-categoria').value     = p.categoria ? p.categoria.id_categoria : '';
            document.getElementById('prod-imagen-actual').value = p.imagen || '';
            if (p.imagen) {
                document.getElementById('preview-img').src = p.imagen;
                document.getElementById('preview-container').classList.remove('d-none');
            } else {
                document.getElementById('preview-container').classList.add('d-none');
            }
            const secVariantes = document.getElementById('seccion-variantes-inline');
            if (secVariantes) secVariantes.classList.add('d-none');
            adminVariantesNuevas = [];
            new bootstrap.Modal(document.getElementById('modalProducto')).show();
        })
        .catch(() => adminMostrarAlerta('Error al cargar el producto', 'danger'));
}

function adminPreviewImagen(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('preview-container').classList.remove('d-none');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function adminGuardarProducto() {
    const id          = document.getElementById('prod-id').value;
    const nombre      = document.getElementById('prod-nombre').value.trim();
    const precio      = document.getElementById('prod-precio').value.trim();
    const categoria   = document.getElementById('prod-categoria').value;
    const descripcion = document.getElementById('prod-descripcion').value.trim();
    const imagenFile  = document.getElementById('prod-imagen').files[0];
    const imagenActual= document.getElementById('prod-imagen-actual').value;

    if (!nombre || !precio || !categoria) {
        adminMostrarAlerta('Completa los campos obligatorios', 'warning'); return;
    }

    const fd = new FormData();
    fd.append('nombre',       nombre);
    fd.append('precio',       precio);
    fd.append('id_categoria', categoria);
    fd.append('descripcion',  descripcion);
    if (imagenFile) fd.append('imagen', imagenFile);

    let url;
    if (id) {
        fd.append('id_producto',   id);
        fd.append('id_categoria',  categoria);   
        fd.append('imagen_actual', imagenActual);
        url = 'ProductoController?action=editar';
    } else {
        url = 'ProductoController?action=guardar';
    }

    fetch(url, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(async data => {
            if (data) {
                if (!id && adminVariantesNuevas.length > 0) {
                    const nuevoId = data.id_producto || data;
                    if (nuevoId && typeof nuevoId === 'number') {
                        await adminGuardarVariantesNuevas(nuevoId);
                    }
                }
                bootstrap.Modal.getInstance(document.getElementById('modalProducto')).hide();
                adminMostrarAlerta(id ? 'Producto actualizado' : `Producto guardado con ${adminVariantesNuevas.length} variante(s)`, 'success');
                adminVariantesNuevas = [];
                adminCargarProductos();
            } else {
                adminMostrarAlerta('No se pudo guardar el producto', 'danger');
            }
        })
        .catch(() => adminMostrarAlerta('Error de conexión', 'danger'));
}

let adminVariantesNuevas = [];

function adminAgregarVarianteInline() {
    const talla = document.getElementById('new-inv-talla')?.value.trim();
    const color = document.getElementById('new-inv-color')?.value.trim();
    const stock = document.getElementById('new-inv-stock')?.value.trim();
    if (!talla || !color || stock === '') {
        adminMostrarAlerta('Completa talla, color y stock', 'warning'); return;
    }
    
    const existe = adminVariantesNuevas.find(v => v.talla === talla && v.color === color);
    if (existe) {
        adminMostrarAlerta('Ya existe esa combinación talla/color', 'warning'); return;
    }
    adminVariantesNuevas.push({ talla, color, stock: parseInt(stock) });
    adminRenderVariantesInline();
    adminLimpiarFormVarianteInline();
}

function adminEliminarVarianteInline(index) {
    adminVariantesNuevas.splice(index, 1);
    adminRenderVariantesInline();
}

function adminRenderVariantesInline() {
    const chips = document.getElementById('variantes-chips');
    if (!chips) return;
    if (adminVariantesNuevas.length === 0) {
        chips.innerHTML = '<span class="text-muted small fst-italic">Sin variantes agregadas aún.</span>';
        return;
    }
    chips.innerHTML = adminVariantesNuevas.map((v, i) => `
        <div class="var-chip">
            <span>${v.talla}</span>
            <span class="text-muted">·</span>
            <span>${v.color}</span>
            <span class="badge bg-danger bg-opacity-10 text-danger" style="font-size:0.72rem;border-radius:10px">${v.stock}</span>
            <button class="var-chip-btn" onclick="adminEliminarVarianteInline(${i})" title="Quitar">×</button>
        </div>`).join('');
}

function adminLimpiarFormVarianteInline() {
    const t = document.getElementById('new-inv-talla');
    const c = document.getElementById('new-inv-color');
    const s = document.getElementById('new-inv-stock');
    if (t) t.value = '';
    if (c) c.value = '';
    if (s) s.value = '';
}

async function adminGuardarVariantesNuevas(idProducto) {
    const promesas = adminVariantesNuevas.map(v =>
        fetch('InventarioController?action=guardar', {
            method: 'POST',
            body: new URLSearchParams({ id_producto: idProducto, talla: v.talla, color: v.color, stock: v.stock })
        }).then(r => r.json())
    );
    try { await Promise.all(promesas); } catch(e) { console.error('Error guardando variantes', e); }
}

function adminEliminarProducto(id, nombre) {
    Swal.fire({
        title: `¿Eliminar "${nombre}"?`,
        icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#c9536a', cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(r => {
        if (!r.isConfirmed) return;
        fetch(`ProductoController?action=eliminar&id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    adminMostrarAlerta('Producto eliminado', 'success');
                    adminCargarProductos();
                } else {
                    adminMostrarAlerta('No se pudo eliminar (puede tener inventario asociado)', 'danger');
                }
            })
            .catch(() => adminMostrarAlerta('Error de conexión', 'danger'));
    });
}


function adminAbrirInventario(idProducto, nombreProducto) {
    document.getElementById('inv-id-producto').value = idProducto;
    document.getElementById('inv-prod-nombre').textContent = nombreProducto;
    adminLimpiarFormInv();
    adminCargarInventario(idProducto);
    new bootstrap.Modal(document.getElementById('modalInventario')).show();
}

function adminCargarInventario(idProducto) {
    fetch(`AppController?action=listarInventario&id_producto=${idProducto}`)
        .then(r => r.json())
        .then(data => {
            const tbody = document.getElementById('tbody-inventario');
            if (!tbody) return;
            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin variantes registradas.</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(inv => `
                <tr>
                    <td><span class="badge bg-secondary">${inv.talla}</span></td>
                    <td>${inv.color}</td>
                    <td class="text-center">
                        <span class="badge ${inv.stock > 5 ? 'bg-success' : inv.stock > 0 ? 'bg-warning text-dark' : 'bg-danger'}">
                            ${inv.stock}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-outline-warning btn-sm me-1"
                                onclick="adminEditarVariante(${inv.id_inventario},'${adminEscHtml(inv.talla)}','${adminEscHtml(inv.color)}',${inv.stock})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm"
                                onclick="adminEliminarVariante(${inv.id_inventario})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>`).join('');
        })
        .catch(() => {
            const t = document.getElementById('tbody-inventario');
            if (t) t.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Error al cargar.</td></tr>';
        });
}

function adminGuardarInventario() {
    const idInv  = document.getElementById('inv-id-inventario').value;
    const idProd = document.getElementById('inv-id-producto').value;
    const talla  = document.getElementById('inv-talla').value.trim();
    const color  = document.getElementById('inv-color').value.trim();
    const stock  = document.getElementById('inv-stock').value.trim();

    if (!talla || !color || stock === '') {
        adminMostrarAlerta('Completa talla, color y stock', 'warning'); return;
    }

    const params = new URLSearchParams({ id_producto: idProd, talla, color, stock });
    let url;
    if (idInv) { params.append('id_inventario', idInv); url = 'InventarioController?action=editar'; }
    else        { url = 'InventarioController?action=guardar'; }

    fetch(url, { method: 'POST', body: params })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                adminMostrarAlerta(data.message, 'success');
                adminLimpiarFormInv();
                adminCargarInventario(idProd);
            } else {
                adminMostrarAlerta(data.message || 'Error al guardar', 'danger');
            }
        })
        .catch(() => adminMostrarAlerta('Error de conexión', 'danger'));
}

function adminEditarVariante(id, talla, color, stock) {
    document.getElementById('inv-id-inventario').value = id;
    document.getElementById('inv-talla').value  = talla;
    document.getElementById('inv-color').value  = color;
    document.getElementById('inv-stock').value  = stock;
}

function adminEliminarVariante(id) {
    Swal.fire({
        title: '¿Eliminar variante?', icon: 'warning', showCancelButton: true,
        confirmButtonColor: '#c9536a', cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(r => {
        if (!r.isConfirmed) return;
        const idProd = document.getElementById('inv-id-producto').value;
        fetch('InventarioController?action=eliminar', {
            method: 'POST',
            body: new URLSearchParams({ id_inventario: id })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    adminMostrarAlerta('Variante eliminada', 'success');
                    adminCargarInventario(idProd);
                } else {
                    adminMostrarAlerta(data.message || 'Error al eliminar', 'danger');
                }
            })
            .catch(() => adminMostrarAlerta('Error de conexión', 'danger'));
    });
}

function adminLimpiarFormInv() {
    document.getElementById('inv-id-inventario').value = '';
    document.getElementById('inv-talla').value  = '';
    document.getElementById('inv-color').value  = '';
    document.getElementById('inv-stock').value  = '';
}


// ADMIN PEDIDOS 

let adminTodosPedidos = [];

function initAdminPedidos() {
    if (!document.getElementById('tbody-pedidos')) return;
    adminCargarTodosPedidos();
}

function adminCargarTodosPedidos() {
    fetch('AppController?action=listarTodosPedidos')
        .then(r => r.json())
        .then(data => {
            adminTodosPedidos = Array.isArray(data) ? data : [];
            adminCalcStats(adminTodosPedidos);
            adminRenderPedidos(adminTodosPedidos);
        })
        .catch(() => {
            const t = document.getElementById('tbody-pedidos');
            if (t) t.innerHTML = '<tr><td colspan="7" class="text-danger text-center py-4">Error al cargar pedidos.</td></tr>';
        });
}

function adminCalcStats(pedidos) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('s-total',      pedidos.length);
    set('s-pendientes', pedidos.filter(p => p.estado === 'PENDIENTE').length);
    set('s-enviados',   pedidos.filter(p => p.estado === 'ENVIADO').length);
    set('s-entregados', pedidos.filter(p => p.estado === 'ENTREGADO').length);
}

function adminRenderPedidos(lista) {
    const tbody = document.getElementById('tbody-pedidos');
    const label = document.getElementById('total-pedidos-label');
    if (!tbody) return;
    if (label) label.textContent = `${lista.length} pedido(s)`;
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay pedidos.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(p => {
        const persona   = p.persona   || {};
        const direccion = p.direccion || {};
        const nombre    = `${persona.nombre||''} ${persona.apell_paterno||''}`.trim() || '—';
        const dir       = direccion.ciudad ? `${direccion.ciudad} — ${direccion.calle||''}` : '—';
        return `
        <tr>
            <td class="ps-4 text-muted small fw-bold">#${p.id_pedido}</td>
            <td>
                <div class="fw-semibold">${nombre}</div>
                <div class="text-muted small">${persona.correo||''}</div>
            </td>
            <td class="small text-muted">${adminFormatFecha(p.fecha)}</td>
            <td class="small text-muted" class="tabla-ped-dir">${dir}</td>
            <td class="text-end fw-bold text-danger">S/ ${(p.total||0).toFixed(2)}</td>
            <td class="text-center">
                <span class="badge rounded-pill ${adminBadgeEstado(p.estado)}">${(p.estado||'—').replace('_',' ')}</span>
            </td>
            <td class="text-center">
                <button class="btn btn-outline-info btn-sm me-1" onclick="adminVerDetallePedido(${p.id_pedido})">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-outline-warning btn-sm" onclick="adminAbrirCambioEstado(${p.id_pedido},'${p.estado}')">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function adminFiltrarPedidos() {
    const texto  = (document.getElementById('buscar-pedido')?.value || '').toLowerCase();
    const estado = document.getElementById('filtro-estado')?.value || '';
    const filtro = adminTodosPedidos.filter(p => {
        const persona = p.persona || {};
        const nombre  = `${persona.nombre||''} ${persona.apell_paterno||''}`.toLowerCase();
        return (nombre.includes(texto) || String(p.id_pedido).includes(texto)) &&
               (!estado || p.estado === estado);
    });
    adminRenderPedidos(filtro);
}

function adminVerDetallePedido(idPedido) {
    document.getElementById('det-id').textContent = idPedido;
    document.getElementById('modal-det-body').innerHTML =
        '<div class="text-center py-4"><div class="spinner-border text-danger"></div></div>';
    new bootstrap.Modal(document.getElementById('modalDetalle')).show();

    fetch(`AppController?action=detallePedido&id_pedido=${idPedido}`)
        .then(r => r.json())
        .then(p => {
            if (p.error) {
                document.getElementById('modal-det-body').innerHTML = `<p class="text-danger">${p.error}</p>`;
                return;
            }
            const persona   = p.persona   || {};
            const direccion = p.direccion || {};
            const detalles  = p.detallepedido || [];
            const subtotal  = detalles.reduce((s, d) => s + d.subtotal, 0);

            document.getElementById('modal-det-body').innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <div class="card border-0 bg-light p-3 h-100">
                            <p class="fw-bold mb-2 text-info"><i class="bi bi-person me-1"></i>Cliente</p>
                            <p class="mb-1">${persona.nombre||''} ${persona.apell_paterno||''} ${persona.apell_materno||''}</p>
                            <p class="text-muted small mb-1">${persona.correo||'—'}</p>
                            <p class="text-muted small mb-0">${persona.telefono||'—'}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-0 bg-light p-3 h-100">
                            <p class="fw-bold mb-2 text-info"><i class="bi bi-geo-alt me-1"></i>Dirección</p>
                            <p class="mb-1">${direccion.calle||'—'}</p>
                            <p class="text-muted small mb-1">${direccion.ciudad||'—'}</p>
                            <p class="mb-0"><span class="badge ${adminBadgeEstado(p.estado)}">${(p.estado||'—').replace('_',' ')}</span></p>
                        </div>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-sm align-middle">
                        <thead class="bg-info text-white">
                            <tr>
                                <th>Producto</th><th>Talla</th><th>Color</th>
                                <th class="text-center">Cant.</th>
                                <th class="text-end">Precio</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalles.map(d => `
                            <tr>
                                <td class="fw-semibold">${d.producto ? d.producto.nombre : '—'}</td>
                                <td>${d.inventario ? d.inventario.talla : '—'}</td>
                                <td>${d.inventario ? d.inventario.color : '—'}</td>
                                <td class="text-center">${d.cantidad}</td>
                                <td class="text-end">S/ ${d.precio_unitario.toFixed(2)}</td>
                                <td class="text-end fw-bold">S/ ${d.subtotal.toFixed(2)}</td>
                            </tr>`).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-danger">
                                <td colspan="5" class="fw-bold text-end">TOTAL</td>
                                <td class="fw-bold text-end fs-5 text-danger">S/ ${subtotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;
        })
        .catch(() => {
            document.getElementById('modal-det-body').innerHTML = '<p class="text-danger text-center">Error al cargar.</p>';
        });
}

function adminAbrirCambioEstado(idPedido, estadoActual) {
    document.getElementById('estado-id-pedido').value      = idPedido;
    document.getElementById('estado-num-pedido').textContent = idPedido;
    document.getElementById('nuevo-estado').value          = estadoActual || 'PENDIENTE';
    new bootstrap.Modal(document.getElementById('modalEstado')).show();
}

function adminConfirmarCambioEstado() {
    const idPedido    = document.getElementById('estado-id-pedido').value;
    const nuevoEstado = document.getElementById('nuevo-estado').value;
    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({ action: 'cambiarEstadoPedido', id_pedido: idPedido, nuevo_estado: nuevoEstado })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('modalEstado')).hide();
                adminMostrarAlerta('Estado actualizado correctamente', 'success');
                adminCargarTodosPedidos();
            } else {
                adminMostrarAlerta(data.message || 'Error al actualizar', 'danger');
            }
        })
        .catch(() => adminMostrarAlerta('Error de conexión', 'danger'));
}


// UTILIDADES ADMIN 

function adminFormatFecha(f) {
    if (!f) return '—';
    try { return new Date(f).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }); }
    catch(e) { return f; }
}

function adminBadgeEstado(e) {
    const m = { PENDIENTE:'bg-warning text-dark', ENVIADO:'bg-info text-dark', ENTREGADO:'bg-success', CANCELADO:'bg-secondary' };
    return m[e] || 'bg-secondary';
}

function adminEscHtml(s) {
    return (s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}

function adminMostrarAlerta(msg, tipo) {
    const a = document.createElement('div');
    a.className = `alert alert-${tipo} alert-dismissible fade show position-fixed bottom-0 end-0 m-3 shadow`;
    a.style.zIndex = 9999;
    a.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(a);
    setTimeout(() => a.remove(), 3500);
}