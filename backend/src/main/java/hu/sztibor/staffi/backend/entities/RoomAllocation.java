package hu.sztibor.staffi.backend.entities;

import hu.sztibor.staffi.backend.enums.AllocationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "room_allocations")
public class RoomAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multiple allocations -> One room
    @ManyToOne(optional = false)
    @JoinColumn(name = "room_id", referencedColumnName = "id")
    private Room room;

    // Multiple allocations -> One employee
    @ManyToOne(optional = false)
    @JoinColumn(name = "employee_id", referencedColumnName = "id")
    private Employee employee;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date")
    private LocalDate checkOutDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private AllocationStatus status = AllocationStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

