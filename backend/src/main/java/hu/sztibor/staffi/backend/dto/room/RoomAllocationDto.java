package hu.sztibor.staffi.backend.dto.room;

import hu.sztibor.staffi.backend.enums.AllocationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomAllocationDto {
    private Long id;
    private Long roomId;
    private String roomNumber;
    private Long employeeId;
    private String employeeName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private AllocationStatus status;
}

