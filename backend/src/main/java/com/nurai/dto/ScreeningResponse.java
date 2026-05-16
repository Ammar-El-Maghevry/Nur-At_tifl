package com.nurai.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ScreeningResponse {
    private Long id;
    private Long childId;
    private String childName;
    private Double muacValue;
    private String riskLevel;
    private Double confidence;
    private String notes;
    private String arabicNotes;
    private LocalDateTime createdAt;
}
