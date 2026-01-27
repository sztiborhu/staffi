package hu.sztibor.staffi.backend.services;

import hu.sztibor.staffi.backend.dto.advance.AdvanceRequestDto;
import hu.sztibor.staffi.backend.dto.advance.CreateAdvanceRequestDto;
import hu.sztibor.staffi.backend.dto.advance.ReviewAdvanceRequestDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.AdvanceRequest;
import hu.sztibor.staffi.backend.entities.Employee;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.AdvanceStatus;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.repositories.AdvanceRequestRepository;
import hu.sztibor.staffi.backend.repositories.EmployeeRepository;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdvanceRequestService {

    private final AdvanceRequestRepository advanceRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    /**
     * Employee creates an advance request
     */
    @Transactional
    public AdvanceRequestDto createAdvanceRequest(CreateAdvanceRequestDto dto) {
        UserDto currentUser = getCurrentUser();

        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException("Employee profile not found", HttpStatus.NOT_FOUND));

        if (dto.getAmount() == null || dto.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new AppException("Amount must be greater than zero", HttpStatus.BAD_REQUEST);
        }

        AdvanceRequest request = AdvanceRequest.builder()
                .employee(employee)
                .amount(dto.getAmount())
                .reason(dto.getReason())
                .status(AdvanceStatus.PENDING)
                .build();

        AdvanceRequest saved = advanceRequestRepository.save(request);

        log.info("Employee {} created advance request for amount {}",
                 employee.getUser().getEmail(), dto.getAmount());

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("id", saved.getId());
        newValueMap.put("employeeId", employee.getId());
        newValueMap.put("amount", saved.getAmount());
        newValueMap.put("reason", saved.getReason());
        newValueMap.put("status", saved.getStatus().name());
        newValueMap.put("requestDate", saved.getRequestDate());

        auditLogService.logAction(
            "AdvanceRequest",
            saved.getId(),
            AuditAction.CREATE,
            String.format("Employee %s %s created advance request for %s (reason: %s)",
                employee.getUser().getFirstName(),
                employee.getUser().getLastName(),
                dto.getAmount(),
                dto.getReason() != null ? dto.getReason() : "No reason provided"),
            null,
            newValueMap
        );

        return mapToDto(saved);
    }

    /**
     * Get current employee's advance request history
     */
    public List<AdvanceRequestDto> getMyHistory() {
        UserDto currentUser = getCurrentUser();

        Employee employee = employeeRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException("Employee profile not found", HttpStatus.NOT_FOUND));

        List<AdvanceRequest> requests = advanceRequestRepository.findByEmployeeId(employee.getId());

        return requests.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all advance requests (HR/Admin only) with optional status filter
     */
    public List<AdvanceRequestDto> getAllRequests(String status) {
        List<AdvanceRequest> requests;

        if (status != null && !status.isEmpty()) {
            try {
                AdvanceStatus advanceStatus = AdvanceStatus.valueOf(status.toUpperCase());
                requests = advanceRequestRepository.findByStatus(advanceStatus);
            } catch (IllegalArgumentException e) {
                throw new AppException("Invalid status: " + status, HttpStatus.BAD_REQUEST);
            }
        } else {
            requests = advanceRequestRepository.findAll();
        }

        return requests.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Review advance request (HR/Admin only)
     */
    @Transactional
    public AdvanceRequestDto reviewRequest(Long id, ReviewAdvanceRequestDto dto) {
        UserDto currentUser = getCurrentUser();
        User reviewer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        AdvanceRequest request = advanceRequestRepository.findById(id)
                .orElseThrow(() -> new AppException("Advance request not found", HttpStatus.NOT_FOUND));

        if (request.getStatus() != AdvanceStatus.PENDING) {
            throw new AppException("Advance request has already been reviewed", HttpStatus.BAD_REQUEST);
        }

        AdvanceStatus newStatus;
        try {
            newStatus = AdvanceStatus.valueOf(dto.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException("Invalid status. Use APPROVED or REJECTED", HttpStatus.BAD_REQUEST);
        }

        if (newStatus != AdvanceStatus.APPROVED && newStatus != AdvanceStatus.REJECTED) {
            throw new AppException("Status must be APPROVED or REJECTED", HttpStatus.BAD_REQUEST);
        }

        if (newStatus == AdvanceStatus.REJECTED &&
            (dto.getRejectionReason() == null || dto.getRejectionReason().trim().isEmpty())) {
            throw new AppException("Rejection reason is required when rejecting", HttpStatus.BAD_REQUEST);
        }

        request.setStatus(newStatus);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(LocalDateTime.now());

        if (newStatus == AdvanceStatus.REJECTED) {
            request.setRejectionReason(dto.getRejectionReason());
        }

        AdvanceRequest updated = advanceRequestRepository.save(request);

        log.info("User {} reviewed advance request {} with status {}",
                 reviewer.getEmail(), id, newStatus);

        java.util.Map<String, Object> oldValueMap = new java.util.HashMap<>();
        oldValueMap.put("status", "PENDING");
        oldValueMap.put("reviewedBy", null);
        oldValueMap.put("reviewedAt", null);

        java.util.Map<String, Object> newValueMap = new java.util.HashMap<>();
        newValueMap.put("status", updated.getStatus().name());
        newValueMap.put("reviewedBy", reviewer.getId());
        newValueMap.put("reviewedByName", reviewer.getFirstName() + " " + reviewer.getLastName());
        newValueMap.put("reviewedAt", updated.getReviewedAt());
        if (newStatus == AdvanceStatus.REJECTED) {
            newValueMap.put("rejectionReason", updated.getRejectionReason());
        }

        auditLogService.logAction(
            "AdvanceRequest",
            updated.getId(),
            AuditAction.UPDATE,
            String.format("%s %s %s advance request from %s %s for amount %s%s",
                reviewer.getFirstName(),
                reviewer.getLastName(),
                newStatus == AdvanceStatus.APPROVED ? "approved" : "rejected",
                request.getEmployee().getUser().getFirstName(),
                request.getEmployee().getUser().getLastName(),
                request.getAmount(),
                newStatus == AdvanceStatus.REJECTED ? " (reason: " + dto.getRejectionReason() + ")" : ""),
            oldValueMap,
            newValueMap
        );

        return mapToDto(updated);
    }

    /**
     * Map AdvanceRequest entity to DTO
     */
    private AdvanceRequestDto mapToDto(AdvanceRequest request) {
        return AdvanceRequestDto.builder()
                .id(request.getId())
                .employeeId(request.getEmployee().getId())
                .employeeName(request.getEmployee().getUser().getFirstName() + " " +
                             request.getEmployee().getUser().getLastName())
                .employeeEmail(request.getEmployee().getUser().getEmail())
                .amount(request.getAmount())
                .reason(request.getReason())
                .requestDate(request.getRequestDate())
                .status(request.getStatus())
                .reviewedById(request.getReviewedBy() != null ? request.getReviewedBy().getId() : null)
                .reviewedByName(request.getReviewedBy() != null ?
                               request.getReviewedBy().getFirstName() + " " +
                               request.getReviewedBy().getLastName() : null)
                .reviewedAt(request.getReviewedAt())
                .rejectionReason(request.getRejectionReason())
                .build();
    }

    /**
     * Get current authenticated user
     */
    private UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName().equals("anonymousUser")) {
            throw new AppException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        return (UserDto) authentication.getPrincipal();
    }
}

