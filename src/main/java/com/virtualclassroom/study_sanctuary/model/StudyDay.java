package com.virtualclassroom.study_sanctuary.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "study_days", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "study_date" })
})
@Data
@NoArgsConstructor
public class StudyDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "study_date", nullable = false)
    private LocalDate studyDate;

    @Column(name = "total_mins", nullable = false)
    private int totalMins = 0;

    @Column(name = "session_count", nullable = false)
    private int sessionCount = 0;

    public StudyDay(User user, LocalDate studyDate, int totalMins, int sessionCount) {
        this.user = user;
        this.studyDate = studyDate;
        this.totalMins = totalMins;
        this.sessionCount = sessionCount;
    }
}
