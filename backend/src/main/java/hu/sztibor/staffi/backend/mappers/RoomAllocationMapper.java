package hu.sztibor.staffi.backend.mappers;

import hu.sztibor.staffi.backend.dto.room.RoomAllocationDto;
import hu.sztibor.staffi.backend.entities.RoomAllocation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoomAllocationMapper {

    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.user.firstName", target = "employeeName")
    RoomAllocationDto toDto(RoomAllocation allocation);
}

