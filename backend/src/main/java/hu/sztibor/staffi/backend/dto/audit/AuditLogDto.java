package hu.sztibor.staffi.backend.dto.audit;

import hu.sztibor.staffi.backend.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLogDto {
    private Long id;
    private String entityType;
    private Long entityId;
    private AuditAction action;
    private Long userId;
    private String userEmail;
    private String userRole;
    private String description;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private LocalDateTime timestamp;
}

