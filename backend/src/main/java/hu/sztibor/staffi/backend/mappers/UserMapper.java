package hu.sztibor.staffi.backend.mappers;

import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "token", ignore = true)
    @Mapping(source = "active", target = "isActive")
    UserDto toUserDto(User user);
}
