/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IUsuario;
import Model.Persona;
import Model.Rol;
import Model.Usuario;
import Util.ConexionSingleton;
import java.sql.*;

/**
 *
 * @author JHOSMER
 */
public class UsuarioDaoImpl implements IUsuario{
private Connection cn;
    @Override
    public Usuario validate(String usuario, String contra) {
     Usuario u = null;
        Persona p = null;

        PreparedStatement st;
        ResultSet rs;
        String query = null;
        try {
            u=new Usuario();
            p = new Persona();
            String hashedPassword = u.HasPassword(contra);
            query = " select U.ID_USUARIO, U.USUARIO, U.ROL, P.ID_PERSONA,"
                    + " P.NOMBRE"
                    + " FROM PERSONA P, USUARIO U"
                    + " where P.ID_PERSONA = U.ID_PERSONA"
                    + " AND U.USUARIO = ?"
                    + " AND U.CONTRASENA = ?";

            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setString(1, usuario);
            st.setString(2, hashedPassword);
            rs = st.executeQuery();
            while (rs.next()) {
                u = new Usuario();
                u.setId_usuario(rs.getInt("ID_USUARIO"));
                u.setUsuario(rs.getString("USUARIO"));
                u.setRol(Rol.valueOf(rs.getString("ROL").toUpperCase()));
                p.setId_persona(rs.getInt("ID_PERSONA"));
                p.setNombre(rs.getString("NOMBRE"));
                u.setPersona(p);

            }
        } catch (Exception e) {
            System.out.println("Error al validar usuario:" + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
            }
            System.out.println("no se pudo validar el usuario");
        } finally {
            if (cn != null) {
                try {

                } catch (Exception e) {
                }
            }
        }
        return u;
    }
    
}
