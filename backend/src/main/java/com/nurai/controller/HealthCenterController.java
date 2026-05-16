package com.nurai.controller;

import com.nurai.model.HealthCenter;
import com.nurai.service.HealthCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health-centers")
@RequiredArgsConstructor
public class HealthCenterController {

    private final HealthCenterService healthCenterService;

    @GetMapping
    public ResponseEntity<List<HealthCenter>> getAll(
            @RequestParam(required = false) String wilaya) {
        return ResponseEntity.ok(healthCenterService.getAll(wilaya));
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<HealthCenter>> nearest(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ResponseEntity.ok(healthCenterService.findNearest(lat, lng));
    }
}
