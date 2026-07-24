package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.AuthDtos.AuthResponse;
import com.metizo.backend.dto.AuthDtos.ForgotPasswordRequest;
import com.metizo.backend.dto.AuthDtos.LoginRequest;
import com.metizo.backend.dto.AuthDtos.RegisterRequest;
import com.metizo.backend.dto.AuthDtos.ResetPasswordRequest;
import com.metizo.backend.dto.AuthDtos.VerifyEmailRequest;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.repository.UserRepository;
import com.metizo.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw new BadRequestException("Cannot self-register as ADMIN");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        User user = User.builder()
                .fullName(request.fullName())
                .email(request.email().toLowerCase())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .role(request.role())
                .build();

        if (request.role() == Role.ARTISAN) {
            ArtisanProfile profile = ArtisanProfile.builder()
                    .user(user)
                    .category(request.category())
                    .bio(request.bio())
                    .location(request.location())
                    .build();
            user.setArtisanProfile(profile);
        }

        user = userRepository.save(user);
        String devVerificationCode = sendVerificationCode(user);
        return buildAuthResponse(user, devVerificationCode);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password()));

        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        return buildAuthResponse(user, null);
    }

    /**
     * Generates and emails a 4-digit reset code, valid for 10 minutes. Silent
     * no-op for unknown emails (don't leak). Returns the raw code only when no
     * email provider is configured — see AuthDtos.ForgotPasswordResponse.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase()).orElse(null);
        if (user == null) {
            return null;
        }
        String code = String.valueOf(1000 + RANDOM.nextInt(9000));
        user.setResetCodeHash(passwordEncoder.encode(code));
        user.setResetCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        userRepository.save(user);
        emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code);
        return emailService.isConfigured() ? null : code;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));
        boolean codeValid = user.getResetCodeHash() != null
                && user.getResetCodeExpiresAt() != null
                && user.getResetCodeExpiresAt().isAfter(Instant.now())
                && passwordEncoder.matches(request.code(), user.getResetCodeHash());
        if (!codeValid) {
            throw new BadRequestException("Invalid or expired code");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setResetCodeHash(null);
        user.setResetCodeExpiresAt(null);
        userRepository.save(user);
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid or expired code"));
        boolean codeValid = user.getVerificationCodeHash() != null
                && user.getVerificationCodeExpiresAt() != null
                && user.getVerificationCodeExpiresAt().isAfter(Instant.now())
                && passwordEncoder.matches(request.code(), user.getVerificationCodeHash());
        if (!codeValid) {
            throw new BadRequestException("Invalid or expired code");
        }
        user.setEmailVerified(true);
        user.setVerificationCodeHash(null);
        user.setVerificationCodeExpiresAt(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email.toLowerCase()).orElse(null);
        if (user == null || user.isEmailVerified()) {
            return;
        }
        sendVerificationCode(user);
    }

    /** Returns the raw code only when no email provider is configured (see EmailService.isConfigured). */
    private String sendVerificationCode(User user) {
        String code = String.valueOf(1000 + RANDOM.nextInt(9000));
        user.setVerificationCodeHash(passwordEncoder.encode(code));
        user.setVerificationCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        userRepository.save(user);
        emailService.sendVerificationCode(user.getEmail(), user.getFullName(), code);
        return emailService.isConfigured() ? null : code;
    }

    private AuthResponse buildAuthResponse(User user, String devVerificationCode) {
        String token = jwtService.generateToken(
                user.getEmail(),
                Map.of("userId", user.getId(), "role", user.getRole().name()));
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole(), devVerificationCode);
    }
}
