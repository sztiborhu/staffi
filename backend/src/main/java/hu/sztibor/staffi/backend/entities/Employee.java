package hu.sztibor.staffi.backend.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One to One relationship with User
    @OneToOne(optional = false, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true)
    private User user;

    @Column(name = "tax_id", unique = true, length = 20)
    private String taxId;

    @Column(name = "taj_number", unique = true, length = 20)
    private String tajNumber;

    @Column(name = "id_card_number", unique = true, length = 20)
    private String idCardNumber;


    @Column(name = "primary_address", columnDefinition = "TEXT")
    private String primaryAddress;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "nationality", length = 50)
    private String nationality;

    @Column(name = "birth_date")
    private LocalDate birthDate;


    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "start_date")
    private LocalDate startDate;

    // 1 Employee -> Multiple contracts
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<Contract> contracts;

    // Kapcsolat a szobafoglalásokhoz (Egy dolgozó -> Több foglalás)
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RoomAllocation> roomAllocations;

    // One employee -> Multiple advance requests
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<AdvanceRequest> advanceRequests;
}
