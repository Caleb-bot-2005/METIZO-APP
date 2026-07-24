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

    public record ForgotPasswordRequest(
            @Email @NotBlank String email
    ) {}

    /**
     * devCode is only ever non-null when no email provider is configured (see
     * EmailService.isConfigured) — a local-dev convenience so the app can skip
     * straight to the new-password screen instead of the user hunting through
     * server logs. Once a real provider is configured this is always null, for
     * every email (registered or not), preserving forgot-password's existing
     * "can't enumerate accounts" property.
     */
    public record ForgotPasswordResponse(String devCode) {}

    public record ResetPasswordRequest(
            @Email @NotBlank String email,
            @NotBlank String code,
            @NotBlank @Size(min = 6, message = "password must be at least 6 characters") String newPassword
    ) {}

    public record VerifyEmailRequest(
            @Email @NotBlank String email,
            @NotBlank String code
    ) {}

    public record ResendVerificationRequest(
            @Email @NotBlank String email
    ) {}

    /**
     * devVerificationCode mirrors ForgotPasswordResponse.devCode: non-null only
     * when no email provider is configured, so the app can verify the account
     * automatically instead of stranding the user on an OTP screen for a code
     * that was never actually sent.
     */
    public record AuthResponse(
            String token,
            Long userId,
            String fullName,
            String email,
            Role role,
            String devVerificationCode
    ) {}
}
