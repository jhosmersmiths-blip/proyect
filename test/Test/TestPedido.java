/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.PedidoDaoImpl;
import Interface.IPedido;
import Model.DetallePedido;
import Model.Direccion;
import Model.Inventario;
import Model.Pedidos;
import Model.Persona;
import Model.Producto;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestPedido {

    IPedido dao = new PedidoDaoImpl();

    public static void main(String[] args) {
        TestPedido t = new TestPedido();
        t.generarPedido();
    }

    public void generarPedido() {
        Persona p = new Persona();
        p.setId_persona(2);

        Direccion dir = new Direccion();
        dir.setId_direccion(1);

        List<DetallePedido> listaDetalles = new ArrayList<>();

        DetallePedido d1 = new DetallePedido();
        Producto p1 = new Producto();
        p1.setId_producto(1);
        Inventario inv1 = new Inventario();
        inv1.setId_inventario(1);  
        d1.setProducto(p1);
        d1.setInventario(inv1);    
        d1.setCantidad(2);
        d1.setPrecio_unitario(35.90);
        d1.setSubtotal(71.80);
        listaDetalles.add(d1);

        DetallePedido d2 = new DetallePedido();
        Producto p2 = new Producto();
        p2.setId_producto(2);
        Inventario inv2 = new Inventario();
        inv2.setId_inventario(1);  
        d2.setProducto(p2);
        d2.setInventario(inv2);    
        d2.setCantidad(1);
        d2.setPrecio_unitario(90.00);
        d2.setSubtotal(90.00);
        listaDetalles.add(d2);

        double total = 71.80 + 90.00;

        Pedidos nuevoPedido = new Pedidos();
        nuevoPedido.setPersona(p);
        nuevoPedido.setDireccion(dir);
        nuevoPedido.setFecha(new Timestamp(System.currentTimeMillis()));
        nuevoPedido.setTotal(total);
        nuevoPedido.setDetallepedido(listaDetalles);

        System.out.println("Enviando pedido...");
        int result = dao.generarPedido(nuevoPedido);
        if (result > 0) {
            System.out.println("Pedido registrado.");
            System.out.println("Total: " + total);
        } else {
            System.out.println("No se pudo generar el pedido.");
        }
    }
}
