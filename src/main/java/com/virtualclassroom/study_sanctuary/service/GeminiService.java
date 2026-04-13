package com.virtualclassroom.study_sanctuary.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateStudyContent(String topic, int duration, String syllabusContext) {
        String fullUrl = apiUrl + "?key=" + apiKey;

        String prompt = String.format(
                "You are an expert tutor creating a student-focused study plan on %s. " +
                        "The student has %d minutes for this session. " +
                        "Generate a highly readable, engaging, new-age learning guide. " +
                        "Follow this exact structure: " +
                        "1. DEFINITION: A clear, simple definition of the topic. " +
                        "2. CORE CONCEPTS: Thorough explanation using analogies (Use LaTeX for any math). " +
                        "3. REAL-WORLD APPLICATIONS: Describe practical, modern use cases. " +
                        "4. QUICK QUIZ: Provide 3 simple questions to test understanding. " +
                        "Ensure the language is encouraging and student-focused. " +
                        "CRITICAL: Do NOT include any introductory greetings, filler text, or concluding remarks. Output strictly the requested format.",
                topic, duration
        );
        if (syllabusContext != null && !syllabusContext.isEmpty()) {
            prompt += " Base the concepts strictly around this syllabus: " + syllabusContext;
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(fullUrl, requestBody, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    return (String) parts.get(0).get("text");
                }
            }
            return "System error: AI failed to generate academic content.";
        } catch (Exception e) {
            return "Error calling AI: " + e.getMessage();
        }
    }
    public String explainSelectedText(String text, String instruction) {
        String fullUrl = apiUrl + "?key=" + apiKey;

        String customHelp = (instruction != null && !instruction.trim().isEmpty()) ? instruction : "Explain it to the user.";

        String prompt = "A student has highlighted this text: '" + text + "'. " + customHelp + " CRITICAL: Output ONLY the explanation. Do not give detailed unnecessary explanations. Do not include any introductory or concluding remarks.";

        return callGemini(fullUrl, prompt);
    }

    /**
     * Helper method to handle the nested JSON extraction logic safely.
     * This avoids the "cannot resolve method get in Object" error by using explicit casting.
     */
    private String callGemini(String url, String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response != null && response.containsKey("candidates")) {
                // Use explicit generics <Map<String, Object>> to avoid Object resolution errors
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");

                    if (content != null) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            }
            return "System error: AI failed to generate content.";
        } catch (Exception e) {
            return "Error calling AI: " + e.getMessage();
        }
    }
}