/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Model;

/**
 *
 * @author JHOSMER
 */
public class Direccion {
    private int id_direccion;
    private Persona persona;
    private String ciudad;
    private String calle;
    private boolean es_principal;

    public Direccion() {
    }

    public Direccion(int id_direccion, Persona persona, String ciudad, String calle, boolean es_principal) {
        this.id_direccion = id_direccion;
        this.persona = persona;
        this.ciudad = ciudad;
        this.calle = calle;
        this.es_principal = es_principal;
    }

    public int getId_direccion() {
        return id_direccion;
    }

    public void setId_direccion(int id_direccion) {
        this.id_direccion = id_direccion;
    }

    public Persona getPersona() {
        return persona;
    }

    public void setPersona(Persona persona) {
        this.persona = persona;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getCalle() {
        return calle;
    }

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public boolean isEs_principal() {
        return es_principal;
    }

    public void setEs_principal(boolean es_principal) {
        this.es_principal = es_principal;
    }
    
}
