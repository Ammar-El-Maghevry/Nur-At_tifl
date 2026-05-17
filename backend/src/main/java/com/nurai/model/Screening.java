package com.nurai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nurai_screenings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Screening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_id", nullable = false)
    private Child child;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "muac_value")
    private Double muacValue;

    @Column(name = "risk_level")
    private String riskLevel;

    private Double confidence;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "arabic_notes", columnDefinition = "TEXT")
    private String arabicNotes;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
