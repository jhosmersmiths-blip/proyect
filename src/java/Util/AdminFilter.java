/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Util;

import Model.Rol;
import Model.Usuario;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

/**
 *
 * @author JHOSMER
 */
@WebFilter(urlPatterns = {"/admin_productos.html","/admin_dashboard.html","/admin_pedidos.html"})
public class AdminFilter implements Filter{

    @Override
    public void doFilter(ServletRequest sr, ServletResponse sr1, FilterChain fc) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) sr;
        HttpServletResponse res = (HttpServletResponse) sr1;
        HttpSession session = req.getSession(false);
          Usuario user = (session != null) ? (Usuario) session.getAttribute("usuario") : null;
        String url = req.getRequestURI();

        // REGLA 1: Para entrar al Panel de Administración o usar su Controlador
        if (url.contains("admin_productos.html") || url.contains("ProductoController")) {
            if (user != null && user.getRol() == Rol.ADMIN) {
                fc.doFilter(sr, sr1); // Pasa
            } else {
                res.sendRedirect("index.html"); // Rebota
            }
        }
        if (url.contains("admin_dashboard.html") || url.contains("AppController")) {
            if (user != null && user.getRol() == Rol.ADMIN) {
                fc.doFilter(sr, sr1); // Pasa
            } else {
                res.sendRedirect("index.html"); // Rebota
            }
        }
        if (url.contains("admin_pedidos.html") || url.contains("AppController")) {
            if (user != null && user.getRol() == Rol.ADMIN) {
                fc.doFilter(sr, sr1); // Pasa
            } else {
                res.sendRedirect("index.html"); // Rebota
            }
        }
    }
    
    }
    