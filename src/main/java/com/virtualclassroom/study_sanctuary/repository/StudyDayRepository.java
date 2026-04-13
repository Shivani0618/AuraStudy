package com.virtualclassroom.study_sanctuary.repository;

import com.virtualclassroom.study_sanctuary.model.StudyDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyDayRepository extends JpaRepository<StudyDay, Long> {
    Optional<StudyDay> findByUserIdAndStudyDate(Long userId, LocalDate studyDate);
    List<StudyDay> findByUserIdAndStudyDateAfterOrderByStudyDateAsc(Long userId, LocalDate fromDate);
}
