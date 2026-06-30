/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IProducto;
import Model.Categoria;
import Model.Producto;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */
public class ProductoDaoImpl implements IProducto {

    private Connection cn;

    @Override
    public List<Producto> listar() {
        List<Producto> lista = null;
        Producto pr;
        PreparedStatement st;
        ResultSet rs;
        String query = null;

        try {
            query = "SELECT p.ID_PRODUCTO, p.NOMBRE, p.DESCRIPCION, p.PRECIO, p.IMAGEN, "
                  + "p.ID_CATEGORIA, c.NOMBRE AS NOM_CAT "
                  + "FROM PRODUCTO p "
                  + "LEFT JOIN CATEGORIA c ON p.ID_CATEGORIA = c.ID_CATEGORIA";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                pr = new Producto();
                pr.setId_producto(rs.getInt("ID_PRODUCTO"));

                Categoria cat = new Categoria();
                cat.setId_categoria(rs.getInt("ID_CATEGORIA"));
                cat.setNombre(rs.getString("NOMBRE"));
                pr.setCategoria(cat);

                pr.setNombre(rs.getString("NOMBRE"));
                pr.setDescripcion(rs.getString("DESCRIPCION"));
                pr.setPrecio(rs.getDouble("PRECIO"));
                pr.setImagen(rs.getString("IMAGEN"));
                lista.add(pr);
            }

        } catch (Exception e) {
            System.out.println("Error al listar: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo listar el producto");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return lista;
    }

    @Override
    public boolean insertar(Producto p) {
        boolean flag = false;
        PreparedStatement st;
        String query = null;

        try {
            query = "INSERT INTO PRODUCTO(ID_CATEGORIA, NOMBRE, DESCRIPCION, PRECIO, IMAGEN)"
                    + " VALUES(?, ?, ?, ?, ?)";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, p.getCategoria().getId_categoria());
            st.setString(2, p.getNombre());
            st.setString(3, p.getDescripcion());
            st.setDouble(4, p.getPrecio());
            st.setString(5, p.getImagen());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al agregar un producto: " + e.getMessage());
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
    public boolean actualizar(Producto p) {
        boolean flag = false;
        PreparedStatement st;
        String query = null;

        try {
            query = "UPDATE PRODUCTO SET ID_CATEGORIA = ?, NOMBRE = ?, DESCRIPCION = ?, PRECIO = ?, IMAGEN = ? "
                    + "WHERE ID_PRODUCTO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, p.getCategoria().getId_categoria());
            st.setString(2, p.getNombre());
            st.setString(3, p.getDescripcion());
            st.setDouble(4, p.getPrecio());
            st.setString(5, p.getImagen());
            st.setInt(6, p.getId_producto());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error de actualizacion: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
        } finally {
            if (cn != null) {
                try {
                    cn.close();
                } catch (Exception e) {
                    System.out.println("Error al cerrar la conexion: " + e.getMessage());
                }
            }
        }
        return flag;
    }

    @Override
    public Producto buscarPorId(int id) {
        Producto prod = null;
        PreparedStatement st;
        ResultSet rs;
        String query = null;

        try {
            query = "SELECT * FROM PRODUCTO WHERE ID_PRODUCTO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            rs = st.executeQuery();

            if (rs.next()) {
                prod = new Producto();
                prod.setId_producto(rs.getInt("ID_PRODUCTO"));
                Categoria cat = new Categoria();
                cat.setId_categoria(rs.getInt("ID_CATEGORIA"));
                prod.setCategoria(cat);
                prod.setNombre(rs.getString("NOMBRE"));
                prod.setDescripcion(rs.getString("DESCRIPCION"));
                prod.setPrecio(rs.getDouble("PRECIO"));
                prod.setImagen(rs.getString("IMAGEN"));
                
            }

        } catch (Exception e) {
            System.out.println("Error de busqueda: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo buscar por id");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                    System.out.println("Error al cerrar la conexion: " + e.getMessage());
                }
            }
        }
        return prod;
    }

    @Override
    public boolean eliminar(int id) {
        boolean flag = false;
        PreparedStatement st;
        String query = null;

        try {
            query = "DELETE FROM PRODUCTO WHERE ID_PRODUCTO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al eliminar: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se eliminó el registro");
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
}
