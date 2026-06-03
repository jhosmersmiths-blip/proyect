/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.DetallePedido;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface IDetallePedido {

    public List<DetallePedido> listar();
    public boolean insertar(DetallePedido d);
    public boolean actualizar(DetallePedido d);
    public DetallePedido buscarPorId(int id);
    public boolean eliminar(int id);
}
