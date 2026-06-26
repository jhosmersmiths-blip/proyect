/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package Controllers;

import Dao.PersonaDaoImpl;
import Dao.UsuarioDaoImpl;
import Interface.IPersona;
import Interface.IUsuario;
import Model.Persona;
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

/**
 *
 * @author JHOSMER
 */
@WebServlet(name = "AuthController", urlPatterns = {"/AuthController"})
public class AuthController extends HttpServlet {

    private final IUsuario uDao = new UsuarioDaoImpl();
    private final IPersona pDao = new PersonaDaoImpl();

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        try (PrintWriter out = response.getWriter()) {
            /* TODO output your page here. You may use following sample code. */
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet AuthController</title>");
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet AuthController at " + request.getContextPath() + "</h1>");
            out.println("</body>");
            out.println("</html>");
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

        String action = request.getParameter("action");

        if ("obtenerPerfil".equals(action)) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            JsonObject json = new JsonObject();
            Gson gson = new Gson();
            try (PrintWriter out = response.getWriter()) {
                HttpSession session = request.getSession(false);
                if (session == null || session.getAttribute("usuario") == null) {
                    json.addProperty("success", false);
                    json.addProperty("message", "Sesion no activa");
                } else {
                    Usuario us = (Usuario) session.getAttribute("usuario");
                    json.addProperty("success", true);
                    json.add("persona", gson.toJsonTree(us.getPersona()));
                    json.addProperty("rol", us.getRol() != null ? us.getRol().toString() : "CLIENTE");
                }
                out.print(json.toString());
            }
            return;
        }

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

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        //forma de recoger datos de la vista
        String action = request.getParameter("action");

        JsonObject jsonResponse = new JsonObject();

        Gson gson = new Gson();
        try (PrintWriter out = response.getWriter()) {
            if ("validar".equals(action)) {
                String user = request.getParameter("usuario");
                String pasw = request.getParameter("contrasena");
                //variable local
                Usuario us = uDao.validate(user, pasw);

                if (us != null && us.getUsuario() != null) {
                    HttpSession sesion = request.getSession(true);
                    sesion.setAttribute("usuario", us);

                    jsonResponse.addProperty("success", true);
                    jsonResponse.addProperty("message", "inicio de sesion exitoso");
                    jsonResponse.add("userData", gson.toJsonTree(us));
                } else {
                    jsonResponse.addProperty("success", false);
                    jsonResponse.addProperty("message", "Usuario o contrasena incorrecta");
                }
                out.print(jsonResponse.toString());
            } else if (action.equals("register")) {
                Persona p = new Persona();
                Usuario u = new Usuario();

                p.setNombre(request.getParameter("nombre"));
                p.setApell_paterno(request.getParameter("Apell_Paterno"));
                p.setApell_materno(request.getParameter("Apell_Materno"));
                p.setTelefono(request.getParameter("telefono"));
                p.setCorreo(request.getParameter("correo"));
                u.setContasena(request.getParameter("contrasena"));

                int resultado = pDao.insertar(p, u);

                jsonResponse.addProperty("success", resultado != 0);
                jsonResponse.addProperty("message", resultado != 0 ? "Registro success" : "error de registro");
                out.print(jsonResponse.toString());

            } else if (action.equals("Salir")) {
                HttpSession session = request.getSession();
                if (session != null) {
                    session.invalidate();
                }
                jsonResponse.addProperty("success", true);
                jsonResponse.addProperty("message", "Sesion cerrada");
                out.print(jsonResponse.toString());

            }

        } catch (Exception e) {
            response.setStatus(500);
            jsonResponse.addProperty("success", false);
            jsonResponse.addProperty("message", "Error" + e.getMessage());
            response.getWriter().print(jsonResponse.toString());
        }
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
