package hu.sztibor.staffi.backend.dto.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateContractDto {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal hourlyRate;
    private String currency; // Optional, defaults to HUF
    private Integer workingHoursPerWeek; // Optional, defaults to 40
}

