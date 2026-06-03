/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Model;

import java.sql.Timestamp;
import java.util.List;



/**
 *
 * @author JHOSMER
 */
public class Pedidos {
        private int id_pedido;
    private Persona persona;
    private Direccion direccion;
    private Timestamp fecha;
    private EstadoPedido estado;
    private double total;
    private List<DetallePedido> detallepedido;

    public Pedidos() {
    }

    public Pedidos(int id_pedido, Persona persona, Direccion direccion, Timestamp fecha, EstadoPedido estado, double total, List<DetallePedido> detallepedido) {
        this.id_pedido = id_pedido;
        this.persona = persona;
        this.direccion = direccion;
        this.fecha = fecha;
        this.estado = estado;
        this.total = total;
        this.detallepedido = detallepedido;
    }

    public int getId_pedido() {
        return id_pedido;
    }

    public void setId_pedido(int id_pedido) {
        this.id_pedido = id_pedido;
    }

    public Persona getPersona() {
        return persona;
    }

    public void setPersona(Persona persona) {
        this.persona = persona;
    }

    public Direccion getDireccion() {
        return direccion;
    }

    public void setDireccion(Direccion direccion) {
        this.direccion = direccion;
    }

    public Timestamp getFecha() {
        return fecha;
    }

    public void setFecha(Timestamp fecha) {
        this.fecha = fecha;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public List<DetallePedido> getDetallepedido() {
        return detallepedido;
    }

    public void setDetallepedido(List<DetallePedido> detallepedido) {
        this.detallepedido = detallepedido;
    }

    
}
