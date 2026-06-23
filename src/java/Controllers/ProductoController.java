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
import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.File;
import java.io.InputStream;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
@MultipartConfig
@WebServlet(name = "ProductoController", urlPatterns = {"/ProductoController"})
public class ProductoController extends HttpServlet {

    private final IProducto pDao = new ProductoDaoImpl();
    private final Gson gson = new Gson();
    private static final String UPLOAD_DIR = "assets/img/producto";

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
                guardarProductos(request, response);
                break;
            case "editar":
                editarProductos(request, response);
                break;
            case "eliminar":
                eliminarProductos(request, response);
                break;
            case "buscar":
                buscarProductos(request, response);
                break;
            default:
                listarProductos(request, response);
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
        try {
            Producto p = new Producto();
            Categoria cat = new Categoria();
            cat.setId_categoria(Integer.parseInt(request.getParameter("id_categoria")));
            p.setCategoria(cat);
            p.setNombre(request.getParameter("nombre"));
            p.setDescripcion(request.getParameter("descripcion"));
            p.setPrecio(Double.parseDouble(request.getParameter("precio")));
            Part part = request.getPart("imagen");

            if (part != null && part.getSize() > 0) {
                String fileName = part.getSubmittedFileName();
                //obtener ls ruta donde guardar la imgh
                String pathBuild = getServletContext().getRealPath("/")
                        + "assets/img/producto" + File.separator;
                System.out.println("Ruta Build: " + pathBuild);
                String pathSource = pathBuild.replace("build" + File.separator + "web", "web");

                if (pathSource.equals(pathBuild)) {
                    System.out.println("colocar ruta fija");
                }
                System.out.println("Ruta Source: " + pathSource);
                try {
                    new File(pathSource).mkdirs();
                    new File(pathBuild).mkdirs();

                    File fileSource = new File(pathSource + fileName);
                    try (InputStream input = part.getInputStream()) {
                        java.nio.file.Files.copy(input, fileSource.toPath(),
                                java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                    }
                    System.out.println("Guardado en Source OK");
                    
                    part.write(pathBuild + fileName);
                    System.out.println("Guardado en build OK");

                } catch (Exception e) {
                    System.err.println("Error critico"+e.getMessage());
                    e.printStackTrace();
                }
                p.setImagen("assets/img/producto/"+fileName);

            }
            boolean res = pDao.insertar(p);
            response.getWriter().print(gson.toJson(res));

        } catch (Exception e) {
             response.getWriter().print(gson.toJson(false));
        }
    }

    private void editarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        try {
            Producto p = new Producto();
            p.setNombre(request.getParameter("nombre"));
            p.setDescripcion(request.getParameter("descripcion"));
            p.setPrecio(Double.parseDouble(request.getParameter("precio")));
            p.setId_producto(Integer.parseInt(request.getParameter("id_producto")));

            Part part = request.getPart("imagen");

            if (part != null && part.getSize() > 0) {
                String fileName = part.getSubmittedFileName();
                String uploadPath = getServletContext().getRealPath("")
                        + File.separator + UPLOAD_DIR;

                part.write(uploadPath + File.separator + fileName);
                p.setImagen(UPLOAD_DIR + "/" + fileName);
            } else {
                p.setImagen(request.getParameter("imagen actual"));
            }
            boolean res = pDao.actualizar(p);
            response.getWriter().print(gson.toJson(res));

        } catch (Exception e) {
            response.getWriter().print(gson.toJson(false));
        }

    }

    private void eliminarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        int id = Integer.parseInt(request.getParameter("id"));
        boolean res = pDao.eliminar(id);
        response.getWriter().print(gson.toJson(res));
    }

    private void buscarProductos(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        int id = Integer.parseInt(request.getParameter("id"));
        Producto p = pDao.buscarPorId(id);
        response.getWriter().print(gson.toJson(p));

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
