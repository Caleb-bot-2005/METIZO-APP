package com.metizo.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.metizo.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

/**
 * Thin client for the Paystack Transactions API (initialize + verify). No SDK
 * dependency needed — just the JDK's HttpClient and the Jackson ObjectMapper
 * Spring Boot already pulls in.
 */
@Service
public class PaystackService {

    private static final String BASE_URL = "https://api.paystack.co";

    @Value("${metizo.paystack.secret-key}")
    private String secretKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record InitResult(String authorizationUrl, String accessCode, String reference) {}

    public record VerifyResult(boolean success, String status, long amountMinorUnits, String currency, String reference) {}

    /** Starts a hosted-checkout transaction. Amount is in the major currency unit (e.g. GHS, not pesewas). */
    public InitResult initializeTransaction(String email, BigDecimal amount, String reference, String callbackUrl) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new BadRequestException("Paystack is not configured on this server (missing secret key)");
        }
        long amountMinorUnits = amount.multiply(BigDecimal.valueOf(100)).longValueExact();
        Map<String, Object> body = Map.of(
                "email", email,
                "amount", amountMinorUnits,
                "reference", reference,
                "callback_url", callbackUrl
        );
        JsonNode root = send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/transaction/initialize"))
                .header("Authorization", "Bearer " + secretKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(writeJson(body))));

        if (!root.path("status").asBoolean(false)) {
            throw new BadRequestException("Paystack initialize failed: " + root.path("message").asText("unknown error"));
        }
        JsonNode data = root.path("data");
        return new InitResult(data.path("authorization_url").asText(), data.path("access_code").asText(), data.path("reference").asText());
    }

    public VerifyResult verifyTransaction(String reference) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new BadRequestException("Paystack is not configured on this server (missing secret key)");
        }
        JsonNode root = send(HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/transaction/verify/" + reference))
                .header("Authorization", "Bearer " + secretKey)
                .GET());

        JsonNode data = root.path("data");
        String status = data.path("status").asText("");
        return new VerifyResult(
                "success".equals(status),
                status,
                data.path("amount").asLong(0),
                data.path("currency").asText(""),
                data.path("reference").asText(reference)
        );
    }

    private JsonNode send(HttpRequest.Builder requestBuilder) {
        try {
            HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            return objectMapper.readTree(response.body());
        } catch (Exception e) {
            throw new BadRequestException("Could not reach Paystack: " + e.getMessage());
        }
    }

    private String writeJson(Object body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
