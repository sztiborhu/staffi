package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.DashboardStatsDto;
import hu.sztibor.staffi.backend.services.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Endpoints for dashboard statistics and overview")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard/stats
     * Get all dashboard statistics (employees, rooms, advances, etc.)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get dashboard statistics", description = "Retrieve all statistics for the dashboard home page")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        DashboardStatsDto stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}

