package hu.sztibor.staffi.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserAuthProvider userAuthProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null) {
            String[] authElements = header.split(" ");

            if (authElements.length == 2 && "Bearer".equals(authElements[0])) {
                try {
                    var authentication = userAuthProvider.validateToken(authElements[1]);
                    // Only set authentication if token is valid (not null)
                    if (authentication != null) {
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (RuntimeException exception) {
                    SecurityContextHolder.clearContext();
                    throw exception;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
