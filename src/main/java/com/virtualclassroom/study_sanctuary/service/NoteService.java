package com.virtualclassroom.study_sanctuary.service;

import com.virtualclassroom.study_sanctuary.model.Note;
import com.virtualclassroom.study_sanctuary.model.StudySession;
import com.virtualclassroom.study_sanctuary.model.User;
import com.virtualclassroom.study_sanctuary.repository.NoteRepository;
import com.virtualclassroom.study_sanctuary.repository.StudySessionRepository;
import com.virtualclassroom.study_sanctuary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudySessionRepository sessionRepository;

    public Note createNote(Long userId, Long sessionId, String title, String content, String color, String tags) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        StudySession session = null;
        if (sessionId != null) {
            session = sessionRepository.findById(sessionId).orElse(null);
        }

        Note note = new Note();
        note.setUser(user);
        note.setSession(session);
        note.setTitle(title);
        note.setContent(content);
        if (color != null) note.setColor(color);
        note.setTags(tags);

        return noteRepository.save(note);
    }

    public List<Note> getUserNotes(Long userId) {
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<Note> getNoteById(Long noteId) {
        return noteRepository.findById(noteId);
    }

    public Note updateNote(Long noteId, String title, String content, String color, String tags, Boolean pinned) {
        return noteRepository.findById(noteId).map(note -> {
            if (title != null) note.setTitle(title);
            if (content != null) note.setContent(content);
            if (color != null) note.setColor(color);
            if (tags != null) note.setTags(tags);
            if (pinned != null) note.setPinned(pinned);
            return noteRepository.save(note);
        }).orElseThrow(() -> new RuntimeException("Note not found"));
    }

    public void deleteNote(Long noteId) {
        noteRepository.deleteById(noteId);
    }
}
