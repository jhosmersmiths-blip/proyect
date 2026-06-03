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
            st = cn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS);
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
                System.out.println("Pedido generado con ID: " );
            }

            if (id_pedido > 0 && pedidos.getDetallepedido() != null) {
                query = "INSERT INTO DETALLE_PEDIDO(ID_PEDIDOS, ID_PRODUCTO, ID_INVENTARIO, CANTIDAD, PRECIO_UNITARIO, SUBTOTAL) "
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
                System.out.println("Pedido y detalles guardados .");
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
                    System.out.println("Error al restaurar : " + e.getMessage());
                }
            }
        }
        return r;
    }

}
