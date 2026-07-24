package com.metizo.backend.service;

import com.metizo.backend.domain.Bid;
import com.metizo.backend.domain.BidStatus;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.BidDtos;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.repository.BidRepository;
import com.metizo.backend.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BidServiceTest {

    @Mock BidRepository bidRepository;
    @Mock ServiceRequestService serviceRequestService;
    @Mock EscrowService escrowService;
    @Mock CurrentUserService currentUserService;

    @InjectMocks BidService bidService;

    private final BidDtos.CreateRequest sampleBid =
            new BidDtos.CreateRequest(new BigDecimal("100"), "1 day", "I can help");

    @Test
    void customerCannotPlaceBid() {
        User customer = User.builder().id(1L).role(Role.CUSTOMER).build();
        when(currentUserService.require()).thenReturn(customer);

        assertThatThrownBy(() -> bidService.placeBid(5L, sampleBid))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotBidOnRequestThatIsNotOpen() {
        User artisan = User.builder().id(2L).role(Role.ARTISAN).build();
        ServiceRequest sr = ServiceRequest.builder().id(5L).status(RequestStatus.ASSIGNED).build();
        when(currentUserService.require()).thenReturn(artisan);
        when(serviceRequestService.getEntity(5L)).thenReturn(sr);

        assertThatThrownBy(() -> bidService.placeBid(5L, sampleBid))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotBidTwiceOnSameRequest() {
        User artisan = User.builder().id(2L).role(Role.ARTISAN).build();
        ServiceRequest sr = ServiceRequest.builder().id(5L).status(RequestStatus.OPEN).build();
        when(currentUserService.require()).thenReturn(artisan);
        when(serviceRequestService.getEntity(5L)).thenReturn(sr);
        when(bidRepository.existsByServiceRequestIdAndArtisanId(5L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> bidService.placeBid(5L, sampleBid))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void acceptingABid_assignsArtisan_rejectsOtherBids_andHoldsEscrow() {
        User customer = User.builder().id(1L).role(Role.CUSTOMER).build();
        User winner = User.builder().id(2L).role(Role.ARTISAN).fullName("Winner").build();
        User loser = User.builder().id(3L).role(Role.ARTISAN).fullName("Loser").build();

        ServiceRequest sr = ServiceRequest.builder()
                .id(10L).customer(customer).status(RequestStatus.OPEN).build();
        Bid winning = Bid.builder()
                .id(100L).serviceRequest(sr).artisan(winner)
                .amount(new BigDecimal("250")).status(BidStatus.PENDING).build();
        Bid other = Bid.builder()
                .id(101L).serviceRequest(sr).artisan(loser)
                .amount(new BigDecimal("300")).status(BidStatus.PENDING).build();

        when(bidRepository.findById(100L)).thenReturn(Optional.of(winning));
        when(currentUserService.require()).thenReturn(customer);
        when(bidRepository.findByServiceRequestIdOrderByAmountAsc(10L))
                .thenReturn(List.of(winning, other));

        bidService.acceptBid(100L, null);

        assertThat(winning.getStatus()).isEqualTo(BidStatus.ACCEPTED);
        assertThat(other.getStatus()).isEqualTo(BidStatus.REJECTED);
        assertThat(sr.getStatus()).isEqualTo(RequestStatus.ASSIGNED);
        assertThat(sr.getAssignedArtisan()).isEqualTo(winner);
        assertThat(sr.getAgreedAmount()).isEqualByComparingTo("250");
        verify(escrowService).hold(eq(sr), eq(winner), any());
    }

    @Test
    void onlyOwningCustomerCanAcceptABid() {
        User owner = User.builder().id(1L).role(Role.CUSTOMER).build();
        User stranger = User.builder().id(9L).role(Role.CUSTOMER).build();
        ServiceRequest sr = ServiceRequest.builder()
                .id(10L).customer(owner).status(RequestStatus.OPEN).build();
        Bid bid = Bid.builder().id(100L).serviceRequest(sr)
                .amount(new BigDecimal("250")).status(BidStatus.PENDING).build();

        when(bidRepository.findById(100L)).thenReturn(Optional.of(bid));
        when(currentUserService.require()).thenReturn(stranger);

        assertThatThrownBy(() -> bidService.acceptBid(100L, null))
                .isInstanceOf(BadRequestException.class);
    }
}
