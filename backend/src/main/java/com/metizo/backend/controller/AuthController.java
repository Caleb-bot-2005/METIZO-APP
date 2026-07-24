package com.metizo.backend.controller;

import com.metizo.backend.dto.AuthDtos;
import com.metizo.backend.dto.AuthDtos.AuthResponse;
import com.metizo.backend.dto.AuthDtos.ForgotPasswordRequest;
import com.metizo.backend.dto.AuthDtos.LoginRequest;
import com.metizo.backend.dto.AuthDtos.RegisterRequest;
import com.metizo.backend.dto.AuthDtos.ResendVerificationRequest;
import com.metizo.backend.dto.AuthDtos.ResetPasswordRequest;
import com.metizo.backend.dto.AuthDtos.VerifyEmailRequest;
import com.metizo.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Always 200s regardless of whether the email exists, so callers can't enumerate accounts. */
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDtos.ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String devCode = authService.forgotPassword(request);
        return ResponseEntity.ok(new AuthDtos.ForgotPasswordResponse(devCode));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    /** Registration already emails a code (see AuthService.register); this checks it. */
    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
        return ResponseEntity.ok().build();
    }
}
