/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IPedido;
import Model.DetallePedido;
import Model.EstadoPedido;
import Model.Pedidos;
import Util.ConexionSingleton;
import java.sql.*;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class PedidoDaoImpl implements IPedido {

    private Connection cn;

    @Override
    public int generarPedido(Pedidos pedidos) {
        int id_pedido = 0;
        int r = 0;
        PreparedStatement st;
        String query;
        ResultSet rs;

        try {
            cn = ConexionSingleton.getConnection();
            cn.setAutoCommit(false);

            query = "INSERT INTO PEDIDOS(ID_DIRECCION, ID_PERSONA, FECHA, ESTADO, TOTAL)"
                    + " VALUES(?, ?, ?, ?, ?)";
            st = cn.prepareStatement(query, new String[]{"ID_PEDIDO"});
            st.setInt(1, pedidos.getDireccion().getId_direccion());
            st.setInt(2, pedidos.getPersona().getId_persona());
            st.setTimestamp(3, pedidos.getFecha());
            st.setString(4, EstadoPedido.PENDIENTE.name());
            st.setDouble(5, pedidos.getTotal());

            r = st.executeUpdate();

            if (r != 0) {
                rs = st.getGeneratedKeys();
                if (rs.next()) {
                    id_pedido = rs.getInt(1);
                }
                System.out.println("Pedido generado con ID: " + id_pedido);
            }

            if (id_pedido > 0 && pedidos.getDetallepedido() != null) {
                query = "INSERT INTO DETALLE_PEDIDO(ID_PEDIDO, ID_PRODUCTO, ID_INVENTARIO, "
                        + "CANTIDAD, PRECIO_UNITARIO, SUBTOTAL) "
                        + "VALUES(?, ?, ?, ?, ?, ?)";
                st = cn.prepareStatement(query);

                for (DetallePedido detalle : pedidos.getDetallepedido()) {
                    st.setInt(1, id_pedido);
                    st.setInt(2, detalle.getProducto().getId_producto());
                    st.setInt(3, detalle.getInventario().getId_inventario());
                    st.setInt(4, detalle.getCantidad());
                    st.setDouble(5, detalle.getPrecio_unitario());
                    st.setDouble(6, detalle.getSubtotal());
                    st.addBatch();
                }
                st.executeBatch();
                System.out.println("Pedido y detalles guardados.");
            } else {
                System.out.println("Error: no se pudo obtener el ID del pedido.");
                r = 0;
            }

            cn.commit();

        } catch (Exception e) {
            System.out.println("Error al generar pedido: " + e.getMessage());
            try {
                cn.rollback();
                r = 0;
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
        } finally {
            if (cn != null) {
                try {
                    cn.setAutoCommit(true);
                } catch (Exception e) {
                    System.out.println("Error al restaurar autocommit: " + e.getMessage());
                }
            }
        }
        return r;
    }

    @Override
    public List<Pedidos> listarPorPersona(int idPersona) {
        List<Pedidos> lista = new java.util.ArrayList<>();
        try {
            cn = ConexionSingleton.getConnection();
            // Traer pedidos de la persona
            String q = "SELECT p.ID_PEDIDO, p.FECHA, p.ESTADO, p.TOTAL, "
                    + "d.ID_DIRECCION, d.CIUDAD, d.CALLE "
                    + "FROM PEDIDOS p "
                    + "LEFT JOIN DIRECCION d ON p.ID_DIRECCION = d.ID_DIRECCION "
                    + "WHERE p.ID_PERSONA = ? ORDER BY p.FECHA DESC";
            PreparedStatement st = cn.prepareStatement(q);
            st.setInt(1, idPersona);
            ResultSet rs = st.executeQuery();
            while (rs.next()) {
                Pedidos ped = new Pedidos();
                ped.setId_pedido(rs.getInt("ID_PEDIDO"));
                ped.setFecha(rs.getTimestamp("FECHA"));
                String estadoStr = rs.getString("ESTADO");
                if (estadoStr != null) {
                    try {
                        ped.setEstado(EstadoPedido.valueOf(estadoStr));
                    } catch (Exception ex) {
                    }
                }
                ped.setTotal(rs.getDouble("TOTAL"));
                Model.Direccion dir = new Model.Direccion();
                dir.setId_direccion(rs.getInt("ID_DIRECCION"));
                dir.setCiudad(rs.getString("CIUDAD"));
                dir.setCalle(rs.getString("CALLE"));
                ped.setDireccion(dir);
                // Cargar detalles de este pedido
                ped.setDetallepedido(cargarDetalles(ped.getId_pedido()));

                lista.add(ped);
            }
        } catch (Exception e) {
            System.out.println("Error listarPorPersona: " + e.getMessage());
        }
        return lista;
    }

    @Override
    public Pedidos buscarPorId(int idPedido) {
        try {
            cn = ConexionSingleton.getConnection();
            String q = "SELECT p.ID_PEDIDO, p.FECHA, p.ESTADO, p.TOTAL, "
                     + "d.ID_DIRECCION, d.CIUDAD, d.CALLE "
                     + "FROM PEDIDOS p "
                     + "LEFT JOIN DIRECCION d ON p.ID_DIRECCION = d.ID_DIRECCION "
                     + "WHERE p.ID_PEDIDO = ?";
            PreparedStatement st = cn.prepareStatement(q);
            st.setInt(1, idPedido);
            ResultSet rs = st.executeQuery();
            if (rs.next()) {
                Pedidos ped = new Pedidos();
                ped.setId_pedido(rs.getInt("ID_PEDIDO"));
                ped.setFecha(rs.getTimestamp("FECHA"));
                String estadoStr = rs.getString("ESTADO");
                if (estadoStr != null) {
                    try { ped.setEstado(EstadoPedido.valueOf(estadoStr)); } catch (Exception ex) {}
                }
                ped.setTotal(rs.getDouble("TOTAL"));
                Model.Direccion dir = new Model.Direccion();
                dir.setId_direccion(rs.getInt("ID_DIRECCION"));
                dir.setCiudad(rs.getString("CIUDAD"));
                dir.setCalle(rs.getString("CALLE"));
                ped.setDireccion(dir);
                ped.setDetallepedido(cargarDetalles(idPedido));
                return ped;
            }
        } catch (Exception e) {
            System.out.println("Error buscarPorId: " + e.getMessage());
        }
        return null;    }

    private java.util.List<DetallePedido> cargarDetalles(int idPedido) {
        java.util.List<DetallePedido> detalles = new java.util.ArrayList<>();
        try {
            String q = "SELECT dp.ID_DET_PEDIDO, dp.CANTIDAD, dp.PRECIO_UNITARIO, dp.SUBTOTAL, "
                    + "pr.ID_PRODUCTO, pr.NOMBRE AS NOM_PROD, "
                    + "inv.ID_INVENTARIO, inv.TALLA, inv.COLOR "
                    + "FROM DETALLE_PEDIDO dp "
                    + "JOIN PRODUCTO pr ON dp.ID_PRODUCTO = pr.ID_PRODUCTO "
                    + "LEFT JOIN INVENTARIO inv ON dp.ID_INVENTARIO = inv.ID_INVENTARIO "
                    + "WHERE dp.ID_PEDIDO = ?";
            PreparedStatement st = cn.prepareStatement(q);
            st.setInt(1, idPedido);
            ResultSet rs = st.executeQuery();
            while (rs.next()) {
                DetallePedido det = new DetallePedido();
                det.setId_det_pedido(rs.getInt("ID_DET_PEDIDO"));
                det.setCantidad(rs.getInt("CANTIDAD"));
                det.setPrecio_unitario(rs.getDouble("PRECIO_UNITARIO"));
                det.setSubtotal(rs.getDouble("SUBTOTAL"));
                Model.Producto prod = new Model.Producto();
                prod.setId_producto(rs.getInt("ID_PRODUCTO"));
                prod.setNombre(rs.getString("NOM_PROD"));
                det.setProducto(prod);
                Model.Inventario inv = new Model.Inventario();
                inv.setId_inventario(rs.getInt("ID_INVENTARIO"));
                inv.setTalla(rs.getString("TALLA"));
                inv.setColor(rs.getString("COLOR"));
                det.setInventario(inv);
                detalles.add(det);
            }
        } catch (Exception e) {
            System.out.println("Error cargarDetalles: " + e.getMessage());
        }
        return detalles;
    }
}
