/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Model;

/**
 *
 * @author JHOSMER
 */
public class Persona {
     private int id_persona;
    private String nombre;
    private String apell_paterno;
    private String apell_materno;
    private String correo;
    private String telefono;

    public Persona() {
    }

    public Persona(int id_persona, String nombre, String apell_paterno, String apell_materno, String correo, String telefono) {
        this.id_persona = id_persona;
        this.nombre = nombre;
        this.apell_paterno = apell_paterno;
        this.apell_materno = apell_materno;
        this.correo = correo;
        this.telefono = telefono;
    }

    public int getId_persona() {
        return id_persona;
    }

    public void setId_persona(int id_persona) {
        this.id_persona = id_persona;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApell_paterno() {
        return apell_paterno;
    }

    public void setApell_paterno(String apell_paterno) {
        this.apell_paterno = apell_paterno;
    }

    public String getApell_materno() {
        return apell_materno;
    }

    public void setApell_materno(String apell_materno) {
        this.apell_materno = apell_materno;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }
    
}
