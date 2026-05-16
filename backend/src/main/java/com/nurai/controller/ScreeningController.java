package com.nurai.controller;

import com.nurai.dto.ScreeningResponse;
import com.nurai.model.Child;
import com.nurai.model.User;
import com.nurai.service.AuthService;
import com.nurai.service.ChildService;
import com.nurai.service.ScreeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/screening")
@RequiredArgsConstructor
public class ScreeningController {

    private final ScreeningService screeningService;
    private final ChildService childService;
    private final AuthService authService;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ScreeningResponse> analyze(
            @RequestParam("image") MultipartFile image,
            @RequestParam("childId") Long childId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        Child child = childService.getChild(childId, user.getId());
        return ResponseEntity.ok(screeningService.analyze(image, child));
    }

    @GetMapping("/history/{childId}")
    public ResponseEntity<List<ScreeningResponse>> getHistory(
            @PathVariable Long childId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        childService.getChild(childId, user.getId());
        return ResponseEntity.ok(screeningService.getHistory(childId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ScreeningResponse>> getUserHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(screeningService.getUserHistory(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScreeningResponse> getScreening(@PathVariable Long id) {
        return ResponseEntity.ok(screeningService.getScreening(id));
    }
}
