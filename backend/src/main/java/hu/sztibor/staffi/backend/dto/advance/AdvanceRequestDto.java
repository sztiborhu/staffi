package hu.sztibor.staffi.backend.dto.advance;

import hu.sztibor.staffi.backend.enums.AdvanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvanceRequestDto {
    private Long id;

    private Long employeeId;
    private String employeeName;
    private String employeeEmail;

    private BigDecimal amount;
    private String reason;
    private LocalDateTime requestDate;

    private AdvanceStatus status;

    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
}

