package com.virtualclassroom.study_sanctuary.repository;

import com.virtualclassroom.study_sanctuary.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdOrderByCreatedAtDesc(Long userId);
}