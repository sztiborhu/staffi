package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.AdvanceRequest;
import hu.sztibor.staffi.backend.enums.AdvanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvanceRequestRepository extends JpaRepository<AdvanceRequest, Long> {

    List<AdvanceRequest> findByStatus(AdvanceStatus status);

    List<AdvanceRequest> findByEmployeeId(Long employeeId);

    Long countByStatus(AdvanceStatus status);
}

