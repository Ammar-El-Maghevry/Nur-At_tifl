package com.nurai.repository;

import com.nurai.model.Child;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChildRepository extends JpaRepository<Child, Long> {
    List<Child> findByUserIdOrderByCreatedAtDesc(Long userId);
}
