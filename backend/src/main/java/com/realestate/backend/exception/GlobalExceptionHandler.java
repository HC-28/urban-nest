package com.realestate.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDatabaseErrors(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Database Error");
        error.put("message", "Data is too long or a required field is missing.");
        error.put("details", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Handles Generic Errors
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalErrors(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Server Error");
        error.put("message", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}