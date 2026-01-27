package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.advance.AdvanceRequestDto;
import hu.sztibor.staffi.backend.dto.advance.CreateAdvanceRequestDto;
import hu.sztibor.staffi.backend.dto.advance.ReviewAdvanceRequestDto;
import hu.sztibor.staffi.backend.services.AdvanceRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/advances")
@RequiredArgsConstructor
@Tag(name = "Advance Requests", description = "Endpoints for managing employee advance requests")
public class AdvanceController {

    private final AdvanceRequestService advanceRequestService;

    /**
     * POST /api/advances
     * Employee creates an advance request
     */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Create advance request", description = "Employee submits a new advance request")
    public ResponseEntity<AdvanceRequestDto> createAdvanceRequest(
            @RequestBody CreateAdvanceRequestDto createAdvanceRequestDto
    ) {
        AdvanceRequestDto created = advanceRequestService.createAdvanceRequest(createAdvanceRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/advances/my-history
     * Employee gets their own advance request history
     */
    @GetMapping("/my-history")
    @PreAuthorize("hasRole('EMPLOYEE')")
    @Operation(summary = "Get my advance history", description = "Retrieve the current employee's advance request history")
    public ResponseEntity<List<AdvanceRequestDto>> getMyHistory() {
        List<AdvanceRequestDto> history = advanceRequestService.getMyHistory();
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/advances
     * HR/Admin gets all advance requests with optional status filter
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get all advance requests", description = "Retrieve all advance requests (HR/Admin only) with optional status filter")
    public ResponseEntity<List<AdvanceRequestDto>> getAllRequests(
            @Parameter(description = "Filter by status (PENDING, APPROVED, REJECTED, PAID)")
            @RequestParam(required = false) String status
    ) {
        List<AdvanceRequestDto> requests = advanceRequestService.getAllRequests(status);
        return ResponseEntity.ok(requests);
    }

    /**
     * PUT /api/advances/{id}/review
     * HR/Admin reviews an advance request (approve or reject)
     */
    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Review advance request", description = "Approve or reject an advance request (HR/Admin only)")
    public ResponseEntity<AdvanceRequestDto> reviewRequest(
            @Parameter(description = "Advance Request ID")
            @PathVariable Long id,
            @RequestBody ReviewAdvanceRequestDto reviewDto
    ) {
        AdvanceRequestDto reviewed = advanceRequestService.reviewRequest(id, reviewDto);
        return ResponseEntity.ok(reviewed);
    }
}

