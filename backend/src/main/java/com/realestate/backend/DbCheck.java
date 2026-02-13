package com.realestate.backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class DbCheck {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/realestate_db";
        String user = "postgres";
        String pass = "user1";

        Class.forName("org.postgresql.Driver");
        try (Connection c = DriverManager.getConnection(url, user, pass)) {
            PreparedStatement ps = c.prepareStatement("SELECT id, email, password, name FROM users WHERE email = ?");
            ps.setString(1, "agent@gmail.com");
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                System.out.println("FOUND: " + rs.getLong("id") + " " + rs.getString("email") + " / " + rs.getString("password") + " / " + rs.getString("name"));
            } else {
                System.out.println("User not found");
            }
        }
    }
}
