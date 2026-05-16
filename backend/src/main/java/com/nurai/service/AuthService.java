package com.nurai.service;

import com.nurai.dto.AuthRequest;
import com.nurai.dto.AuthResponse;
import com.nurai.model.User;
import com.nurai.repository.UserRepository;
import com.nurai.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .wilaya(request.getWilaya())
                .languagePref(request.getLanguagePref() != null ? request.getLanguagePref() : "ar")
                .build();

        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getPhone(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .wilaya(user.getWilaya())
                .languagePref(user.getLanguagePref())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getPhone(), request.getPassword())
        );

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getPhone(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .wilaya(user.getWilaya())
                .languagePref(user.getLanguagePref())
                .build();
    }

    public User getCurrentUser(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
