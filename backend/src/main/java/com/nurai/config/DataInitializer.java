package com.nurai.config;

import com.nurai.model.HealthCenter;
import com.nurai.repository.HealthCenterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final HealthCenterRepository healthCenterRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (healthCenterRepository.count() > 0) return;

        log.info("Seeding health centers...");
        healthCenterRepository.saveAll(List.of(
            center("Centre de Santé Capitale Nouakchott", "Nouakchott", "Tevragh-Zeina, Nouakchott", "+222 45 25 14 30", 18.0858, -15.9785),
            center("Hôpital Cheikh Zayed", "Nouakchott", "Ksar, Nouakchott", "+222 45 29 10 40", 18.0939, -15.9653),
            center("Centre de Santé de Toujounine", "Nouakchott", "Toujounine, Nouakchott", "+222 45 41 00 15", 18.1123, -15.9012),
            center("Centre Hospitalier National", "Nouakchott", "El Mina, Nouakchott", "+222 45 25 21 43", 18.0812, -15.9542),
            center("Centre de Santé de Rosso", "Trarza", "Rosso Centre, Trarza", "+222 45 63 12 00", 16.5107, -15.8052),
            center("Centre de Santé de Boghé", "Brakna", "Centre-ville Boghé", "+222 45 65 10 20", 17.0108, -14.9476),
            center("Hôpital Régional de Nouadhibou", "Dakhlet Nouadhibou", "Centre Nouadhibou", "+222 45 74 10 05", 20.9310, -17.0316),
            center("Centre de Santé d'Atar", "Adrar", "Atar Centre", "+222 45 46 10 15", 20.5171, -13.0484),
            center("Centre de Santé de Kiffa", "Assaba", "Kiffa Centre", "+222 45 50 10 30", 16.6179, -11.4041),
            center("Centre de Santé de Kaédi", "Gorgol", "Kaédi Centre", "+222 45 66 10 40", 16.1500, -13.5000),
            center("Centre de Santé de Sélibaby", "Guidimakha", "Sélibaby Centre", "+222 45 55 10 50", 15.1667, -12.1833),
            center("Centre de Santé de Tidjikja", "Tagant", "Tidjikja Centre", "+222 45 49 10 10", 18.5511, -11.4277),
            center("Centre de Santé de Aïoun", "Hodh El Gharbi", "Aïoun el-Atrouss", "+222 45 52 10 20", 16.6627, -9.6136),
            center("Centre de Santé de Néma", "Hodh Ech Chargui", "Néma Centre", "+222 45 53 10 30", 16.6167, -7.2500),
            center("Centre Nutrition UNICEF Nouakchott", "Nouakchott", "Dar Naim, Nouakchott", "+222 45 29 50 60", 18.1234, -15.9456)
        ));
        log.info("Seeded 15 health centers.");
    }

    private HealthCenter center(String name, String wilaya, String address, String phone, double lat, double lng) {
        return HealthCenter.builder().name(name).wilaya(wilaya).address(address).phone(phone).latitude(lat).longitude(lng).build();
    }
}
