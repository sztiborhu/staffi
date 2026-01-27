package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByAccommodationId(Long accommodationId);
}

