/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.CategoriaDaoImpl;
import Interface.ICategoria;
import Model.Categoria;
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
@WebServlet(name = "CategoriaController", urlPatterns = {"/CategoriaController"})
public class CategoriaController extends HttpServlet {
 private final ICategoria cDao = new CategoriaDaoImpl();
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
                    guardarCategoria(request, response);
                    break;
                default:
                    listarCategorias(request, response);
                    break;
            }
    }
    private void listarCategorias(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        List<Categoria> categorias = cDao.listar();
        response.getWriter().print(gson.toJson(categorias));
    }

    private void guardarCategoria(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        Categoria c = new Categoria();
        c.setNombre(request.getParameter("nombre"));
        c.setDescripcion(request.getParameter("descripcion"));

        boolean resultado = cDao.insertar(c);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Categoria guardada correctamente" :
                "Error al guardar la categoria");
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
