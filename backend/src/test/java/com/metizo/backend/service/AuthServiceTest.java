package com.metizo.backend.service;

import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.AuthDtos.AuthResponse;
import com.metizo.backend.dto.AuthDtos.RegisterRequest;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.repository.UserRepository;
import com.metizo.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;

    @InjectMocks AuthService authService;

    @Test
    void cannotSelfRegisterAsAdmin() {
        RegisterRequest request = new RegisterRequest(
                "Bad Actor", "admin@test.com", "secret123", null, Role.ADMIN, null, null, null);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotRegisterWithAnExistingEmail() {
        when(userRepository.existsByEmail("taken@test.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest(
                "Ama", "taken@test.com", "secret123", null, Role.CUSTOMER, null, null, null);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registeringAnArtisanCreatesAProfileAndReturnsAToken() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(anyString(), anyMap())).thenReturn("jwt-token");

        RegisterRequest request = new RegisterRequest(
                "Kofi", "kofi@test.com", "secret123", "0240000000",
                Role.ARTISAN, "PLUMBING", "10 years experience", "Accra");

        AuthResponse response = authService.register(request);

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.role()).isEqualTo(Role.ARTISAN);

        // The saved user should carry an artisan profile.
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getArtisanProfile()).isNotNull();
        assertThat(captor.getValue().getPassword()).isEqualTo("hashed");
    }
}
