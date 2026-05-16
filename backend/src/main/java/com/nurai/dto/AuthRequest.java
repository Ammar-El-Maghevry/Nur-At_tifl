package com.nurai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @NotBlank
    private String phone;
    @NotBlank
    private String password;
    private String fullName;
    private String wilaya;
    private String languagePref;
}
