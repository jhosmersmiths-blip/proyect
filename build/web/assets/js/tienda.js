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
    if (contenedor.length === 0) return;

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
    if (parseInt($('#cantidad-variante').val()) > stock) $('#cantidad-variante').val(stock);

    $('#btn-agregar-variante').data('id-inventario', idInv).prop('disabled', false);
});

$(document).on('click', '#btn-agregar-variante', function () {
    const idInv = $(this).data('id-inventario');
    const cantidad = parseInt($('#cantidad-variante').val()) || 1;
    if (!idInv) {
        Swal.fire({ icon: 'warning', title: 'Selecciona una variante', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        return;
    }
    agregarCarrito(idInv, cantidad);
    bootstrap.Modal.getInstance(document.getElementById('modalTallas')).hide();
});

// ─── CARRITO ───────────────────────────────────────────────
function agregarCarrito(idInventario, cantidad = 1) {
    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({ action: 'AddCarrito', id_inventario: idInventario, cantidad: cantidad })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                $('#cart-count').text(data.itemsEnCarrito);
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500 });
            } else {
                Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: data.message, showConfirmButton: false, timer: 2000 });
            }
        })
        .catch(() => Swal.fire('Error', 'No se pudo conectar con el servidor', 'error'));
}

function cargarCarrito() {
    const tabla = $('#tabla-carrito tbody');
    if (tabla.length === 0) return;

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
        body: new URLSearchParams({ action: 'delete', id_inventario: idInventario })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500 });
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
        Swal.fire({ title: 'Carrito Vacío', text: 'No tienes productos en el carrito.', icon: 'warning', confirmButtonColor: '#c9536a', confirmButtonText: 'Ir a la tienda' })
            .then(() => window.location.href = 'index.html');
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('usuario'));
    if (!user) {
        Swal.fire({ title: 'Inicia Sesión', text: 'Debes estar logueado para finalizar la compra.', icon: 'info', showCancelButton: true, confirmButtonColor: '#c9536a', cancelButtonColor: '#6c757d', confirmButtonText: 'Ir al Login', cancelButtonText: 'Cancelar' })
            .then(result => { if (result.isConfirmed) $('#modalLogin').modal('show'); });
        return;
    }

    // Cargar direcciones del usuario para seleccionar
    cargarDireccionesYConfirmar(user);
}

function cargarDireccionesYConfirmar(user) {
    fetch(`DireccionController?action=listar`)
        .then(res => res.json())
        .then(direcciones => {
            const misDirecciones = direcciones.filter(d => d.persona.id_persona === user.persona.id_persona);

            if (misDirecciones.length === 0) {
                Swal.fire({
                    title: 'Sin dirección registrada',
                    text: 'Debes tener al menos una dirección de envío.',
                    icon: 'warning',
                    confirmButtonColor: '#c9536a'
                });
                return;
            }

            // Construir opciones de dirección
            let opcionesHTML = misDirecciones.map(d =>
                `<option value="${d.id_direccion}">${d.ciudad} - ${d.calle}${d.es_principal ? ' (Principal)' : ''}</option>`
            ).join('');

            Swal.fire({
                title: 'Selecciona tu dirección de envío',
                html: `<select id="swal-direccion" class="form-select mt-2">${opcionesHTML}</select>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#c9536a',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Confirmar compra',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return document.getElementById('swal-direccion').value;
                }
            }).then(result => {
                if (result.isConfirmed && result.value) {
                    confirmarCompra(result.value);
                }
            });
        })
        .catch(() => {
            // Si no hay direcciones cargadas, pedir id_direccion manual
            Swal.fire({
                title: '¿Confirmar Compra?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#c9536a',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, comprar',
                cancelButtonText: 'Cancelar'
            }).then(result => {
                if (result.isConfirmed) confirmarCompra(1);
            });
        });
}

function confirmarCompra(idDireccion) {
    Swal.fire({ title: 'Procesando pedido...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    fetch('AppController', {
        method: 'POST',
        body: new URLSearchParams({ action: 'GenerarCompra', id_direccion: idDireccion })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({ icon: 'success', title: '¡Compra exitosa!', text: `Total: S/ ${data.total ? data.total.toFixed(2) : '0.00'}`, confirmButtonColor: '#c9536a' })
                    .then(() => {
                        $('#cart-count').text('0');
                        window.location.href = 'index.html';
                    });
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(() => Swal.fire('Error', 'Hubo un problema en la conexión', 'error'));
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
    fetch('AuthController', { method: 'POST', body: new URLSearchParams({ action: 'Salir' }) })
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

        fetch('AuthController', { method: 'POST', body: new URLSearchParams(datos) })
            .then(res => res.json())
            .then(data => {
                // El AuthController usa "sucess" (con typo) — lo manejamos en ambas formas
                if (data.sucess || data.success) {
                    sessionStorage.setItem('usuario', JSON.stringify(data.userData));
                    $('#modalLogin').modal('hide');
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '¡Bienvenido!', showConfirmButton: false, timer: 1500 })
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

        fetch('AuthController', { method: 'POST', body: new URLSearchParams(datos) })
            .then(res => res.json())
            .then(data => {
                if (data.sucess || data.success) {
                    Swal.fire({ icon: 'success', title: '¡Registro exitoso!', text: 'Ya puedes iniciar sesión.', confirmButtonColor: '#c9536a' })
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
    if (tablaElemento.length === 0) return;

    if ($.fn.DataTable) {
        if ($.fn.DataTable.isDataTable('#tabla-productos')) {
            tablaElemento.DataTable().destroy();
        }
        tablaElemento.DataTable({
            ajax: { url: 'ProductoController?action=listar', dataSrc: '' },
            columns: [
                { data: null, render: (d, t, r, m) => m.row + 1 },
                { data: 'imagen', render: d => `<img src="${d || 'assets/img/producto/default.png'}" width="50" class="img-thumbnail shadow-sm" onerror="this.src='https://via.placeholder.com/50'">` },
                { data: 'nombre' },
                { data: 'descripcion' },
                { data: 'precio', render: d => `<b>S/ ${d.toFixed(2)}</b>` },
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
                oPaginate: { sFirst: 'Primero', sLast: 'Último', sNext: 'Siguiente', sPrevious: 'Anterior' },
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
    fetch('ProductoController', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(res => {
            if (res) {
                Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Producto guardado correctamente.', confirmButtonColor: '#c9536a' });
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
            fetch(`ProductoController?action=eliminar&id=${id}`, { method: 'POST' })
                .then(res => res.json())
                .then(res => {
                    if (res) {
                        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Producto borrado.', confirmButtonColor: '#c9536a' });
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

    fetch('InventarioController', { method: 'POST', body: new URLSearchParams(formData) })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500 });
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
                body: new URLSearchParams({ action: 'eliminar', id_inventario: id })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 1500 });
                        cargarInventarioTabla(idProducto);
                    }
                });
        }
    });
}
