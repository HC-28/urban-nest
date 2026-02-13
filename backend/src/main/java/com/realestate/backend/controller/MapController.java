package com.realestate.backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/api/map")
public class MapController {

    @GetMapping(value = "/ahmedabad", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAhmedabadMap() {
        try {
            // GeoJSON file should be in src/main/resources/geo/Ahmedabad.geojson
            Resource resource = new ClassPathResource("geo/Ahmedabad.geojson");
            String geoJson = Files.readString(resource.getFile().toPath());
            return ResponseEntity.ok(geoJson);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("{\"error\":\"Unable to load Ahmedabad map\"}");
        }
    }
}
