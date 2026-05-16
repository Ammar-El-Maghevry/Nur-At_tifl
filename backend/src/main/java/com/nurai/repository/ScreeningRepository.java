package com.nurai.repository;

import com.nurai.model.Screening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ScreeningRepository extends JpaRepository<Screening, Long> {
    List<Screening> findByChildIdOrderByCreatedAtDesc(Long childId);

    @Query("SELECT s FROM Screening s WHERE s.child.user.id = :userId ORDER BY s.createdAt DESC")
    List<Screening> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByChildUserId(Long userId);
}
