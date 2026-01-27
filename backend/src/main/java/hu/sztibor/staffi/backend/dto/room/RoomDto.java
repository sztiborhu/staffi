package hu.sztibor.staffi.backend.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomDto {
    private Long id;
    private String roomNumber;
    private Integer capacity;
    private Integer currentOccupancy;
    private List<Occupant> currentOccupants;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class Occupant {
        private Long allocationId;
        private Long employeeId;
        private String employeeName;
        private String companyName;
        private LocalDate checkInDate;
    }
}

