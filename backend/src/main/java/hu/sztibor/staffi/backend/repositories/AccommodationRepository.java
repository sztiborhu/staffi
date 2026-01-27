package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.Accommodation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccommodationRepository extends JpaRepository<Accommodation, Long> {
}

