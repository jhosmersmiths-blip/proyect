/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.ProductoDaoImpl;
import Interface.IProducto;
import Model.Categoria;
import Model.Producto;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
@WebServlet(name = "ProductoController", urlPatterns = {"/ProductoController"})
public class ProductoController extends HttpServlet {

    private final IProducto pDao = new ProductoDaoImpl();
    private final Gson gson = new Gson();
     
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
    
         response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        
        if (action == null ) {
            action = "listar";
        }
        
        switch (action) {
            case "guardar":
                guardarProductos(request,response);
                break;
            case "editar":
                editarProductos(request,response);
                break;
            case "eliminar":
                eliminarProductos(request,response);
                break;
            case "buscar":
                buscarProductos(request,response);
                break;
            default:
                listarProductos(request,response);
                break;
        }
    }
   private void listarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        List<Producto> productos = pDao.listar();
        response.getWriter().print(gson.toJson(productos));
        
        
    }
    private void guardarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        Producto p = new Producto();
        Categoria cat = new Categoria();
        cat.setId_categoria(Integer.parseInt(request.getParameter("id_categoria")));
        p.setCategoria(cat);
        p.setNombre(request.getParameter("nombre"));
        p.setDescripcion(request.getParameter("descripcion"));
        p.setPrecio(Double.parseDouble(request.getParameter("precio")));

        boolean resultado = pDao.insertar(p);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Producto guardado correctamente" : "Error al guardar el producto");
        response.getWriter().print(jsonResponse.toString());
        
    }
               
    private void editarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
       JsonObject jsonResponse = new JsonObject();

        Producto p = new Producto();
        p.setId_producto(Integer.parseInt(request.getParameter("id_producto")));
        Categoria cat = new Categoria();
        cat.setId_categoria(Integer.parseInt(request.getParameter("id_categoria")));
        p.setCategoria(cat);
        p.setNombre(request.getParameter("nombre"));
        p.setDescripcion(request.getParameter("descripcion"));
        p.setPrecio(Double.parseDouble(request.getParameter("precio")));

        boolean resultado = pDao.actualizar(p);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Producto actualizado correctamente" : "Error al actualizar el producto");
        response.getWriter().print(jsonResponse.toString());
        
    }
    private void eliminarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
       
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_producto"));
        boolean resultado = pDao.eliminar(id);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Producto eliminado correctamente" : "Error al eliminar el producto");
        response.getWriter().print(jsonResponse.toString());
    }
    private void buscarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_producto"));
        Producto p = pDao.buscarPorId(id);

        if (p != null) {
            jsonResponse.addProperty("success", true);
            jsonResponse.add("producto", gson.toJsonTree(p));
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Producto no encontrado");
        }
        response.getWriter().print(jsonResponse.toString());
        
    }
   
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
