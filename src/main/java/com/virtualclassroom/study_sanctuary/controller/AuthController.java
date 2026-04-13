package com.virtualclassroom.study_sanctuary.controller;

import com.virtualclassroom.study_sanctuary.model.User;
import com.virtualclassroom.study_sanctuary.repository.UserRepository;
import com.virtualclassroom.study_sanctuary.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {

        if (user.getUsername() == null || user.getUsername().isEmpty()) {
            user.setUsername(user.getEmail().split("@")[0]);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        // 1. Find the user by email
        var userOptional = userRepository.findByEmail(email);

        // 2. Check if user exists AND password matches
        if (userOptional.isPresent() && passwordEncoder.matches(password, userOptional.get().getPassword())) {
            User user = userOptional.get();

            // 3. Generate the JWT token
            String token = jwtUtil.generateToken(email);

            // 4. Return success with a Map (matches ResponseEntity<?>)
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName() // Added this to match your Aura Study UI
            ));
        }

        // 5. Return error (matches ResponseEntity<?>)
        return ResponseEntity.status(401).body("Invalid credentials");
    }
}