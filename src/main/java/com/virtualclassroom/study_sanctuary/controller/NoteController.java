package com.virtualclassroom.study_sanctuary.controller;

import com.virtualclassroom.study_sanctuary.model.Note;
import com.virtualclassroom.study_sanctuary.repository.NoteRepository;
import com.virtualclassroom.study_sanctuary.repository.UserRepository;
import com.virtualclassroom.study_sanctuary.repository.StudySessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudySessionRepository sessionRepository;

    // CREATE a new note
    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Map<String, Object> payload) {
        Note note = new Note();
        note.setTitle((String) payload.get("title"));
        note.setContent((String) payload.get("content"));
        note.setColor((String) payload.get("color"));
        note.setTags((String) payload.get("tags"));

        if (payload.get("pinned") != null) {
            note.setPinned((boolean) payload.get("pinned"));
        }
        if (payload.get("userId") != null) {
            Long userId = Long.valueOf(payload.get("userId").toString());
            userRepository.findById(userId).ifPresent(note::setUser);
        }
        if (payload.get("sessionId") != null) {
            Long sessionId = Long.valueOf(payload.get("sessionId").toString());
            sessionRepository.findById(sessionId).ifPresent(note::setSession);
        }
        return ResponseEntity.ok(noteRepository.save(note));
    }

    // UPDATE an existing note (for editing)
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<Note> existing = noteRepository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();

        Note note = existing.get();
        if (payload.get("title") != null) note.setTitle((String) payload.get("title"));
        if (payload.get("content") != null) note.setContent((String) payload.get("content"));
        if (payload.get("color") != null) note.setColor((String) payload.get("color"));
        if (payload.get("tags") != null) note.setTags((String) payload.get("tags"));
        if (payload.get("pinned") != null) note.setPinned((boolean) payload.get("pinned"));
        note.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(noteRepository.save(note));
    }

    // GET all notes for a user
    @GetMapping("/user/{userId}")
    public List<Note> getNotes(@PathVariable Long userId) {
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // DELETE a note
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        noteRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}