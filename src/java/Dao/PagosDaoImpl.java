/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IPagos;
import Model.EstadoPago;
import Model.Pagos;
import Model.Pedidos;
import Util.ConexionSingleton;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class PagosDaoImpl implements IPagos {

    private Connection cn;

    @Override
    public int registrarPago(Pagos pago) {
        int r = 0;
        try {
            cn = ConexionSingleton.getConnection();

            PreparedStatement stId = cn.prepareStatement(
                    "SELECT NVL(MAX(ID_PAGO), 0) + 1 FROM PAGOS");
            ResultSet rs = stId.executeQuery();
            int nuevoId = 1;
            if (rs.next()) {
                nuevoId = rs.getInt(1);
            }

            String query = "INSERT INTO PAGOS(ID_PAGO, ID_PEDIDO, METODO_PAGO, MONTO, FECHA, ESTADO, IMAGEN) "
                    + "VALUES(?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement st = cn.prepareStatement(query);
            st.setInt(1, nuevoId);
            st.setInt(2, pago.getPedidos().getId_pedido());
            st.setString(3, pago.getMetodo_pago());
            st.setDouble(4, pago.getPedidos().getTotal());
            st.setTimestamp(5, pago.getFecha());
            st.setString(6, pago.getEstadopago().name());
            st.setString(7, pago.getImagen());

            r = st.executeUpdate();
            System.out.println("Pago #" + nuevoId + " registrado para pedido ID: " + pago.getPedidos().getId_pedido());

        } catch (Exception e) {
            System.out.println("Error al registrar pago: " + e.getMessage());
            e.printStackTrace();
        }
        return r;
    }

    @Override
    public List<Pagos> listarPorPedido(int idPedido) {
        List<Pagos> lista = new ArrayList<>();
        try {
            cn = ConexionSingleton.getConnection();
            String query = "SELECT ID_PAGO, ID_PEDIDO, METODO_PAGO, MONTO, FECHA, ESTADO, IMAGEN "
                    + "FROM PAGOS WHERE ID_PEDIDO = ?";
            PreparedStatement st = cn.prepareStatement(query);
            st.setInt(1, idPedido);
            ResultSet rs = st.executeQuery();
            while (rs.next()) {
                Pagos p = new Pagos();
                p.setId_pago(rs.getInt("ID_PAGO"));
                p.setMetodo_pago(rs.getString("METODO_PAGO"));
                p.setFecha(rs.getTimestamp("FECHA"));
                String estadoStr = rs.getString("ESTADO");
                if (estadoStr != null) {
                    try {
                        p.setEstadopago(EstadoPago.valueOf(estadoStr));
                    } catch (Exception ex) {
                    }
                }
                p.setImagen(rs.getString("IMAGEN"));
                Pedidos ped = new Pedidos();
                ped.setId_pedido(rs.getInt("ID_PEDIDO"));
                ped.setTotal(rs.getDouble("MONTO"));
                p.setPedidos(ped);
                lista.add(p);
            }
        } catch (Exception e) {
            System.out.println("Error al listar pagos: " + e.getMessage());
        }
        return lista;
    }

    @Override
    public boolean actualizarEstado(int idPago, String nuevoEstado) {
        try {
            cn = ConexionSingleton.getConnection();
            String query = "UPDATE PAGOS SET ESTADO = ? WHERE ID_PAGO = ?";
            PreparedStatement st = cn.prepareStatement(query);
            st.setString(1, nuevoEstado);
            st.setInt(2, idPago);
            return st.executeUpdate() > 0;
        } catch (Exception e) {
            System.out.println("Error al actualizar estado de pago: " + e.getMessage());
            return false;
        }
    }

}
