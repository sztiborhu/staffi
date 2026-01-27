package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.RoomAllocation;
import hu.sztibor.staffi.backend.enums.AllocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomAllocationRepository extends JpaRepository<RoomAllocation, Long> {

    List<RoomAllocation> findByRoomIdAndStatus(Long roomId, AllocationStatus status);

    List<RoomAllocation> findByEmployeeIdAndStatus(Long employeeId, AllocationStatus status);

    List<RoomAllocation> findByRoomId(Long roomId);

    List<RoomAllocation> findByEmployeeIdOrderByCheckInDateDesc(Long employeeId);

    Long countByStatus(AllocationStatus status);
}

