/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.Pedidos;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface IPedido {
    public int generarPedido(Pedidos pedidos);
    public List<Pedidos> listarPorPersona(int idPersona);
    public Pedidos buscarPorId(int idPedido);
    public List<Pedidos> listarTodos();
    public boolean cambiarEstado(int idPedido, String nuevoEstado);
    public boolean actualizarItemDetalle(int idDetPedido, int idInventario, int cantidad, double subtotal);
    public boolean eliminarItemDetalle(int idDetPedido);
    public boolean actualizarTotal(int idPedido, double total);
    public boolean cancelarPedido(int idPedido, String motivo);
}
