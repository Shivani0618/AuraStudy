package com.virtualclassroom.study_sanctuary.controller;

import com.virtualclassroom.study_sanctuary.model.Note;
import com.virtualclassroom.study_sanctuary.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Long sessionId = payload.containsKey("sessionId") && payload.get("sessionId") != null 
                ? Long.valueOf(payload.get("sessionId").toString()) : null;
        String title = (String) payload.get("title");
        String content = (String) payload.get("content");
        String color = (String) payload.get("color");
        String tags = (String) payload.get("tags");

        Note note = noteService.createNote(userId, sessionId, title, content, color, tags);
        return ResponseEntity.ok(note);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Note>> getUserNotes(@PathVariable Long userId) {
        return ResponseEntity.ok(noteService.getUserNotes(userId));
    }

    @PatchMapping("/{noteId}")
    public ResponseEntity<Note> updateNote(@PathVariable Long noteId, @RequestBody Map<String, Object> updates) {
        String title = (String) updates.get("title");
        String content = (String) updates.get("content");
        String color = (String) updates.get("color");
        String tags = (String) updates.get("tags");
        Boolean pinned = updates.containsKey("pinned") ? (Boolean) updates.get("pinned") : null;

        Note updated = noteService.updateNote(noteId, title, content, color, tags, pinned);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(@PathVariable Long noteId) {
        noteService.deleteNote(noteId);
        return ResponseEntity.ok().build();
    }
}
