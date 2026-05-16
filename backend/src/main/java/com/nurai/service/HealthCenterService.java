package com.nurai.service;

import com.nurai.model.HealthCenter;
import com.nurai.repository.HealthCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HealthCenterService {

    private final HealthCenterRepository healthCenterRepository;

    public List<HealthCenter> getAll(String wilaya) {
        if (wilaya != null && !wilaya.isBlank()) {
            return healthCenterRepository.findByWilayaIgnoreCase(wilaya);
        }
        return healthCenterRepository.findAll();
    }

    public List<HealthCenter> findNearest(double lat, double lng) {
        List<HealthCenter> all = healthCenterRepository.findAll();
        return all.stream()
                .filter(hc -> hc.getLatitude() != null && hc.getLongitude() != null)
                .sorted(Comparator.comparingDouble(hc -> haversine(lat, lng, hc.getLatitude(), hc.getLongitude())))
                .limit(5)
                .collect(Collectors.toList());
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
