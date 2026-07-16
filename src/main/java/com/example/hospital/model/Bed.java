package com.example.hospital.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "beds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bedNumber;

    @Column(nullable = false)
    private String roomType; // e.g., "ICU", "General Ward", "Semi-Private", "Deluxe Room"

    @Column(nullable = false)
    private String status; // "AVAILABLE", "OCCUPIED", "MAINTENANCE"

    @Column(nullable = false)
    private Double pricePerDay;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient; // Null if AVAILABLE or MAINTENANCE
}
