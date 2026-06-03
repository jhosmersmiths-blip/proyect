/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IDetallePedido;
import Model.DetallePedido;
import Model.Inventario;
import Model.Pedidos;
import Model.Producto;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */
public class DetallePedidoDaoImpl implements IDetallePedido {

    private Connection cn;

    @Override
    public List<DetallePedido> listar() {
        List<DetallePedido> lista = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT ID_DET_PEDIDO, ID_PEDIDO, ID_PRODUCTO, ID_INVENTARIO, "
                    + "CANTIDAD, PRECIO_UNITARIO, SUBTOTAL"
                    + " FROM DETALLE_PEDIDO";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                DetallePedido d = new DetallePedido();
                d.setId_det_pedido(rs.getInt("ID_DET_PEDIDO"));
                Pedidos p = new Pedidos();
                p.setId_pedido(rs.getInt("ID_PEDIDO"));
                d.setPedidos(p);
                Producto pr = new Producto();
                pr.setId_producto(rs.getInt("ID_PRODUCTO"));
                d.setProducto(pr);
                Inventario inv = new Inventario();
                inv.setId_inventario(rs.getInt("ID_INVENTARIO"));
                d.setInventario(inv);
                d.setCantidad(rs.getInt("CANTIDAD"));
                d.setPrecio_unitario(rs.getDouble("PRECIO_UNITARIO"));
                d.setSubtotal(rs.getDouble("SUBTOTAL"));
                lista.add(d);
            }

        } catch (Exception e) {
            System.out.println("Error al listar detalles: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo listar los detalles");
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
    public boolean insertar(DetallePedido d) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "INSERT INTO DETALLE_PEDIDO(ID_PEDIDO, ID_PRODUCTO, ID_INVENTARIO, "
                    + "CANTIDAD, PRECIO_UNITARIO, SUBTOTAL)"
                    + " VALUES(?, ?, ?, ?, ?, ?)";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, d.getPedidos().getId_pedido());
            st.setInt(2, d.getProducto().getId_producto());
            st.setInt(3, d.getInventario().getId_inventario());
            st.setInt(4, d.getCantidad());
            st.setDouble(5, d.getPrecio_unitario());
            st.setDouble(6, d.getSubtotal());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al insertar detalle: " + e.getMessage());
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
    public boolean actualizar(DetallePedido d) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "UPDATE DETALLE_PEDIDO SET ID_PEDIDO = ?, ID_PRODUCTO = ?, "
                    + "ID_INVENTARIO = ?, CANTIDAD = ?, PRECIO_UNITARIO = ?, SUBTOTAL = ? "
                    + "WHERE ID_DET_PEDIDO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, d.getPedidos().getId_pedido());
            st.setInt(2, d.getProducto().getId_producto());
            st.setInt(3, d.getInventario().getId_inventario());
            st.setInt(4, d.getCantidad());
            st.setDouble(5, d.getPrecio_unitario());
            st.setDouble(6, d.getSubtotal());
            st.setInt(7, d.getId_det_pedido());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al actualizar detalle: " + e.getMessage());
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
    public DetallePedido buscarPorId(int id) {
        DetallePedido d = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT * FROM DETALLE_PEDIDO "
                    + "WHERE ID_DET_PEDIDO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            rs = st.executeQuery();

            if (rs.next()) {
                d = new DetallePedido();
                d.setId_det_pedido(rs.getInt("ID_DET_PEDIDO"));

                Pedidos p = new Pedidos();
                p.setId_pedido(rs.getInt("ID_PEDIDO"));
                d.setPedidos(p);

                Producto pr = new Producto();
                pr.setId_producto(rs.getInt("ID_PRODUCTO"));
                d.setProducto(pr);

                Inventario inv = new Inventario();
                inv.setId_inventario(rs.getInt("ID_INVENTARIO"));
                d.setInventario(inv);

                d.setCantidad(rs.getInt("CANTIDAD"));
                d.setPrecio_unitario(rs.getDouble("PRECIO_UNITARIO"));
                d.setSubtotal(rs.getDouble("SUBTOTAL"));
            }

        } catch (Exception e) {
            System.out.println("Error al buscar detalle: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo buscar el detalle por ID");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return d;
    }

    @Override
    public boolean eliminar(int id) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "DELETE FROM DETALLE_PEDIDO"
                    + " WHERE ID_DET_PEDIDO = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al eliminar detalle: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se eliminó el detalle");
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
