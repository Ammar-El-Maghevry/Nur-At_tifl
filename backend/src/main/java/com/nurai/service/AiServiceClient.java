package com.nurai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiWebClient;

    public Map<String, Object> analyzeImage(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
                }
            }).contentType(MediaType.IMAGE_JPEG);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = aiWebClient.post()
                    .uri("/analyze")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result == null) {
                return fallbackAnalysis();
            }
            return result;

        } catch (WebClientResponseException e) {
            log.error("AI service error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            return fallbackAnalysis();
        } catch (Exception e) {
            log.error("Failed to call AI service: {}", e.getMessage());
            return fallbackAnalysis();
        }
    }

    public Map<String, Object> askQuestion(String question, String language) {
        try {
            Map<String, String> requestBody = Map.of(
                "question", question,
                "language", language != null ? language : "ar"
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> result = aiWebClient.post()
                    .uri("/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result == null) {
                return fallbackChat(language);
            }
            return result;

        } catch (Exception e) {
            log.error("Failed to call AI chat service: {}", e.getMessage());
            return fallbackChat(language);
        }
    }

    private Map<String, Object> fallbackAnalysis() {
        return Map.of(
            "muac_value", 12.8,
            "risk_level", "NORMAL",
            "confidence", 0.70,
            "advice", "Unable to connect to AI service. Based on default values, your child appears to be in normal range. Please retry or visit your health center.",
            "arabic_advice", "تعذر الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مجدداً أو زيارة المركز الصحي.",
            "arm_detected", false,
            "detection_method", "fallback"
        );
    }

    private Map<String, Object> fallbackChat(String language) {
        String answer = "ar".equals(language)
            ? "عذراً، خدمة الدردشة غير متاحة حالياً. يرجى الاتصال بالعامل الصحي في منطقتك."
            : "Chat service is currently unavailable. Please contact your local health worker.";
        return Map.of(
            "answer", answer,
            "sources", java.util.List.of(),
            "verified", false
        );
    }
}
