package com.example.hospital.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private Integer rating;      // 1-5
    private String category;     // DOCTOR, NURSE, FACILITY, BILLING, GENERAL
    private String message;
    private LocalDateTime submittedAt;
    private Boolean resolved;
}
