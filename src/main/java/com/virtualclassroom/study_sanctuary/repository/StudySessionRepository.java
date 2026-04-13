package com.virtualclassroom.study_sanctuary.repository;

import com.virtualclassroom.study_sanctuary.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    // This allows Partner B to fetch all previous sessions for a specific user
    List<StudySession> findByUserId(Long userId);
}
