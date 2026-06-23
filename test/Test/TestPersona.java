/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Main.java to edit this template
 */
package Test;

import Dao.PersonaDaoImpl;
import Dao.UsuarioDaoImpl;
import Interface.IPersona;
import Interface.IUsuario;
import Model.Persona;
import Model.Rol;
import Model.Usuario;
import java.util.List;

public class TestPersona {

    IPersona pdao = new PersonaDaoImpl();
    IUsuario udao = new UsuarioDaoImpl();

    public static void main(String[] args) {
        TestPersona t = new TestPersona();
        t.insertar();
        //t.valid_user();
        //t.listar();
        //t.actualizar();
       //t.buscarPorid();
        //t.eliminar();
    }

    public void insertar() {
        Persona p = new Persona();

        p.setNombre("Steeward");
        p.setApell_paterno("lopez");
        p.setApell_materno("silva");
        p.setTelefono("985642312");
        p.setCorreo("steewardlopez@gmail.com");

        Usuario u = new Usuario();

        u.setContasena("admin123");
        u.setRol(Rol.CLIENTE);
        int result = pdao.insertar(p, u);
        if (result > 0) {
            System.out.println("Persona y Usuario creada");
            System.out.println("Usuario:" + p.getCorreo());
            System.out.println("Rol asignado:" + u.getRol());
        } else {
            System.out.println("No se pudo realizar el registro");
        }
    }

    public void valid_user() {
        Usuario u = udao.validate("steewardlopez@gmail.com", "admin123");
        if (u != null && u.getPersona() != null) {
            System.out.println("Bienvenido" + u.getPersona().getNombre());
            System.out.println("Rol:" + u.getRol());
            System.out.println("Usuario:" + u.getUsuario());
            System.out.println("User_id:" + u.getId_usuario());
            System.out.println("persona_id:" + u.getPersona().getId_persona());
        } else {
            System.out.println("Credenciales incorrectas");
        }
    }

    public void listar() {
        List<Persona> lista = pdao.listar();
        if (lista != null && !lista.isEmpty()) {
            for (Persona p : lista) {
                System.out.println("ID: " + p.getId_persona());
                System.out.println("Nombre: " + p.getNombre());
                System.out.println("Apell_Paterno: " + p.getApell_paterno());
                System.out.println("Apell_Materno: " + p.getApell_materno());
                System.out.println("Telefono: " + p.getTelefono());
                System.out.println("Correo: " + p.getCorreo());
            }
        } else {
            System.out.println("No hay personas registradas");
        }
    }

    public void actualizar() {
        Persona p = new Persona();
        p.setId_persona(4);
        p.setNombre("juan ");
        p.setApell_paterno("lopez");
        p.setApell_materno("silva");
        p.setTelefono("987654321");
        p.setCorreo("juansilva@gmail.com");

        boolean resultado = pdao.actualizar(p);
        if (resultado) {
            System.out.println("Persona actualizada ");;
        } else {
            System.out.println("No se pudo actualizar la persona");
        }
    }

    public void buscarPorid() {
        Persona p = pdao.buscarPorid(2);

        if (p != null) {
            System.out.println("Persona encontrada:");
            System.out.println("ID: " + p.getId_persona());
            System.out.println("Nombre: " + p.getNombre());
            System.out.println("Apell_Paterno: " + p.getApell_paterno());
            System.out.println("Apell_Materno: " + p.getApell_materno());
            System.out.println("Teléfono: " + p.getTelefono());
            System.out.println("Correo: " + p.getCorreo());
        } else {
            System.out.println("No se encontró ninguna persona con ID: ");
        }
    }

    public void eliminar() {
        Persona p = new Persona();
        p.setId_persona(4);
        boolean resultado = pdao.eliminar(4);
        if (resultado) {
            System.out.println("Persona eliminada ");
            System.out.println("ID eliminado: ");
        } else {
            System.out.println("No se pudo eliminar la persona con ID: ");
        }
    }
}
