/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.InventarioDaoImpl;
import Dao.PagosDaoImpl;
import Dao.PedidoDaoImpl;
import Dao.ProductoDaoImpl;
import Interface.IInventario;
import Interface.IPagos;
import Interface.IPedido;
import Interface.IProducto;
import Model.DetallePedido;
import Model.Direccion;
import Model.EstadoPago;
import Model.EstadoPedido;
import Model.Inventario;
import Model.Pagos;
import Model.Pedidos;
import Model.Persona;
import Model.Producto;
import Model.Usuario;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
@WebServlet(name = "AppController", urlPatterns = {"/AppController"})
public class AppController extends HttpServlet {

    private final IProducto pDao = new ProductoDaoImpl();
    private final IInventario iDao = new InventarioDaoImpl();
    private final IPedido peDao = new PedidoDaoImpl();
    private final IPagos pagoDao = new PagosDaoImpl();
    private final Gson gson = new Gson();

    private static class ItemEdicion {

        int id_det_pedido;
        int id_inventario;
        int cantidad;
    }

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String action = request.getParameter("action");
        if (action == null) {
            action = "listarProductos";
        }

        JsonObject jr = new JsonObject();
        HttpSession session = request.getSession(true);

        List<DetallePedido> carrito
                = (List<DetallePedido>) session.getAttribute("carrito");
        if (carrito == null) {
            carrito = new ArrayList<>();
            session.setAttribute("carrito", carrito);
        }

        try (PrintWriter out = response.getWriter()) {
            switch (action) {

                case "listarProductos":
                    List<Producto> productos = pDao.listar();
                    out.print(gson.toJson(productos));
                    break;

                case "listarInventario":
                    try {
                        int idProd = Integer.parseInt(
                                request.getParameter("id_producto"));
                        List<Inventario> todos = iDao.listar();
                        List<Inventario> filtrados = new ArrayList<>();
                        for (Inventario i : todos) {
                            if (i.getProducto().getId_producto() == idProd) {
                                filtrados.add(i);
                            }
                        }
                        out.print(gson.toJson(filtrados));
                    } catch (Exception e) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error: " + e.getMessage());
                        out.print(jr.toString());
                    }
                    break;

                case "AddCarrito":
                    try {
                        int idInv = Integer.parseInt(
                                request.getParameter("id_inventario"));
                        String cantParam = request.getParameter("cantidad");
                        int cantidad = (cantParam != null)
                                ? Integer.parseInt(cantParam) : 1;

                        Inventario inv = iDao.buscarPorId(idInv);
                        if (inv == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Variante no encontrada");
                            out.print(jr.toString());
                            break;
                        }

                        Producto prod = pDao.buscarPorId(
                                inv.getProducto().getId_producto());
                        if (prod == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Producto no encontrado");
                            out.print(jr.toString());
                            break;
                        }

                        int stockDisp = inv.getStock();

                        int pos = -1;
                        for (int i = 0; i < carrito.size(); i++) {
                            if (carrito.get(i).getInventario()
                                    .getId_inventario() == idInv) {
                                pos = i;
                                break;
                            }
                        }

                        int cantActual = (pos != -1)
                                ? carrito.get(pos).getCantidad() : 0;
                        int cantFinal = cantActual + cantidad;

                        if (cantFinal > stockDisp) {
                            jr.addProperty("success", false);
                            jr.addProperty("message",
                                    "Stock insuficiente. Disponible: " + stockDisp);
                            out.print(jr.toString());
                            break;
                        }

                        if (pos != -1) {
                            DetallePedido existente = carrito.get(pos);
                            existente.setCantidad(cantFinal);
                            existente.setSubtotal(
                                    cantFinal * existente.getPrecio_unitario());
                        } else {
                            DetallePedido det = new DetallePedido();

                            Producto prodRef = new Producto();
                            prodRef.setId_producto(prod.getId_producto());
                            prodRef.setNombre(prod.getNombre());
                            prodRef.setPrecio(prod.getPrecio());
                            det.setProducto(prodRef);

                            Inventario invRef = new Inventario();
                            invRef.setId_inventario(idInv);
                            invRef.setTalla(inv.getTalla());
                            invRef.setColor(inv.getColor());
                            det.setInventario(invRef);

                            det.setCantidad(cantidad);
                            det.setPrecio_unitario(prod.getPrecio());
                            det.setSubtotal(cantidad * prod.getPrecio());

                            carrito.add(det);
                        }

                        session.setAttribute("carrito", carrito);

                        jr.addProperty("success", true);
                        jr.addProperty("message", "Producto agregado al carrito");
                        jr.addProperty("itemsEnCarrito", carrito.size());

                    } catch (Exception e) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error: " + e.getMessage());
                    }
                    out.print(jr.toString());
                    break;

                case "listarCarrito":
                    double total = carrito.stream()
                            .mapToDouble(DetallePedido::getSubtotal).sum();
                    session.setAttribute("total", total);

                    JsonObject carData = new JsonObject();
                    carData.add("items", gson.toJsonTree(carrito));
                    carData.addProperty("total", total);
                    carData.addProperty("cantidad", carrito.size());
                    out.print(carData.toString());
                    break;

                case "delete":
                    try {
                        int idElim = Integer.parseInt(
                                request.getParameter("id_inventario"));

                        boolean eliminado = carrito.removeIf(
                                d -> d.getInventario()
                                        .getId_inventario() == idElim);

                        session.setAttribute("carrito", carrito);

                        jr.addProperty("success", eliminado);
                        jr.addProperty("message", eliminado
                                ? "Producto eliminado del carrito"
                                : "Item no encontrado en el carrito");

                    } catch (Exception e) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error: " + e.getMessage());
                    }
                    out.print(jr.toString());
                    break;

                case "listarMisCompras":
                    Usuario userCompras = (Usuario) session.getAttribute("usuario");
                    if (userCompras == null || userCompras.getPersona() == null) {
                        out.print("[]");
                        break;
                    }
                    List<Pedidos> misPedidos = peDao.listarPorPersona(
                            userCompras.getPersona().getId_persona());
                    out.print(gson.toJson(misPedidos));
                    break;
                // listar TODOS los pedidos 
                case "listarTodosPedidos":
                    try {
                        List<Pedidos> todosPedidos = peDao.listarTodos();
                        out.print(gson.toJson(todosPedidos));
                    } catch (Exception ex) {
                        out.print("[]");
                    }
                    break;
                // cambiar estado de un pedido 
                case "cambiarEstadoPedido":
                    try {
                        int idPedCambio = Integer.parseInt(request.getParameter("id_pedido"));
                        String nuevoEstado = request.getParameter("nuevo_estado");
                        boolean okEstado = peDao.cambiarEstado(idPedCambio, nuevoEstado);
                        jr.addProperty("success", okEstado);
                        jr.addProperty("message", okEstado ? "Estado actualizado" : "Error al actualizar");
                        out.print(jr.toString());
                    } catch (Exception ex) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error: " + ex.getMessage());
                        out.print(jr.toString());
                    }
                    break;
                case "detallePedido":
                    try {
                        int idPed = Integer.parseInt(request.getParameter("id_pedido"));
                        Pedidos pedidoDetalle = peDao.buscarPorId(idPed);
                        if (pedidoDetalle != null) {
                            out.print(gson.toJson(pedidoDetalle));
                        } else {
                            jr.addProperty("error", "Pedido no encontrado");
                            out.print(jr.toString());
                        }
                    } catch (Exception e) {
                        jr.addProperty("error", "Error: " + e.getMessage());
                        out.print(jr.toString());
                    }
                    break;

                case "GenerarCompra":
                    Usuario user = (Usuario) session.getAttribute("usuario");

                    int idPersonaParam = 0;
                    String idPersonaStr = request.getParameter("id_persona");
                    if (idPersonaStr != null && !idPersonaStr.isEmpty()) {
                        try {
                            idPersonaParam = Integer.parseInt(idPersonaStr);
                        } catch (Exception ex) {
                        }
                    }

                    if ((user == null || user.getPersona() == null) && idPersonaParam == 0) {
                        jr.addProperty("success", false);
                        jr.addProperty("message",
                                "Debe iniciar sesión para continuar");
                        out.print(jr.toString());
                        return;
                    }

                    // Usar persona de sesion o del parametro
                    int idPersona = (user != null && user.getPersona() != null)
                            ? user.getPersona().getId_persona()
                            : idPersonaParam;

                    if (carrito.isEmpty()) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "El carrito está vacío");
                        out.print(jr.toString());
                        return;
                    }

                    String idDirParam = request.getParameter("id_direccion");
                    if (idDirParam == null || idDirParam.trim().isEmpty()) {
                        jr.addProperty("success", false);
                        jr.addProperty("message",
                                "Debe seleccionar una dirección de envío");
                        out.print(jr.toString());
                        return;
                    }

                    for (DetallePedido det : carrito) {
                        Inventario invCheck = iDao.buscarPorId(
                                det.getInventario().getId_inventario());

                        if (invCheck == null
                                || invCheck.getStock() < det.getCantidad()) {
                            jr.addProperty("success", false);
                            jr.addProperty("message",
                                    "Stock insuficiente para: "
                                    + det.getProducto().getNombre()
                                    + " | Talla: "
                                    + det.getInventario().getTalla()
                                    + " | Color: "
                                    + det.getInventario().getColor()
                                    + " | Disponible: "
                                    + (invCheck != null
                                            ? invCheck.getStock() : 0));
                            out.print(jr.toString());
                            return;
                        }
                    }

                    double totalPagar = carrito.stream()
                            .mapToDouble(DetallePedido::getSubtotal).sum();

                    Pedidos pedido = new Pedidos();

                    Persona persona = new Persona();
                    persona.setId_persona(
                            user.getPersona().getId_persona());
                    pedido.setPersona(persona);

                    Direccion direccion = new Direccion();
                    direccion.setId_direccion(
                            Integer.parseInt(idDirParam));
                    pedido.setDireccion(direccion);

                    pedido.setFecha(
                            new Timestamp(System.currentTimeMillis()));
                    pedido.setTotal(totalPagar);
                    pedido.setDetallepedido(carrito);

                    int resultado = peDao.generarPedido(pedido);

                    if (resultado > 0) {
                        // Registrar el pago en la tabla PAGOS
                        String metodoPagoParam = request.getParameter("metodo_pago");
                        if (metodoPagoParam == null || metodoPagoParam.trim().isEmpty()) {
                            metodoPagoParam = "NO_ESPECIFICADO";
                        }
                        Pagos pago = new Pagos();
                        Pedidos pedidoRef = new Pedidos();
                        pedidoRef.setId_pedido(resultado);
                        pedidoRef.setTotal(totalPagar);
                        pago.setPedidos(pedidoRef);
                        pago.setMetodo_pago(metodoPagoParam);
                        pago.setFecha(new Timestamp(System.currentTimeMillis()));
                        pago.setEstadopago(EstadoPago.PAGADO);
                        pago.setImagen(null);
                        int pagoRegistrado = pagoDao.registrarPago(pago);
                        System.out.println("PAGO: " + (pagoRegistrado > 0 ? "OK" : "FALLO") + " | ID_PEDIDO=" + resultado);

                        // Descontar stock
                        for (DetallePedido det : carrito) {
                            Inventario invAct = iDao.buscarPorId(
                                    det.getInventario().getId_inventario());
                            if (invAct != null) {
                                int nuevoStock
                                        = invAct.getStock() - det.getCantidad();
                                iDao.actualizarStock(
                                        det.getInventario().getId_inventario(),
                                        nuevoStock);
                            }
                        }

                        carrito.clear();
                        session.setAttribute("carrito", carrito);
                        session.setAttribute("total", 0.0);

                        jr.addProperty("success", true);
                        jr.addProperty("message", "¡Compra exitosa!");
                        jr.addProperty("total", totalPagar);
                        jr.addProperty("id_pedido", resultado);

                    } else {
                        jr.addProperty("success", false);
                        jr.addProperty("message",
                                "No se pudo procesar la compra. "
                                + "Intente nuevamente.");
                    }
                    out.print(jr.toString());
                    break;
                case "editarPedido":
                    try {
                        Usuario userEdit = (Usuario) session.getAttribute("usuario");
                        if (userEdit == null || userEdit.getPersona() == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Debe iniciar sesión para continuar");
                            out.print(jr.toString());
                            return;
                        }

                        int idPedidoEdit = Integer.parseInt(request.getParameter("id_pedido"));
                        String itemsJson = request.getParameter("items");

                        Pedidos pedidoEdit = peDao.buscarPorId(idPedidoEdit);
                        if (pedidoEdit == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Pedido no encontrado");
                            out.print(jr.toString());
                            return;
                        }

                        // Validar que el pedido pertenezca al cliente en sesión
                        if (pedidoEdit.getPersona() == null
                                || pedidoEdit.getPersona().getId_persona()
                                != userEdit.getPersona().getId_persona()) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "No tiene permisos sobre este pedido");
                            out.print(jr.toString());
                            return;
                        }

                        // A1 - Pedido en tránsito o más allá: no se puede editar
                        EstadoPedido estadoActualEdit = pedidoEdit.getEstado();
                        if (estadoActualEdit == EstadoPedido.ENVIADO) {
                            jr.addProperty("success", false);
                            jr.addProperty("message",
                                    "Su pedido ya está en camino, para cambios contacte a soporte.");
                            out.print(jr.toString());
                            return;
                        }
                        if (estadoActualEdit == EstadoPedido.ENTREGADO
                                || estadoActualEdit == EstadoPedido.CANCELADO) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Este pedido no se puede modificar.");
                            out.print(jr.toString());
                            return;
                        }

                        if (itemsJson == null || itemsJson.trim().isEmpty()) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "No se recibieron cambios para aplicar.");
                            out.print(jr.toString());
                            return;
                        }

                        ItemEdicion[] itemsEdit = gson.fromJson(itemsJson, ItemEdicion[].class);
                        if (itemsEdit == null || itemsEdit.length == 0) {
                            jr.addProperty("success", false);
                            jr.addProperty("message",
                                    "El pedido debe tener al menos un producto. "
                                    + "Si deseas cancelar todo, usa la opción Cancelar.");
                            out.print(jr.toString());
                            return;
                        }

                        // Validar stock para todos los cambios ANTES de aplicar nada
                        for (ItemEdicion itEdit : itemsEdit) {
                            DetallePedido original = null;
                            for (DetallePedido d : pedidoEdit.getDetallepedido()) {
                                if (d.getId_det_pedido() == itEdit.id_det_pedido) {
                                    original = d;
                                    break;
                                }
                            }
                            if (original == null) {
                                jr.addProperty("success", false);
                                jr.addProperty("message", "Ítem de pedido no encontrado.");
                                out.print(jr.toString());
                                return;
                            }
                            if (itEdit.cantidad > 0) {
                                Inventario invDestino = iDao.buscarPorId(itEdit.id_inventario);
                                if (invDestino == null) {
                                    jr.addProperty("success", false);
                                    jr.addProperty("message", "Variante de producto no encontrada.");
                                    out.print(jr.toString());
                                    return;
                                }
                                boolean mismaVariante
                                        = invDestino.getId_inventario()
                                        == original.getInventario().getId_inventario();
                                int cantidadRequerida = mismaVariante
                                        ? (itEdit.cantidad - original.getCantidad())
                                        : itEdit.cantidad;
                                if (cantidadRequerida > 0
                                        && invDestino.getStock() < cantidadRequerida) {
                                    jr.addProperty("success", false);
                                    jr.addProperty("message",
                                            "Stock insuficiente para "
                                            + original.getProducto().getNombre()
                                            + " (Talla: " + invDestino.getTalla()
                                            + ", Color: " + invDestino.getColor()
                                            + "). Disponible: " + invDestino.getStock());
                                    out.print(jr.toString());
                                    return;
                                }
                            }
                        }

                        // Aplicar los cambios: ajustar stock y actualizar/eliminar detalle
                        double nuevoTotalEdit = 0.0;
                        for (ItemEdicion itEdit : itemsEdit) {
                            DetallePedido original = null;
                            for (DetallePedido d : pedidoEdit.getDetallepedido()) {
                                if (d.getId_det_pedido() == itEdit.id_det_pedido) {
                                    original = d;
                                    break;
                                }
                            }
                            int idInvOriginal = original.getInventario().getId_inventario();

                            if (itEdit.cantidad <= 0) {
                                // Quitar producto del pedido: liberar todo su stock reservado
                                Inventario invOriginal = iDao.buscarPorId(idInvOriginal);
                                if (invOriginal != null) {
                                    iDao.actualizarStock(idInvOriginal,
                                            invOriginal.getStock() + original.getCantidad());
                                }
                                peDao.eliminarItemDetalle(original.getId_det_pedido());
                                continue;
                            }

                            boolean mismaVariante = itEdit.id_inventario == idInvOriginal;

                            if (mismaVariante) {
                                int delta = itEdit.cantidad - original.getCantidad();
                                if (delta != 0) {
                                    Inventario invDestino = iDao.buscarPorId(itEdit.id_inventario);
                                    iDao.actualizarStock(itEdit.id_inventario,
                                            invDestino.getStock() - delta);
                                }
                            } else {
                                // Cambio de talla/color: liberar la variante anterior
                                Inventario invOriginal = iDao.buscarPorId(idInvOriginal);
                                if (invOriginal != null) {
                                    iDao.actualizarStock(idInvOriginal,
                                            invOriginal.getStock() + original.getCantidad());
                                }
                                Inventario invDestino = iDao.buscarPorId(itEdit.id_inventario);
                                iDao.actualizarStock(itEdit.id_inventario,
                                        invDestino.getStock() - itEdit.cantidad);
                            }

                            double nuevoSubtotal = itEdit.cantidad * original.getPrecio_unitario();
                            peDao.actualizarItemDetalle(original.getId_det_pedido(),
                                    itEdit.id_inventario, itEdit.cantidad, nuevoSubtotal);
                            nuevoTotalEdit += nuevoSubtotal;
                        }

                        peDao.actualizarTotal(idPedidoEdit, nuevoTotalEdit);

                        jr.addProperty("success", true);
                        jr.addProperty("message",
                                "Pedido actualizado correctamente. Se notificó la actualización.");
                        jr.addProperty("total", nuevoTotalEdit);
                        out.print(jr.toString());

                    } catch (Exception ex) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error al editar el pedido: " + ex.getMessage());
                        out.print(jr.toString());
                    }
                    break;

                case "cancelarPedido":
                    try {
                        Usuario userCancel = (Usuario) session.getAttribute("usuario");
                        if (userCancel == null || userCancel.getPersona() == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Debe iniciar sesión para continuar");
                            out.print(jr.toString());
                            return;
                        }

                        int idPedidoCancel = Integer.parseInt(request.getParameter("id_pedido"));
                        String motivoCancel = request.getParameter("motivo");

                        if (motivoCancel == null || motivoCancel.trim().isEmpty()) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Debe indicar un motivo breve de la cancelación.");
                            out.print(jr.toString());
                            return;
                        }

                        Pedidos pedidoCancel = peDao.buscarPorId(idPedidoCancel);
                        if (pedidoCancel == null) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Pedido no encontrado");
                            out.print(jr.toString());
                            return;
                        }

                        if (pedidoCancel.getPersona() == null
                                || pedidoCancel.getPersona().getId_persona()
                                != userCancel.getPersona().getId_persona()) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "No tiene permisos sobre este pedido");
                            out.print(jr.toString());
                            return;
                        }

                        EstadoPedido estadoActualCancel = pedidoCancel.getEstado();
                        if (estadoActualCancel == EstadoPedido.ENVIADO) {
                            jr.addProperty("success", false);
                            jr.addProperty("message",
                                    "Su pedido ya está en camino, para cambios contacte a soporte.");
                            out.print(jr.toString());
                            return;
                        }
                        if (estadoActualCancel == EstadoPedido.ENTREGADO
                                || estadoActualCancel == EstadoPedido.CANCELADO) {
                            jr.addProperty("success", false);
                            jr.addProperty("message", "Este pedido no se puede cancelar.");
                            out.print(jr.toString());
                            return;
                        }

                        // Liberar stock de todas las prendas del pedido
                        if (pedidoCancel.getDetallepedido() != null) {
                            for (DetallePedido det : pedidoCancel.getDetallepedido()) {
                                Inventario invLib = iDao.buscarPorId(
                                        det.getInventario().getId_inventario());
                                if (invLib != null) {
                                    iDao.actualizarStock(det.getInventario().getId_inventario(),
                                            invLib.getStock() + det.getCantidad());
                                }
                            }
                        }

                        peDao.cancelarPedido(idPedidoCancel, motivoCancel.trim());

                        // Si hubo pago digital previo, generar ticket de aviso para devolución
                        boolean generoTicket = false;
                        List<Pagos> pagosPedido = pagoDao.listarPorPedido(idPedidoCancel);
                        for (Pagos pg : pagosPedido) {
                            if (pg.getEstadopago() == EstadoPago.PAGADO) {
                                pagoDao.actualizarEstado(pg.getId_pago(),
                                        EstadoPago.REEMBOLSO_PENDIENTE.name());
                                generoTicket = true;
                            }
                        }

                        jr.addProperty("success", true);
                        jr.addProperty("message", generoTicket
                                ? "Pedido cancelado correctamente. Se generó un ticket para la gestión de tu reembolso."
                                : "Pedido cancelado correctamente. Se notificó la cancelación.");
                        out.print(jr.toString());

                    } catch (Exception ex) {
                        jr.addProperty("success", false);
                        jr.addProperty("message", "Error al cancelar el pedido: " + ex.getMessage());
                        out.print(jr.toString());
                    }
                    break;

                default:
                    jr.addProperty("success", false);
                    jr.addProperty("message",
                            "Acción no reconocida: " + action);
                    out.print(jr.toString());
            }

        } catch (Exception e) {
            JsonObject error = new JsonObject();
            error.addProperty("success", false);
            error.addProperty("message",
                    "Error interno: " + e.getMessage());
            response.getWriter().print(error.toString());
        }

    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
