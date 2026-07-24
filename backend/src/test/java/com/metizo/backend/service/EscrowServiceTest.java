package com.metizo.backend.service;

import com.metizo.backend.domain.EscrowStatus;
import com.metizo.backend.domain.EscrowTransaction;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.repository.EscrowTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EscrowServiceTest {

    @Mock
    EscrowTransactionRepository escrowRepository;

    @InjectMocks
    EscrowService escrowService;

    @BeforeEach
    void setUp() {
        // @Value field isn't injected in a plain unit test; set it manually.
        ReflectionTestUtils.setField(escrowService, "commissionRate", new BigDecimal("0.10"));
    }

    @Test
    void hold_locksFundsInHeldState() {
        User customer = User.builder().id(1L).build();
        User artisan = User.builder().id(2L).build();
        ServiceRequest sr = ServiceRequest.builder().id(10L).customer(customer).build();
        when(escrowRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        EscrowTransaction tx = escrowService.hold(sr, artisan, new BigDecimal("250"));

        assertThat(tx.getStatus()).isEqualTo(EscrowStatus.HELD);
        assertThat(tx.getAmount()).isEqualByComparingTo("250");
        assertThat(tx.getCustomer()).isEqualTo(customer);
        assertThat(tx.getArtisan()).isEqualTo(artisan);
    }

    @Test
    void release_deducts10PercentCommissionAndPaysArtisanTheRest() {
        EscrowTransaction tx = EscrowTransaction.builder()
                .amount(new BigDecimal("250"))
                .status(EscrowStatus.HELD)
                .build();
        when(escrowRepository.findByServiceRequestId(10L)).thenReturn(Optional.of(tx));

        EscrowTransaction released = escrowService.release(10L);

        assertThat(released.getStatus()).isEqualTo(EscrowStatus.RELEASED);
        assertThat(released.getCommission()).isEqualByComparingTo("25.00");
        assertThat(released.getArtisanPayout()).isEqualByComparingTo("225.00");
        assertThat(released.getSettledAt()).isNotNull();
    }

    @Test
    void release_failsWhenNotInHeldState() {
        EscrowTransaction tx = EscrowTransaction.builder()
                .amount(new BigDecimal("250"))
                .status(EscrowStatus.RELEASED)
                .build();
        when(escrowRepository.findByServiceRequestId(10L)).thenReturn(Optional.of(tx));

        assertThatThrownBy(() -> escrowService.release(10L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void refund_returnsFundsToCustomer() {
        EscrowTransaction tx = EscrowTransaction.builder()
                .amount(new BigDecimal("250"))
                .status(EscrowStatus.HELD)
                .build();
        when(escrowRepository.findByServiceRequestId(10L)).thenReturn(Optional.of(tx));

        EscrowTransaction refunded = escrowService.refund(10L);

        assertThat(refunded.getStatus()).isEqualTo(EscrowStatus.REFUNDED);
        assertThat(refunded.getSettledAt()).isNotNull();
    }
}
