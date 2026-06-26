/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Model;

import java.sql.Timestamp;

/**
 *
 * @author JHOSMER
 */
public class Pagos {
    private int id_pago;
    private Pedidos pedidos;
    private String metodo_pago;
    private EstadoPago estadopago;
    private Timestamp fecha;
    private String imagen;

    public Pagos() {
    }

    public Pagos(int id_pago, Pedidos pedidos, String metodo_pago, EstadoPago estadopago, Timestamp fecha, String imagen) {
        this.id_pago = id_pago;
        this.pedidos = pedidos;
        this.metodo_pago = metodo_pago;
        this.estadopago = estadopago;
        this.fecha = fecha;
        this.imagen = imagen;
    }

    public int getId_pago() {
        return id_pago;
    }

    public void setId_pago(int id_pago) {
        this.id_pago = id_pago;
    }

    public Pedidos getPedidos() {
        return pedidos;
    }

    public void setPedidos(Pedidos pedidos) {
        this.pedidos = pedidos;
    }

    public String getMetodo_pago() {
        return metodo_pago;
    }

    public void setMetodo_pago(String metodo_pago) {
        this.metodo_pago = metodo_pago;
    }

    public EstadoPago getEstadopago() {
        return estadopago;
    }

    public void setEstadopago(EstadoPago estadopago) {
        this.estadopago = estadopago;
    }

    public Timestamp getFecha() {
        return fecha;
    }

    public void setFecha(Timestamp fecha) {
        this.fecha = fecha;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

}
