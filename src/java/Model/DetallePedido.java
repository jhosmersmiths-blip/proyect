/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Model;

/**
 *
 * @author JHOSMER
 */
public class DetallePedido {
    private int id_det_pedido;
    private Pedidos pedidos;
    private Producto producto;
    private Inventario inventario;
    private int cantidad;
    private double precio_unitario;
    private double subtotal;

    public DetallePedido() {
    }

    public DetallePedido(int id_det_pedido, Pedidos pedidos, Producto producto, Inventario inventario, int cantidad, double precio_unitario, double subtotal) {
        this.id_det_pedido = id_det_pedido;
        this.pedidos = pedidos;
        this.producto = producto;
        this.inventario = inventario;
        this.cantidad = cantidad;
        this.precio_unitario = precio_unitario;
        this.subtotal = subtotal;
    }

    public int getId_det_pedido() {
        return id_det_pedido;
    }

    public void setId_det_pedido(int id_det_pedido) {
        this.id_det_pedido = id_det_pedido;
    }

    public Pedidos getPedidos() {
        return pedidos;
    }

    public void setPedidos(Pedidos pedidos) {
        this.pedidos = pedidos;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Inventario getInventario() {
        return inventario;
    }

    public void setInventario(Inventario inventario) {
        this.inventario = inventario;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecio_unitario() {
        return precio_unitario;
    }

    public void setPrecio_unitario(double precio_unitario) {
        this.precio_unitario = precio_unitario;
    }

    public double getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }
    
    
}
