/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.Pagos;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface IPagos {

    public int registrarPago(Pagos pago);
    public List<Pagos> listarPorPedido(int idPedido);
    public boolean actualizarEstado(int idPago, String nuevoEstado);

}
