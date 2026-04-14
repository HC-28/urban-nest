package com.realestate.backend.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import com.realestate.backend.dto.ApiResponse;

@RestController
@RequestMapping("/api/map")
public class MapController {

    @GetMapping(value = "/ahmedabad", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<String>> getAhmedabadMap() throws IOException {
        // GeoJSON file should be in src/main/resources/geo/Ahmedabad.geojson
        Resource resource = new ClassPathResource("geo/Ahmedabad.geojson");
        String geoJson = Files.readString(resource.getFile().toPath());
        return ResponseEntity.ok(ApiResponse.success(geoJson));
    }
}
