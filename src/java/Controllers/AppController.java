/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.InventarioDaoImpl;
import Dao.PedidoDaoImpl;
import Dao.ProductoDaoImpl;
import Interface.IInventario;
import Interface.IPedido;
import Interface.IProducto;
import Model.DetallePedido;
import Model.Direccion;
import Model.Inventario;
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
    private final Gson gson = new Gson();

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

                    } else {
                        jr.addProperty("success", false);
                        jr.addProperty("message",
                                "No se pudo procesar la compra. "
                                + "Intente nuevamente.");
                    }
                    out.print(jr.toString());
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
