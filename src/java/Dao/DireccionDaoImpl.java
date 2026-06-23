/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Dao;

import Interface.IDireccion;
import Model.Direccion;
import Model.Persona;
import Util.ConexionSingleton;
import java.util.List;
import java.sql.*;
import java.util.ArrayList;

/**
 *
 * @author JHOSMER
 */
public class DireccionDaoImpl implements IDireccion {

    private Connection cn;

    @Override
    public List<Direccion> listar() {
        List<Direccion> lista = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT ID_DIRECCION, ID_PERSONA, CIUDAD, CALLE, ES_PRINCIPAL "
                    + "FROM DIRECCION";
            lista = new ArrayList<>();
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            rs = st.executeQuery();

            while (rs.next()) {
                Direccion d = new Direccion();
                d.setId_direccion(rs.getInt("ID_DIRECCION"));
                Persona p = new Persona();
                p.setId_persona(rs.getInt("ID_PERSONA"));
                d.setPersona(p);
                d.setCiudad(rs.getString("CIUDAD"));
                d.setCalle(rs.getString("CALLE"));
                d.setEs_principal(rs.getString("ES_PRINCIPAL").equals("S"));
                lista.add(d);
            }

        } catch (Exception e) {
            System.out.println("Error al listar direcciones: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo listar las direcciones");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return lista;
    }

    @Override
    public boolean insertar(Direccion d) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "INSERT INTO DIRECCION(ID_PERSONA, CIUDAD, CALLE, ES_PRINCIPAL)"
                    + " VALUES(?, ?, ?, ?)";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, d.getPersona().getId_persona());
            st.setString(2, d.getCiudad());
            st.setString(3, d.getCalle());
            st.setString(4, d.isEs_principal() ? "S" : "N");
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al insertar direccion: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return flag;
    }

    @Override
    public Direccion buscarPorId(int id) {
        Direccion d = null;
        PreparedStatement st;
        ResultSet rs;

        try {
            String query = "SELECT * FROM DIRECCION "
                    + "WHERE ID_DIRECCION = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            rs = st.executeQuery();

            if (rs.next()) {
                d = new Direccion();
                d.setId_direccion(rs.getInt("ID_DIRECCION"));
                Persona p = new Persona();
                p.setId_persona(rs.getInt("ID_PERSONA"));
                d.setPersona(p);
                d.setCiudad(rs.getString("CIUDAD"));
                d.setCalle(rs.getString("CALLE"));
                d.setEs_principal(rs.getString("ES_PRINCIPAL").equals("S"));
            }

        } catch (Exception e) {
            System.out.println("Error al buscar direccion: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            System.out.println("No se pudo buscar la dirección por ID");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return d;
    }

    @Override
    public boolean eliminar(int id) {
        boolean flag = false;
        PreparedStatement st;

        try {
            String query = "DELETE FROM DIRECCION "
                    + "WHERE ID_DIRECCION = ?";
            cn = ConexionSingleton.getConnection();
            st = cn.prepareStatement(query);
            st.setInt(1, id);
            st.executeUpdate();
            flag = true;

        } catch (Exception e) {
            System.out.println("Error al eliminar direccion: " + e.getMessage());
            try {
                cn.rollback();
            } catch (Exception ex) {
                System.out.println("Error en rollback: " + ex.getMessage());
            }
            flag = false;
            System.out.println("Error, no se eliminó la dirección");
        } finally {
            if (cn != null) {
                try {
                } catch (Exception e) {
                }
            }
        }
        return flag;
    }

}
