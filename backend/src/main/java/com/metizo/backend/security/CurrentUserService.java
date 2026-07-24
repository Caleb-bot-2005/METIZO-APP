package com.metizo.backend.security;

import com.metizo.backend.domain.User;
import com.metizo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolves the {@link User} entity for the currently authenticated principal.
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BadCredentialsException("No authenticated user");
        }
        String email = auth.getName();
        // A well-signed token whose account no longer exists (e.g. deleted since
        // the token was issued) is an authentication failure, not a "not found"
        // business case — mapping it to 401 lets the app's own session-expiry
        // handling (which only reacts to 401) actually catch this and log the
        // device out, instead of silently leaving it stuck logged-in-but-broken.
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found: " + email));
    }
}
