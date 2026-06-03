/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Util;
import java.sql.*;
public class ConexionSingleton {
     //creado una variable estatica 
    public static Connection connection;

    //metodo getConnection
    public static Connection getConnection() {
        try {
            if (connection == null) {
                Runtime.getRuntime().addShutdownHook(new getClose());
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection("jdbc:mysql://localhost/proyect", "root", "jhoss");
                System.out.println("Entro al if");
                
//                    Driver Oracle JDBC
////                 Class.forName("oracle.jdbc.OracleDriver");
////                // Conexion Oracle XE
////                connection = DriverManager.getConnection(
////                        "jdbc:oracle:thin:@localhost:1521/XE",
////                        "MODA_ESTILO",
////                        "123"
////                );
////
////                System.out.println("Conectado a Oracle XE");
            }
            return connection;

        } catch (ClassNotFoundException | SQLException e) {
            throw new RuntimeException("Conexion fallida", e);

        }

    }

    static class getClose extends Thread {

        @Override
        public void run() {
            try {
                Connection conn = ConexionSingleton.getConnection();
                conn.close();
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }

        }

    }
}
