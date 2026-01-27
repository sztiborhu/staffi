package hu.sztibor.staffi.backend.entities;

import hu.sztibor.staffi.backend.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multiple contracts -> One employee
    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    private Employee employee;

    @Column(name = "contract_number", unique = true, nullable = false)
    private String contractNumber;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "HUF";

    @Column(name = "working_hours_per_week")
    @Builder.Default
    private Integer workingHoursPerWeek = 40;

    @Column(name = "pdf_path")
    private String pdfPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

