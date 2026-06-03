/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package Interface;

import Model.Categoria;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public interface ICategoria {

    public boolean insertar(Categoria c);
    public List<Categoria> listar();
    
}
