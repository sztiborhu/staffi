package hu.sztibor.staffi.backend.dto.room;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomOccupantDto {
    private String name;
    private String phoneNumber;
    private String email;
}

