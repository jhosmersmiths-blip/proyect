/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.DireccionDaoImpl;
import Interface.IDireccion;
import Model.Direccion;
import Model.Persona;
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
@WebServlet(name = "DireccionController", urlPatterns = {"/DireccionController"})
public class DireccionController extends HttpServlet {
    private final IDireccion dDao = new DireccionDaoImpl();
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
                    guardarDireccion(request, response);
                    break;
                case "eliminar":
                    eliminarDireccion(request, response);
                    break;
                case "buscar":
                    buscarDireccion(request, response);
                    break;
                default:
                    listarDirecciones(request, response);
                    break;
            }
    }
        private void listarDirecciones(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
            List<Direccion> direcciones = dDao.listar();
        response.getWriter().print(gson.toJson(direcciones));
    }

    private void guardarDireccion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        Direccion d = new Direccion();
        Persona p = new Persona();
        p.setId_persona(Integer.parseInt(request.getParameter("id_persona")));
        d.setPersona(p);
        d.setCiudad(request.getParameter("ciudad"));
        d.setCalle(request.getParameter("calle"));
        d.setEs_principal(Boolean.parseBoolean(request.getParameter("es_principal")));

        boolean resultado = dDao.insertar(d);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Direccion guardada correctamente" :
                "Error al guardar la direccion");
        response.getWriter().print(jsonResponse.toString());
    }

    private void eliminarDireccion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_direccion"));
        boolean resultado = dDao.eliminar(id);

        jsonResponse.addProperty("success", resultado);
        jsonResponse.addProperty("message", resultado ? "Direccion eliminada" :
                "Error al eliminar la direccion");
        response.getWriter().print(jsonResponse.toString());
    }

    private void buscarDireccion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        JsonObject jsonResponse = new JsonObject();

        int id = Integer.parseInt(request.getParameter("id_direccion"));
        Direccion d = dDao.buscarPorId(id);

        if (d != null) {
            jsonResponse.addProperty("success", true);
            jsonResponse.add("direccion", gson.toJsonTree(d));
        } else {
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Direccion no encontrada");
        }
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
