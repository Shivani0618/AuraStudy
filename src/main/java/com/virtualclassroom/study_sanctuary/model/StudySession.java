package com.virtualclassroom.study_sanctuary.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_sessions")
@Data
public class StudySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String topic;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "start_time")
    private LocalDateTime startTime = LocalDateTime.now();

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "distractions")
    private Integer distractions = 0;

    @Column(name = "is_completed")
    private boolean isCompleted = false;
}