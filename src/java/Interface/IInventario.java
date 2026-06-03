/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.Inventario;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface IInventario {

    public List<Inventario> listar();
    public boolean insertar(Inventario i);
    public boolean actualizar(Inventario i);
    public Inventario buscarPorId(int id);
    public boolean eliminar(int id);
    public boolean actualizarStock(int id, int stock);
}
