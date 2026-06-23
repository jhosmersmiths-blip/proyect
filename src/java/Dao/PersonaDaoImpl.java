/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IPersona;
import Model.Persona;
import Model.Rol;
import Model.Usuario;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */

public class PersonaDaoImpl implements IPersona {

    private Connection cn;

    @Override
    public List<Persona> listar() {
        List<Persona> lista = null;
        Persona p;
        PreparedStatement st = null;
        ResultSet rs = null;
        String query = null;

        try {
            query = "SELECT ID_PERSONA, NOMBRE, APELL_PATERNO, APELL_MATERNO, TELEFONO, CORREO"
                    + " FROM PERSONA";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                p = new Persona();
                p.setId_persona(rs.getInt("ID_PERSONA"));
                p.setNombre(rs.getString("NOMBRE"));
                p.setApell_paterno(rs.getString("APELL_PATERNO"));
                p.setApell_materno(rs.getString("APELL_MATERNO"));
                p.setTelefono(rs.getString("TELEFONO"));
                p.setCorreo(rs.getString("CORREO"));
                lista.add(p);
            }

        } catch (Exception e) {
            System.out.println("Error al listar: " + e.getMessage());
            System.out.println("No se pudo listar las personas");
        } finally {
            try {
                if (rs != null) {
                    rs.close();
                }
                if (st != null) {
                    st.close();
                }
            } catch (Exception e) {
                System.out.println("Error al cerrar recursos: " + e.getMessage());
            }
        }

        return lista;

    }

    @Override
    public int insertar(Persona p, Usuario u) {

            PreparedStatement st;
            CallableStatement cs;
            String query = null;
            ResultSet rs;
            int id_persona = 0;
            int r = 0;

            try {
                query = "BEGIN INSERT INTO PERSONA(NOMBRE, APELL_PATERNO, APELL_MATERNO, TELEFONO, CORREO)"
                        + " VALUES(?, ?, ?, ?, ?) RETURNING ID_PERSONA INTO ?; END;";
                cn = ConexionSingleton.getConnection();
                cs = cn.prepareCall(query);
                cs.setString(1, p.getNombre());
                cs.setString(2, p.getApell_paterno());
                cs.setString(3, p.getApell_materno());
                cs.setString(4, p.getTelefono());
                cs.setString(5, p.getCorreo());
                cs.registerOutParameter(6, java.sql.Types.INTEGER);

                cs.executeUpdate();

                //linea que devuelve el id de la persona creada
                id_persona = cs.getInt(6);
                System.out.println("id_persona:" + id_persona);

                if (id_persona > 0) {
                    u.setRol(Rol.CLIENTE);
                    String hashpassword = u.HasPassword(u.getContasena());
                    query = "INSERT INTO USUARIO (USUARIO,CONTRASENA,ROL,ID_PERSONA)"
                            + " VALUES(?, ?, ?, ?)";
                    st = cn.prepareStatement(query);
                    st.setString(1, p.getCorreo());
                    st.setString(2, hashpassword);
                    st.setString(3, u.getRol().name());
                    st.setInt(4, id_persona);
                    r = st.executeUpdate();
                } else {
                    System.out.println("Error al agregar una persona");
                }
            } catch (Exception e) {
                System.out.println("Error al agregar" + e.getMessage());
                try {
                    cn.rollback();
                } catch (Exception ex) {
                    System.out.println("Error del rollback" + e.getMessage());
                }
            } finally {
                if (cn != null) {
                    try {
                        cn.setAutoCommit(true);
                    } catch (Exception ex) {
                    }
                }
            }
            return r;
        }


    @Override
    public boolean actualizar(Persona p) {
        boolean flag = false;
        PreparedStatement st = null;
        String query = null;

        try {
            query = "UPDATE PERSONA SET NOMBRE = ?, APELL_PATERNO = ?, "
                    + "APELL_MATERNO = ?, TELEFONO = ?, CORREO = ? "
                    + "WHERE ID_PERSONA = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setString(1, p.getNombre());
            st.setString(2, p.getApell_paterno());
            st.setString(3, p.getApell_materno());
            st.setString(4, p.getTelefono());
            st.setString(5, p.getCorreo());
            st.setInt(6, p.getId_persona());
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error de actualizacion: " + e.getMessage());
            try {
                if (cn != null) {
                    cn.rollback();
                }
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
        } finally {
            try {
                if (st != null) {
                    st.close();
                }
            } catch (Exception e) {
                System.out.println("Error al cerrar recursos: " + e.getMessage());
            }
        }
        return flag;
    }

    @Override
    public Persona buscarPorid(int id) {
        Persona p = null;
        PreparedStatement st = null;
        ResultSet rs = null;
        String query = null;

        try {
            query = "SELECT * FROM PERSONA WHERE ID_PERSONA = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            rs = st.executeQuery();

            if (rs.next()) {
                p = new Persona();
                p.setId_persona(rs.getInt("ID_PERSONA"));
                p.setNombre(rs.getString("NOMBRE"));
                p.setApell_paterno(rs.getString("APELL_PATERNO"));
                p.setApell_materno(rs.getString("APELL_MATERNO"));
                p.setTelefono(rs.getString("TELEFONO"));
                p.setCorreo(rs.getString("CORREO"));
            }

        } catch (Exception e) {
            System.out.println("Error de busqueda: " + e.getMessage());
            System.out.println("No se pudo buscar la persona por ID");
        } finally {
            try {
                if (rs != null) {
                    rs.close();
                }
                if (st != null) {
                    st.close();
                }
            } catch (Exception e) {
                System.out.println("Error al cerrar recursos: " + e.getMessage());
            }
        }
        return p;
    }

    @Override
    public boolean eliminar(int id) {
        boolean flag = false;
        PreparedStatement st = null;
        String query = null;

        try {
            query = "DELETE FROM PERSONA WHERE ID_PERSONA = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al eliminar: " + e.getMessage());
            try {
                if (cn != null) {
                    cn.rollback();
                }
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se elimino el registro");
        } finally {
            try {
                if (st != null) {
                    st.close();
                }
            } catch (Exception e) {
                System.out.println("Error al cerrar recursos: " + e.getMessage());
            }
        }
        return flag;
    }

}
