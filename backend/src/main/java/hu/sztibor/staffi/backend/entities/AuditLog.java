package hu.sztibor.staffi.backend.entities;

import hu.sztibor.staffi.backend.enums.AuditAction;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_entity_type", columnList = "entity_type"),
        @Index(name = "idx_action", columnList = "action"),
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_entity_id", columnList = "entity_id")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType; // e.g., "Employee", "Contract", "User"

    @Column(name = "entity_id")
    private Long entityId; // ID of the affected entity

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private AuditAction action; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT

    @Column(name = "user_id")
    private Long userId; // Who performed the action

    @Column(name = "user_email", length = 255)
    private String userEmail; // Email of the user who performed the action

    @Column(name = "user_role", length = 50)
    private String userRole; // Role of the user (ADMIN, HR, EMPLOYEE)

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Human-readable description of what happened

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue; // JSON representation of old state (for UPDATE)

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue; // JSON representation of new state (for CREATE/UPDATE)

    @Column(name = "ip_address", length = 45)
    private String ipAddress; // IP address of the requester

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
}

