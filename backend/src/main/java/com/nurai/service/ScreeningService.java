package com.nurai.service;

import com.nurai.dto.ScreeningResponse;
import com.nurai.model.Child;
import com.nurai.model.Screening;
import com.nurai.repository.ScreeningRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreeningService {

    private final ScreeningRepository screeningRepository;
    private final AiServiceClient aiServiceClient;

    @Value("${nurai.uploads.dir}")
    private String uploadsDir;

    public ScreeningResponse analyze(MultipartFile file, Child child) {
        String imagePath = saveImage(file, child.getId());

        Map<String, Object> aiResult = aiServiceClient.analyzeImage(file);

        double muacValue = toDouble(aiResult.get("muac_value"), 12.8);
        String riskLevel = toString(aiResult.get("risk_level"), "NORMAL");
        double confidence = toDouble(aiResult.get("confidence"), 0.80);
        String advice = toString(aiResult.get("advice"), "Please consult your health worker.");
        String arabicAdvice = toString(aiResult.get("arabic_advice"), "يرجى استشارة العامل الصحي.");

        Screening screening = Screening.builder()
                .child(child)
                .imagePath(imagePath)
                .muacValue(muacValue)
                .riskLevel(riskLevel)
                .confidence(confidence)
                .notes(advice)
                .build();

        screening = screeningRepository.save(screening);

        return ScreeningResponse.builder()
                .id(screening.getId())
                .childId(child.getId())
                .childName(child.getName())
                .muacValue(muacValue)
                .riskLevel(riskLevel)
                .confidence(confidence)
                .notes(advice)
                .arabicNotes(arabicAdvice)
                .createdAt(screening.getCreatedAt())
                .build();
    }

    public List<ScreeningResponse> getHistory(Long childId) {
        return screeningRepository.findByChildIdOrderByCreatedAtDesc(childId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ScreeningResponse> getUserHistory(Long userId) {
        return screeningRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ScreeningResponse getScreening(Long id) {
        return screeningRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Screening not found"));
    }

    public long countUserScreenings(Long userId) {
        return screeningRepository.countByChildUserId(userId);
    }

    private ScreeningResponse toResponse(Screening s) {
        return ScreeningResponse.builder()
                .id(s.getId())
                .childId(s.getChild().getId())
                .childName(s.getChild().getName())
                .muacValue(s.getMuacValue())
                .riskLevel(s.getRiskLevel())
                .confidence(s.getConfidence())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private String saveImage(MultipartFile file, Long childId) {
        try {
            Path dir = Paths.get(uploadsDir);
            Files.createDirectories(dir);
            String filename = "child_" + childId + "_" +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) +
                    getExtension(file.getOriginalFilename());
            Path dest = dir.resolve(filename);
            file.transferTo(dest);
            return dest.toString();
        } catch (IOException e) {
            log.warn("Could not save image: {}", e.getMessage());
            return "unsaved";
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }

    private double toDouble(Object val, double defaultVal) {
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException ignored) {}
        }
        return defaultVal;
    }

    private String toString(Object val, String defaultVal) {
        return val != null ? val.toString() : defaultVal;
    }
}
