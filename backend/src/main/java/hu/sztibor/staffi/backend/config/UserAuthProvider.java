package hu.sztibor.staffi.backend.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import hu.sztibor.staffi.backend.dto.auth.UserDto;
import hu.sztibor.staffi.backend.entities.User;
import hu.sztibor.staffi.backend.enums.Role;
import hu.sztibor.staffi.backend.repositories.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Date;
import java.util.List;

@RequiredArgsConstructor
@Component
public class UserAuthProvider {
    @Value("${security.jwt.token.secret-key:secret-key}")
    private String secretKey;

    private final UserRepository userRepository;

    @PostConstruct
    protected void init() {
        secretKey = Base64.getEncoder().encodeToString(secretKey.getBytes());
    }

    public String createToken(UserDto dto) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + 3_600_000); // 1 hour

        return JWT.create()
                .withIssuer(dto.getEmail())
                .withIssuedAt(now)
                .withExpiresAt(validity)
                .withClaim("id", dto.getId())
                .withClaim("firstName", dto.getFirstName())
                .withClaim("lastName", dto.getLastName())
                .withClaim("role", dto.getRole().name())
                .sign(Algorithm.HMAC256(secretKey));
    }

    public Authentication validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(secretKey);
            JWTVerifier verifier = JWT.require(algorithm).build();
            DecodedJWT decoded = verifier.verify(token);

            Long userId = decoded.getClaim("id").asLong();
            String roleString = decoded.getClaim("role").asString();

            User userInDb = userRepository.findById(userId).orElse(null);
            if (userInDb == null || !userInDb.isActive()) {
                return null;
            }

            UserDto user = UserDto.builder()
                    .id(userId)
                    .email(decoded.getIssuer())
                    .firstName(decoded.getClaim("firstName").asString())
                    .lastName(decoded.getClaim("lastName").asString())
                    .role(Role.valueOf(roleString))
                    .build();

            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

            return new UsernamePasswordAuthenticationToken(user, null, List.of(authority));

        } catch (Exception e) {
            return null;
        }
    }
}
