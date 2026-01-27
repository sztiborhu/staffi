package hu.sztibor.staffi.backend.repositories;

import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findUserByEmail(String email);

    Long countByRoleAndIsActive(Role role, boolean isActive);
}
