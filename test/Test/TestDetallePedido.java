/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.DetallePedidoDaoImpl;
import Interface.IDetallePedido;
import Model.DetallePedido;
import Model.Inventario;
import Model.Pedidos;
import Model.Producto;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestDetallePedido {

    IDetallePedido dao = new DetallePedidoDaoImpl();

    public static void main(String[] args) {
        TestDetallePedido t = new TestDetallePedido();
        //t.insertar();
        t.listar();
        //t.actualizar();
        //t.buscarPorId();
        //t.eliminar();
    }

    public void insertar() {
        DetallePedido d = new DetallePedido();

        Pedidos p = new Pedidos();
        p.setId_pedido(1);
        d.setPedidos(p);
        Producto pr = new Producto();
        pr.setId_producto(1);
        d.setProducto(pr);
        Inventario inv = new Inventario();
        inv.setId_inventario(1);
        d.setInventario(inv);
        d.setCantidad(2);
        d.setPrecio_unitario(35.90);
        d.setSubtotal(71.80);

        boolean resultado = dao.insertar(d);
        if (resultado) {
            System.out.println("DetallePedido insertado ");
        } else {
            System.out.println("No se pudo insertar el detalle del pedido");
        }
    }

    public void listar() {
        List<DetallePedido> lista = dao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (DetallePedido d : lista) {
                System.out.println("ID Detalle: " + d.getId_det_pedido());
                System.out.println("ID Pedido: " + d.getPedidos().getId_pedido());
                System.out.println("ID Producto: " + d.getProducto().getId_producto());
                System.out.println("ID Inventario: " + d.getInventario().getId_inventario());
                System.out.println("Cantidad: " + d.getCantidad());
                System.out.println("Precio unitario: " + d.getPrecio_unitario());
                System.out.println("Subtotal: " + d.getSubtotal());
            }
        } else {
            System.out.println("No hay detalles de pedido registrados");
        }
    }

    public void actualizar() {
        DetallePedido d = new DetallePedido();
        d.setId_det_pedido(1);
        Pedidos p = new Pedidos();
        p.setId_pedido(1);
        d.setPedidos(p);
        Producto pr = new Producto();
        pr.setId_producto(1);
        d.setProducto(pr);
        Inventario inv = new Inventario();
        inv.setId_inventario(1);
        d.setInventario(inv);
        d.setCantidad(3);
        d.setPrecio_unitario(35.90);
        d.setSubtotal(107.70);

        boolean resultado = dao.actualizar(d);
        if (resultado) {
            System.out.println("DetallePedido actualizado correctamente");
            System.out.println("Nueva cantidad: " + d.getCantidad());
            System.out.println("Nuevo subtotal: " + d.getSubtotal());
        } else {
            System.out.println("No se pudo actualizar el detalle del pedido");
        }
    }

    public void buscarPorId() {
        int idBuscar = 1;          
        DetallePedido d = dao.buscarPorId(idBuscar);

        if (d != null) {
            System.out.println("Detalle encontrado:");
            System.out.println("ID Detalle: " + d.getId_det_pedido());
            System.out.println("ID Pedido: " + d.getPedidos().getId_pedido());
            System.out.println("ID Producto: " + d.getProducto().getId_producto());
            System.out.println("ID Inventario: " + d.getInventario().getId_inventario());
            System.out.println("Cantidad: " + d.getCantidad());
            System.out.println("Precio unitario: " + d.getPrecio_unitario());
            System.out.println("Subtotal: " + d.getSubtotal());
        } else {
            System.out.println("No se encontró detalle con ID: ");
        }
    }

    public void eliminar() {
        boolean resultado = dao.eliminar(1);
        if (resultado) {
            System.out.println("DetallePedido eliminado");
        } else {
            System.out.println("No se pudo eliminar el detalle con ID: ");
        }
    }

}
