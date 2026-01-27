package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.AuditLog;
import hu.sztibor.staffi.backend.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    List<AuditLog> findByEntityType(String entityType);

    List<AuditLog> findByAction(AuditAction action);

    List<AuditLog> findByUserId(Long userId);

    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId);

    @Query("SELECT a FROM AuditLog a ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentLogs();

    Long countByAction(AuditAction action);
}

