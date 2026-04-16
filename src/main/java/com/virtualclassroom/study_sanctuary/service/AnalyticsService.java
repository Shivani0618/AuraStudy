package com.virtualclassroom.study_sanctuary.service;

import com.virtualclassroom.study_sanctuary.model.StudyDay;
import com.virtualclassroom.study_sanctuary.model.User;
import com.virtualclassroom.study_sanctuary.repository.StudyDayRepository;
import com.virtualclassroom.study_sanctuary.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    @Autowired
    private StudyDayRepository studyDayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.virtualclassroom.study_sanctuary.repository.StudySessionRepository sessionRepository;

    @Transactional
    public void recordStudyDay(Long userId, int durationMins) {
        System.out.println("[recordStudyDay] userId=" + userId + " | durationMins=" + durationMins);
        if (durationMins < 1)
            return;

        LocalDate today = LocalDate.now();
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        StudyDay day = studyDayRepository.findByUserIdAndStudyDate(userId, today)
                .orElse(new StudyDay(user, today, 0, 0));

        day.setTotalMins(day.getTotalMins() + durationMins);
        day.setSessionCount(day.getSessionCount() + 1);

        studyDayRepository.save(day);
    }

    public Map<String, Object> getHeatmapData(Long userId, int months) {
        LocalDate from = LocalDate.now().minusMonths(months);
        List<StudyDay> days = studyDayRepository.findByUserIdAndStudyDateAfterOrderByStudyDateAsc(userId, from);

        int totalMins = 0;
        int currentStreak = 0;
        int maxStreak = 0;

        // Calculate Streak and totals
        LocalDate prevDate = null;
        int currentCount = 0;

        for (StudyDay day : days) {
            totalMins += day.getTotalMins();

            if (prevDate == null) {
                currentCount = 1;
            } else {
                if (day.getStudyDate().equals(prevDate.plusDays(1))) {
                    currentCount++;
                } else if (!day.getStudyDate().equals(prevDate)) {
                    currentCount = 1;
                }
            }
            if (currentCount > maxStreak) {
                maxStreak = currentCount;
            }
            prevDate = day.getStudyDate();
        }

        // Check if streak is still active today or yesterday
        if (prevDate != null) {
            LocalDate today = LocalDate.now();
            if (prevDate.equals(today) || prevDate.equals(today.minusDays(1))) {
                currentStreak = currentCount;
            } else {
                currentStreak = 0;
            }
        }

        int totalDistractions = sessionRepository.findByUserId(userId).stream()
                .mapToInt(session -> session.getDistractions() != null ? session.getDistractions() : 0)
                .sum();

        Map<String, Object> result = new HashMap<>();
        result.put("studyDays", days);
        result.put("currentStreak", currentStreak);
        result.put("maxStreak", maxStreak);
        result.put("totalMins", totalMins);
        result.put("totalDistractions", totalDistractions);
        return result;
    }
}
