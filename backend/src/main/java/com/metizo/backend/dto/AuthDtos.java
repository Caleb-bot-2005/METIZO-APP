package com.metizo.backend.dto;

import com.metizo.backend.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Authentication-related request/response payloads.
 */
public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6, message = "password must be at least 6 characters") String password,
            String phone,
            @NotNull Role role,
            // Optional artisan fields, used only when role == ARTISAN.
            String category,
            String bio,
            String location
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            String fullName,
            String email,
            Role role
    ) {}
}
