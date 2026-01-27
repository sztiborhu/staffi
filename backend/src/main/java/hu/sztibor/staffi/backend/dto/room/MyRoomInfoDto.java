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
public class MyRoomInfoDto {
    private Long roomId;
    private String roomNumber;
    private String accommodationName;
    private String accommodationAddress;
    private Integer roomCapacity;
    private LocalDate checkInDate;
    private List<RoomOccupantDto> occupants;
}

