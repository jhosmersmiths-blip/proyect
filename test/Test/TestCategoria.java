/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.CategoriaDaoImpl;
import Interface.ICategoria;
import Model.Categoria;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestCategoria {

    ICategoria cdao = new CategoriaDaoImpl();

    public static void main(String[] args) {
        TestCategoria t = new TestCategoria();
        //t.insertar();
        t.listar();
    }
  public void insertar() {
        Categoria  c = new Categoria();
        c.setNombre("calzados");
        c.setDescripcion("Zapatillas y Zapatos de vestir");

        boolean resultado = cdao.insertar(c);
        if (resultado) {
            System.out.println("Categoria insertada");
        } else {
            System.out.println("No se pudo insertar la categoria");
        }
    }

    public void listar() {
        List<Categoria> lista = cdao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (Categoria c : lista) {
                System.out.println("ID: " + c.getId_categoria());
                System.out.println("Nombre: " + c.getNombre());
                System.out.println("Descripcion: " + c.getDescripcion());
            }
        } else {
            System.out.println("No hay categorias registradas");
        }
    }
}
