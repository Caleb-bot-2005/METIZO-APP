package com.metizo.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/** Sends transactional email via Resend's HTTP API (no SMTP setup needed). */
@Service
public class EmailService {

    private final String apiKey;
    private final String fromAddress;
    private final RestClient restClient = RestClient.create();

    public EmailService(
            @Value("${metizo.resend.api-key:}") String apiKey,
            @Value("${metizo.resend.from:METIZO <onboarding@resend.dev>}") String fromAddress) {
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetCode(String toEmail, String toName, String code) {
        if (!isConfigured()) {
            // No Resend key set — the code would otherwise vanish with nowhere for
            // a developer to read it during local testing. Printing it keeps the
            // forgot-password flow usable end-to-end without a real email account.
            System.out.println("[METIZO DEV] No RESEND_API_KEY configured — password reset code for " + toEmail + " is: " + code);
        }
        String html = "<p>Hi " + toName + ",</p>"
                + "<p>Your METIZO password reset code is:</p>"
                + "<h2 style=\"letter-spacing:4px;\">" + code + "</h2>"
                + "<p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>";
        send(toEmail, "Your METIZO password reset code", html);
    }

    public void sendVerificationCode(String toEmail, String toName, String code) {
        if (!isConfigured()) {
            System.out.println("[METIZO DEV] No RESEND_API_KEY configured — email verification code for " + toEmail + " is: " + code);
        }
        String html = "<p>Hi " + toName + ",</p>"
                + "<p>Welcome to METIZO! Your email verification code is:</p>"
                + "<h2 style=\"letter-spacing:4px;\">" + code + "</h2>"
                + "<p>This code expires in 10 minutes.</p>";
        send(toEmail, "Verify your METIZO email", html);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    private void send(String toEmail, String subject, String html) {
        if (!isConfigured()) {
            System.err.println("metizo.resend.api-key is not configured; cannot email " + toEmail);
            return;
        }

        Map<String, Object> body = Map.of(
                "from", fromAddress,
                "to", new String[]{toEmail},
                "subject", subject,
                "html", html);

        restClient.post()
                .uri("https://api.resend.com/emails")
                .headers(h -> h.setBearerAuth(apiKey))
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
