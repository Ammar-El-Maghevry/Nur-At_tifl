package com.nurai.repository;

import com.nurai.model.Screening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ScreeningRepository extends JpaRepository<Screening, Long> {
    @Query("SELECT DISTINCT s FROM Screening s JOIN FETCH s.child WHERE s.child.id = :childId ORDER BY s.createdAt DESC")
    List<Screening> findByChildIdOrderByCreatedAtDesc(Long childId);

    @Query("SELECT DISTINCT s FROM Screening s JOIN FETCH s.child c WHERE c.user.id = :userId ORDER BY s.createdAt DESC")
    List<Screening> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByChildUserId(Long userId);
}
