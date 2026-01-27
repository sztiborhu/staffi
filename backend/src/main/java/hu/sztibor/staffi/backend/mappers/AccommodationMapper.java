package hu.sztibor.staffi.backend.mappers;

import hu.sztibor.staffi.backend.dto.accommodation.AccommodationDto;
import hu.sztibor.staffi.backend.entities.Accommodation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AccommodationMapper {

    AccommodationDto toDto(Accommodation accommodation);
}

