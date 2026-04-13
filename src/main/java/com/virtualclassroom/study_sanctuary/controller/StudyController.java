package com.virtualclassroom.study_sanctuary.controller;

import com.virtualclassroom.study_sanctuary.model.StudySession;
import com.virtualclassroom.study_sanctuary.repository.StudySessionRepository;
import com.virtualclassroom.study_sanctuary.repository.UserRepository;
import com.virtualclassroom.study_sanctuary.service.AnalyticsService;
import com.virtualclassroom.study_sanctuary.service.GeminiService;
import com.virtualclassroom.study_sanctuary.service.PdfService; // Capitalized
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
// Global CORS is handled in SecurityConfig, so @CrossOrigin is removed here
public class StudyController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private StudySessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PdfService pdfService; // Capitalized

    /**
     * Generates deep-focus study content based on a topic and optional syllabus PDF.
     */
    @PostMapping(value = "/generate-with-syllabus", consumes = {"multipart/form-data"})
    public StudySession generateWithSyllabus(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart("topic") String topic,
            @RequestPart("duration") String duration,
            @RequestPart("userId") String userId) throws Exception {

        String syllabusText = "";

        if (file != null && !file.isEmpty()) {
            syllabusText = pdfService.extractText(file);
        }

        // Logic uses the 'University Professor' persona for high-density info
        String plan = geminiService.generateStudyContent(topic, Integer.parseInt(duration), syllabusText);

        StudySession session = new StudySession();
        session.setTopic(topic + (file != null ? " (Syllabus Based)" : ""));
        session.setDurationMinutes(Integer.parseInt(duration));
        session.setContent(plan);

        userRepository.findById(Long.valueOf(userId)).ifPresent(session::setUser);

        return sessionRepository.save(session);
    }

    @PostMapping("/explain")
    public ResponseEntity<Map<String, String>> explain(@RequestBody Map<String, String> request) {
        String selectedText = request.get("text");
        String instruction = request.get("instruction");
        String explanation = geminiService.explainSelectedText(selectedText, instruction);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }

    @PostMapping("/{id}/distraction")
    public ResponseEntity<?> logDistraction(@PathVariable Long id) {
        sessionRepository.findById(id).ifPresent(session -> {
            Integer current = session.getDistractions();
            if (current == null) current = 0;
            session.setDistractions(current + 1);
            sessionRepository.save(session);
        });
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/end")
    public ResponseEntity<?> endSession(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        int actualMins = payload.containsKey("actualMins") ? Integer.parseInt(payload.get("actualMins").toString()) : 0;
        int tabSwitchCount = payload.containsKey("tabSwitchCount") ? Integer.parseInt(payload.get("tabSwitchCount").toString()) : 0;

        return sessionRepository.findById(id).map(session -> {
            session.setDistractions(tabSwitchCount);
            sessionRepository.save(session);
            analyticsService.recordStudyDay(session.getUser().getId(), actualMins);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/history/{userId}")
    public List<StudySession> getHistory(@PathVariable Long userId) {
        return sessionRepository.findByUserId(userId);
    }

    @GetMapping("/session/{id}")
    public StudySession getSessionById(@PathVariable Long id) {
        return sessionRepository.findById(id).orElse(null);
    }

    @DeleteMapping("/session/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable Long id) {
        if (sessionRepository.existsById(id)) {
            sessionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}