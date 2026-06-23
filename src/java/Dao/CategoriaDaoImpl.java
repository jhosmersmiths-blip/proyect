/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.ICategoria;
import Model.Categoria;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */
public class CategoriaDaoImpl implements ICategoria {

    private Connection cn;

    @Override
    public boolean insertar(Categoria c) {
        boolean flag = false;
        PreparedStatement st;
        String query = null;
 
        try {
            query = "INSERT INTO CATEGORIA(NOMBRE, DESCRIPCION)"
                    + " VALUES(?, ?)";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setString(1, c.getNombre());
            st.setString(2, c.getDescripcion());
            st.executeUpdate();
            flag = true;
 
        } catch (Exception e) {
            System.out.println("Error al insertar categoria: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                    System.out.println("Error al cerrar la conexion: " + e.getMessage());
                }
            }
        }
        return flag;
    }

    @Override
    public List<Categoria> listar() {
        List<Categoria> lista = null;
        Categoria c;
        PreparedStatement st;
        ResultSet rs;
        String query = null;

        try {
            query = "SELECT ID_CATEGORIA, NOMBRE, DESCRIPCION FROM CATEGORIA";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                c = new Categoria();
                c.setId_categoria(rs.getInt("ID_CATEGORIA"));
                c.setNombre(rs.getString("NOMBRE"));
                c.setDescripcion(rs.getString("DESCRIPCION"));
                lista.add(c);
            }

        } catch (Exception e) {
            System.out.println("Error al listar categorias: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo listar las categorias");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return lista;
    }

}
