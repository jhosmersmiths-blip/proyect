/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.Direccion;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface IDireccion {

    public List<Direccion> listar();
    public boolean insertar(Direccion d);
    public Direccion buscarPorId(int id);
    public boolean eliminar(int id);
}
