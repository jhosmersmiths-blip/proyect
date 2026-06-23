/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IInventario;
import Model.Inventario;
import Model.Producto;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */
public class InventarioDaoImpl implements IInventario {

    private Connection cn;

    @Override
    public List<Inventario> listar() {
        List<Inventario> lista = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT ID_INVENTARIO, ID_PRODUCTO, TALLA, COLOR, STOCK"
                    + " FROM INVENTARIO";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                Inventario i = new Inventario();
                i.setId_inventario(rs.getInt("ID_INVENTARIO"));
                Producto p = new Producto();
                p.setId_producto(rs.getInt("ID_PRODUCTO"));
                i.setProducto(p);
                i.setTalla(rs.getString("TALLA"));
                i.setColor(rs.getString("COLOR"));
                i.setStock(rs.getInt("STOCK"));
                lista.add(i);
            }

        } catch (Exception e) {
            System.out.println("Error al listar inventario: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo listar el inventario");
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
    public boolean insertar(Inventario i) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "INSERT INTO INVENTARIO(ID_PRODUCTO, TALLA, COLOR, STOCK)"
                    + " VALUES(?, ?, ?, ?)";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, i.getProducto().getId_producto());
            st.setString(2, i.getTalla());
            st.setString(3, i.getColor());
            st.setInt(4, i.getStock());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al insertar inventario: " + e.getMessage());
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
                }
            }
        }
        return flag;
    }

    @Override
    public boolean actualizar(Inventario i) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "UPDATE INVENTARIO SET ID_PRODUCTO = ?, TALLA = ?, COLOR = ?, STOCK = ? "
                    + "WHERE ID_INVENTARIO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, i.getProducto().getId_producto());
            st.setString(2, i.getTalla());
            st.setString(3, i.getColor());
            st.setInt(4, i.getStock());
            st.setInt(5, i.getId_inventario());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al actualizar inventario: " + e.getMessage());
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
                }
            }
        }
        return flag;

    }

    @Override
    public Inventario buscarPorId(int id) {
        Inventario i = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT * FROM INVENTARIO"
                    + " WHERE ID_INVENTARIO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            rs = st.executeQuery();

            if (rs.next()) {
                i = new Inventario();
                i.setId_inventario(rs.getInt("ID_INVENTARIO"));
                Producto p = new Producto();
                p.setId_producto(rs.getInt("ID_PRODUCTO"));
                i.setProducto(p);
                i.setTalla(rs.getString("TALLA"));
                i.setColor(rs.getString("COLOR"));
                i.setStock(rs.getInt("STOCK"));
            }

        } catch (Exception e) {
            System.out.println("Error al buscar inventario: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo buscar el inventario por ID");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return i;
    }

    @Override
    public boolean eliminar(int id) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "DELETE FROM INVENTARIO"
                    + " WHERE ID_INVENTARIO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al eliminar inventario: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se eliminó el inventario");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return flag;
    }

    @Override
    public boolean actualizarStock(int id, int stock) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "UPDATE INVENTARIO SET STOCK = ?"
                    + "WHERE ID_INVENTARIO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setString(1, String.valueOf(stock));
            st.setInt(2, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al actualizar stock: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se actualizó el stock");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return flag;
    }

}
