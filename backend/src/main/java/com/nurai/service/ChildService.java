package com.nurai.service;

import com.nurai.dto.ChildRequest;
import com.nurai.model.Child;
import com.nurai.model.User;
import com.nurai.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;

    public Child addChild(ChildRequest request, User user) {
        Child child = Child.builder()
                .name(request.getName())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .user(user)
                .build();
        return childRepository.save(child);
    }

    public List<Child> getChildren(Long userId) {
        return childRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Child getChild(Long id, Long userId) {
        Child child = childRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Child not found"));
        if (!child.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        return child;
    }
}
