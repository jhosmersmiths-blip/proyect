/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.DireccionDaoImpl;
import Interface.IDireccion;
import Model.Direccion;
import Model.Persona;
import java.util.List;

/**
 *
 * @author JHOSMER
 */
public class TestDireccion {

    IDireccion dao = new DireccionDaoImpl();

    public static void main(String[] args) {
        TestDireccion t = new TestDireccion();
        t.insertar();
        //t.listar();
        //t.buscarPorId();
        //t.eliminar();
    }
       public void insertar() {
           Direccion d = new Direccion();
           Persona p = new Persona();
           
        p.setId_persona(3);          
        d.setPersona(p);
        d.setCiudad("Lima");
        d.setCalle("Av. Los Pinos 123");
        d.setEs_principal(true);

        boolean resultado = dao.insertar(d);
        if (resultado) {
            System.out.println("Direccion insertada");
        } else {
            System.out.println("No se pudo insertar la dirección");
        }
    }
    public void listar() {
        List<Direccion> lista = dao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (Direccion d : lista) {
                System.out.println("ID Direccion: " + d.getId_direccion());
                System.out.println("ID Persona: " + d.getPersona().getId_persona());
                System.out.println("Ciudad: " + d.getCiudad());
                System.out.println("Calle: " + d.getCalle());
                System.out.println("Es principal: " + d.isEs_principal());
            }
        } else {
            System.out.println("No hay direcciones registradas");
        }
    }
        public void buscarPorId() {
        int idBuscar = 1;          
        Direccion d = dao.buscarPorId(idBuscar);

        if (d != null) {
            System.out.println("Direccion encontrada:");
            System.out.println("ID Direccion: " + d.getId_direccion());
            System.out.println("ID Persona: " + d.getPersona().getId_persona());
            System.out.println("Ciudad: " + d.getCiudad());
            System.out.println("Calle: " + d.getCalle());
            System.out.println("Es principal: " + d.isEs_principal());
        } else {
            System.out.println("No se encontró dirección con ID: ");
        }
    }
    public void eliminar() {

        boolean resultado = dao.eliminar(1);
        if (resultado) {
            System.out.println("Dirección eliminada ");
        } else {
            System.out.println("No se pudo eliminar la dirección con ID: ");
        }
    }

}
