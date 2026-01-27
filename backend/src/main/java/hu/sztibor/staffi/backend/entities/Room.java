package hu.sztibor.staffi.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "rooms", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"accommodation_id", "room_number"})
})
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Multiple rooms -> One accommodation
    @ManyToOne(optional = false)
    @JoinColumn(name = "accommodation_id", referencedColumnName = "id")
    private Accommodation accommodation;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    // One room -> Multiple allocations
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RoomAllocation> allocations;
}

