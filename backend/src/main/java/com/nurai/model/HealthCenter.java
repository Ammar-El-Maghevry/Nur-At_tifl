package com.nurai.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "health_centers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String wilaya;

    private String address;
    private String phone;
    private Double latitude;
    private Double longitude;
}
