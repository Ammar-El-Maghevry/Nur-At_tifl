package com.nurai.controller;

import com.nurai.dto.ChildRequest;
import com.nurai.model.Child;
import com.nurai.model.User;
import com.nurai.service.AuthService;
import com.nurai.service.ChildService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<Child> addChild(@Valid @RequestBody ChildRequest request,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(childService.addChild(request, user));
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getChildren(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        List<Child> children = childService.getChildren(user.getId());
        List<Map<String, Object>> result = children.stream().map(c -> Map.<String, Object>of(
            "id", c.getId(),
            "name", c.getName(),
            "gender", c.getGender() != null ? c.getGender() : "",
            "birthDate", c.getBirthDate() != null ? c.getBirthDate().toString() : "",
            "createdAt", c.getCreatedAt().toString()
        )).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getChild(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Child c = childService.getChild(id, user.getId());
        return ResponseEntity.ok(Map.of(
            "id", c.getId(),
            "name", c.getName(),
            "gender", c.getGender() != null ? c.getGender() : "",
            "birthDate", c.getBirthDate() != null ? c.getBirthDate().toString() : "",
            "createdAt", c.getCreatedAt().toString()
        ));
    }
}
