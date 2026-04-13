package com.virtualclassroom.study_sanctuary.repository;

import com.virtualclassroom.study_sanctuary.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Note> findByUserIdAndTagsContainingIgnoreCaseOrderByCreatedAtDesc(Long userId, String tag);
}
