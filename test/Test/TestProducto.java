/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.ProductoDaoImpl;
import Interface.IProducto;
import Model.Categoria;
import Model.Producto;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestProducto {

    public static IProducto dao = new ProductoDaoImpl();

    public static void main(String[] args) {
        TestProducto t = new TestProducto();
        //t.insertar();
        //t.listar();
        t.buscarPorId();
        //t.actualizar();
        //t.elimnar();

    }

    public static void listar() {
        List<Producto> lista = dao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (Producto p : lista) {
                System.out.println("ID: " + p.getId_producto());
                System.out.println("Categoria ID: " + p.getCategoria().getId_categoria());
                System.out.println("Nombre: " + p.getNombre());
                System.out.println("Descripcion: " + p.getDescripcion());
                System.out.println("Precio: " + p.getPrecio());
            }
        } else {
            System.out.println("No hay productos registrados");
        }
    }

    public static void insertar() {
        Producto p = new Producto();
        Categoria cat = new Categoria();
        cat.setId_categoria(2);

        p.setCategoria(cat);
        p.setNombre("Camisa");
        p.setDescripcion("Camisa de vestir");
        p.setPrecio(55.90);

        boolean resultado = dao.insertar(p);
        if (resultado) {
            System.out.println("Producto insertado ");
        } else {
            System.out.println("No se pudo insertar el producto");
        }
    }

    public static void actualizar() {
        Producto p = new Producto();
        Categoria cat = new Categoria();
        cat.setId_categoria(1);

        p.setId_producto(1);
        p.setCategoria(cat);
        p.setNombre("Polo ");
        p.setDescripcion("Polo de algodón");
        p.setPrecio(45.90);

        boolean resultado = dao.actualizar(p);
        if (resultado) {
            System.out.println("Producto actualizado ");
        } else {
            System.out.println("No se pudo actualizar el producto");
        }
    }

    public void buscarPorId() {
        int idBuscar = 1;
        Producto p = dao.buscarPorId(idBuscar);

        if (p != null) {
            System.out.println("Producto encontrado:");
            System.out.println("ID: " + p.getId_producto());
            System.out.println("Categoria ID: " + p.getCategoria().getId_categoria());
            System.out.println("Nombre: " + p.getNombre());
            System.out.println("Descripcion: " + p.getDescripcion());
            System.out.println("Precio: " + p.getPrecio());
        } else {
            System.out.println("No se encontró producto con ID: " + idBuscar);
        }
    }

    public void elimnar() {
        int idEliminar = 1;
        boolean resultado = dao.eliminar(idEliminar);
        if (resultado) {
            System.out.println("Producto eliminado");
        } else {
            System.out.println("No se pudo eliminar el producto con ID: ");
        }
    }

}
