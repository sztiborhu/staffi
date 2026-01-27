package hu.sztibor.staffi.backend.dto.contract;

import hu.sztibor.staffi.backend.enums.ContractStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ContractDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String contractNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal hourlyRate;
    private String currency;
    private Integer workingHoursPerWeek;
    private String pdfPath;
    private ContractStatus status;
    private LocalDateTime createdAt;
}

