package hu.sztibor.staffi.backend.mappers;

import hu.sztibor.staffi.backend.dto.employee.EmployeeDto;
import hu.sztibor.staffi.backend.entities.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.firstName", target = "firstName")
    @Mapping(source = "user.lastName", target = "lastName")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.role", target = "role")
    @Mapping(source = "user.active", target = "isActive")
    @Mapping(target = "roomNumber", ignore = true) // Set manually in service
    EmployeeDto toEmployeeDto(Employee employee);
}





