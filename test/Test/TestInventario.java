/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.InventarioDaoImpl;
import Interface.IInventario;
import Model.Inventario;
import Model.Producto;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestInventario {

    IInventario dao = new InventarioDaoImpl();

    public static void main(String[] args) {
        TestInventario t = new TestInventario();
        t.insertar();
    }

    public void insertar() {
        
        Inventario i = new Inventario();
        Producto p = new Producto();
        p.setId_producto(1);
        i.setProducto(p);
        i.setTalla("M");
        i.setColor("Azul");
        i.setStock("50");

        boolean resultado = dao.insertar(i);
        if (resultado) {
            System.out.println("Inventario insertado");
        } else {
            System.out.println("No se pudo insertar el inventario");
        }
    }

    public void listar() {
        List<Inventario> lista = dao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (Inventario i : lista) {
                System.out.println("ID Inventario: " + i.getId_inventario());
                System.out.println("ID Producto: " + i.getProducto().getId_producto());
                System.out.println("Talla: " + i.getTalla());
                System.out.println("Color: " + i.getColor());
                System.out.println("Stock: " + i.getStock());
            }
        } else {
            System.out.println("No hay inventario registrado");
        }
    }

    public void actualizar() {
        Inventario i = new Inventario();
        i.setId_inventario(1);       
        Producto p = new Producto();
        p.setId_producto(1);
        i.setProducto(p);
        i.setTalla("L");
        i.setColor("Rojo");
        i.setStock("30");

        boolean resultado = dao.actualizar(i);
        if (resultado) {
            System.out.println("Inventario actualizado");
        } else {
            System.out.println("No se pudo actualizar el inventario");
        }
    }

    public void buscarPorId() {
        int idBuscar = 1;           
        Inventario i = dao.buscarPorId(idBuscar);

        if (i != null) {
            System.out.println("Inventario encontrado:");
            System.out.println("ID Inventario: " + i.getId_inventario());
            System.out.println("ID Producto: " + i.getProducto().getId_producto());
            System.out.println("Talla: " + i.getTalla());
            System.out.println("Color: " + i.getColor());
            System.out.println("Stock: " + i.getStock());
        } else {
            System.out.println("No se encontró inventario con ID: ");
        }
    }

    public void eliminar() {
        boolean resultado = dao.eliminar(1);
        if (resultado) {
            System.out.println("Inventario eliminado");
        } else {
            System.out.println("No se pudo eliminar el inventario con ID: ");
        }
    }

    public void actualizarStock() {
        int idInventario = 1;       
        int nuevoStock = 100;     

        boolean resultado = dao.actualizarStock(idInventario, nuevoStock);
        if (resultado) {
            System.out.println("Stock actualizado");
        } else {
            System.out.println("No se pudo actualizar el stock");
        }
    }
}
