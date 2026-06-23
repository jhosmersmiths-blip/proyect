/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.InventarioDaoImpl;
import Interface.IInventario;
import Model.Inventario;
import Model.Producto;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
@MultipartConfig
@WebServlet(name = "InventarioController", urlPatterns = {"/InventarioController"})
public class InventarioController extends HttpServlet {

    private final IInventario iDao = new InventarioDaoImpl();
    private final Gson gson = new Gson();

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");

        if (action == null) {
            action = "listar";
        }
        switch (action) {
            case "guardar":
                guardarInventario(request, response);
                break;
            case "editar":
                editarInventario(request, response);
                break;
            case "eliminar":
                eliminarInventario(request, response);
                break;
            case "buscar":
                buscarInventario(request, response);
                break;
            case "actualizarStock":
                actualizarStock(request, response);
                break;
            default:
                listarInventario(request, response);
                break;
        }
    }

    private void listarInventario(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        List<Inventario> inventarios = iDao.listar();
        response.getWriter().print(gson.toJson(inventarios));
    }

    private void guardarInventario(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        Inventario i = new Inventario();
        Producto p = new Producto();
        p.setId_producto(Integer.parseInt(request.getParameter("id_producto")));
        i.setProducto(p);
        i.setTalla(request.getParameter("talla"));
        i.setColor(request.getParameter("color"));
        i.setStock(Integer.parseInt(request.getParameter("stock")));

        boolean resultado = iDao.insertar(i);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Inventario guardado correctamente" :
                "Error al guardar el inventario");
        response.getWriter().print(jsonResponse.toString());
    }

    private void editarInventario(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        Inventario i = new Inventario();
        i.setId_inventario(Integer.parseInt(request.getParameter("id_inventario")));
        Producto p = new Producto();
        p.setId_producto(Integer.parseInt(request.getParameter("id_producto")));
        i.setProducto(p);
        i.setTalla(request.getParameter("talla"));
        i.setColor(request.getParameter("color"));
        i.setStock(Integer.parseInt(request.getParameter("stock")));
        boolean resultado = iDao.actualizar(i);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Inventario actualizado" :
                "Error al actualizar el inventario");
        response.getWriter().print(jsonResponse.toString());
    }

    private void eliminarInventario(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_inventario"));
        boolean resultado = iDao.eliminar(id);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Inventario eliminado" :
                "Error al eliminar el inventario");
        response.getWriter().print(jsonResponse.toString());
    }

    private void buscarInventario(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_inventario"));
        Inventario i = iDao.buscarPorId(id);

        if (i != null) {
            jsonResponse.addProperty("success", true);
            jsonResponse.add("inventario", gson.toJsonTree(i));
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Inventario no encontrado");
        }
        response.getWriter().print(jsonResponse.toString());
    }

    private void actualizarStock(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_inventario"));
        int stock = Integer.parseInt(request.getParameter("stock"));

        boolean resultado = iDao.actualizarStock(id, stock);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Stock actualizado" : 
                "Error al actualizar el stock");
        response.getWriter().print(jsonResponse.toString());
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
