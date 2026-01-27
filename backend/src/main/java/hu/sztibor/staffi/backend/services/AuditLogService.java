package hu.sztibor.staffi.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import hu.sztibor.staffi.backend.dto.audit.AuditLogDto;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.AuditLog;
import hu.sztibor.staffi.backend.enums.AuditAction;
import hu.sztibor.staffi.backend.exceptions.AppException;
import hu.sztibor.staffi.backend.repositories.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    /**
     * Log an action
     */
    @Transactional
    public void logAction(String entityType, Long entityId, AuditAction action, String description, Object oldValue, Object newValue) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDto currentUser = null;

            if (authentication != null && authentication.getPrincipal() instanceof UserDto) {
                currentUser = (UserDto) authentication.getPrincipal();
            }

            String ipAddress = getClientIpAddress();

            AuditLog auditLog = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .userId(currentUser != null ? currentUser.getId() : null)
                    .userEmail(currentUser != null ? currentUser.getEmail() : "System")
                    .userRole(currentUser != null ? currentUser.getRole().name() : "SYSTEM")
                    .description(description)
                    .oldValue(oldValue != null ? toJson(oldValue) : null)
                    .newValue(newValue != null ? toJson(newValue) : null)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);

            log.info("Audit log created: {} {} on {} (ID: {}) by {}",
                     action, entityType, entityId,
                     currentUser != null ? currentUser.getEmail() : "System");
        } catch (Exception e) {
            log.error("Failed to create audit log: {}", e.getMessage());
        }
    }

    /**
     * Simplified log method without old/new values
     */
    public void logAction(String entityType, Long entityId, AuditAction action, String description) {
        logAction(entityType, entityId, action, description, null, null);
    }

    /**
     * Get audit logs with filters
     */
    public Page<AuditLogDto> getAuditLogs(
            String entityType,
            AuditAction action,
            Long userId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size) {

        Specification<AuditLog> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entityType != null && !entityType.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("entityType"), entityType));
            }

            if (action != null) {
                predicates.add(criteriaBuilder.equal(root.get("action"), action));
            }

            if (userId != null) {
                predicates.add(criteriaBuilder.equal(root.get("userId"), userId));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("timestamp"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("timestamp"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        Page<AuditLog> logs = auditLogRepository.findAll(spec, pageable);

        return logs.map(this::mapToDto);
    }

    /**
     * Get audit history for a specific entity
     */
    public List<AuditLogDto> getEntityHistory(String entityType, Long entityId) {
        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        return logs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Get recent audit logs (last 100)
     */
    public List<AuditLogDto> getRecentLogs(int limit) {
        Pageable pageable = PageRequest.of(0, limit, Sort.by("timestamp").descending());
        Page<AuditLog> logs = auditLogRepository.findAll(pageable);
        return logs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Get audit log statistics
     */
    public AuditLogStatistics getStatistics() {
        long totalLogs = auditLogRepository.count();
        long createActions = auditLogRepository.countByAction(AuditAction.CREATE);
        long updateActions = auditLogRepository.countByAction(AuditAction.UPDATE);
        long deleteActions = auditLogRepository.countByAction(AuditAction.DELETE);
        long loginActions = auditLogRepository.countByAction(AuditAction.LOGIN);

        return AuditLogStatistics.builder()
                .totalLogs(totalLogs)
                .createActions(createActions)
                .updateActions(updateActions)
                .deleteActions(deleteActions)
                .loginActions(loginActions)
                .build();
    }

    /**
     * Helper method to convert object to JSON
     */
    private String toJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            log.error("Failed to convert object to JSON: {}", e.getMessage());
            return object.toString();
        }
    }

    /**
     * Helper method to get client IP address
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Could not get IP address: {}", e.getMessage());
        }
        return "Unknown";
    }

    /**
     * Map AuditLog entity to DTO
     */
    private AuditLogDto mapToDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .action(log.getAction())
                .userId(log.getUserId())
                .userEmail(log.getUserEmail())
                .userRole(log.getUserRole())
                .description(log.getDescription())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }

    /**
     * Statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class AuditLogStatistics {
        private long totalLogs;
        private long createActions;
        private long updateActions;
        private long deleteActions;
        private long loginActions;
    }
}

