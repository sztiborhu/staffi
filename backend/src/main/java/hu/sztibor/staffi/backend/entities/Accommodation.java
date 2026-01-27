package hu.sztibor.staffi.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "accommodations")
public class Accommodation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "manager_contact", length = 100)
    private String managerContact;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // One accommodation -> multiple rooms
    @OneToMany(mappedBy = "accommodation", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<Room> rooms;

    /**
     * Calculate total capacity dynamically from all rooms
     * This ensures the capacity is always accurate and up-to-date
     */
    @Transient
    public Integer getTotalCapacity() {
        if (rooms == null || rooms.isEmpty()) {
            return 0;
        }
        return rooms.stream()
                .mapToInt(Room::getCapacity)
                .sum();
    }
}
