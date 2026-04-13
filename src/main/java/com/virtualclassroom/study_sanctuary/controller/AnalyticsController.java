package com.virtualclassroom.study_sanctuary.controller;

import com.virtualclassroom.study_sanctuary.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/heatmap/{userId}")
    public ResponseEntity<Map<String, Object>> getHeatmap(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "12") int months) {
        
        Map<String, Object> data = analyticsService.getHeatmapData(userId, months);
        return ResponseEntity.ok(data);
    }
}
