package hu.sztibor.staffi.backend.entities;

import hu.sztibor.staffi.backend.enums.AdvanceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "advance_requests")
public class AdvanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multiple advanced requests -> one employee
    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    private Employee employee;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "request_date", updatable = false)
    private LocalDateTime requestDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private AdvanceStatus status = AdvanceStatus.PENDING;


    @ManyToOne
    @JoinColumn(name = "reviewed_by", referencedColumnName = "id")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}

