package hu.sztibor.staffi.backend.controllers;

import hu.sztibor.staffi.backend.dto.audit.AuditLogDto;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.services.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Endpoints for viewing audit logs and system activity")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * GET /api/audit-logs
     * Get audit logs with filters and pagination
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get audit logs", description = "Retrieve audit logs with optional filters (ADMIN only)")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @Parameter(description = "Filter by entity type (e.g., Employee, Contract)")
            @RequestParam(required = false) String entityType,

            @Parameter(description = "Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)")
            @RequestParam(required = false) AuditAction action,

            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) Long userId,

            @Parameter(description = "Filter by start date (ISO format: 2026-01-01T00:00:00)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,

            @Parameter(description = "Filter by end date (ISO format: 2026-01-31T23:59:59)")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<AuditLogDto> logs = auditLogService.getAuditLogs(
                entityType, action, userId, startDate, endDate, page, size
        );
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/audit-logs/entity/{entityType}/{entityId}
     * Get audit history for a specific entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get entity history", description = "Retrieve all audit logs for a specific entity (ADMIN only)")
    public ResponseEntity<List<AuditLogDto>> getEntityHistory(
            @Parameter(description = "Entity type (e.g., Employee, Contract)")
            @PathVariable String entityType,

            @Parameter(description = "Entity ID")
            @PathVariable Long entityId
    ) {
        List<AuditLogDto> history = auditLogService.getEntityHistory(entityType, entityId);
        return ResponseEntity.ok(history);
    }

    /**
     * GET /api/audit-logs/recent
     * Get recent audit logs
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent logs", description = "Retrieve the most recent audit logs (ADMIN only)")
    public ResponseEntity<List<AuditLogDto>> getRecentLogs(
            @Parameter(description = "Number of logs to retrieve")
            @RequestParam(defaultValue = "100") int limit
    ) {
        List<AuditLogDto> logs = auditLogService.getRecentLogs(limit);
        return ResponseEntity.ok(logs);
    }

    /**
     * GET /api/audit-logs/statistics
     * Get audit log statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get statistics", description = "Retrieve audit log statistics")
    public ResponseEntity<AuditLogService.AuditLogStatistics> getStatistics() {
        AuditLogService.AuditLogStatistics stats = auditLogService.getStatistics();
        return ResponseEntity.ok(stats);
    }
}

