package com.nurai.repository;

import com.nurai.model.HealthCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthCenterRepository extends JpaRepository<HealthCenter, Long> {
    List<HealthCenter> findByWilayaIgnoreCase(String wilaya);
}
