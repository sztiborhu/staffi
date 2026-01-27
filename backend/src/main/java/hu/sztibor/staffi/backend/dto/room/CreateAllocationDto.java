package hu.sztibor.staffi.backend.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateAllocationDto {
    private Long roomId;
    private Long employeeId;
    private LocalDate checkInDate;
}

