package com.virtualclassroom.study_sanctuary.repository;

import com.virtualclassroom.study_sanctuary.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserId(Long userId);
}
