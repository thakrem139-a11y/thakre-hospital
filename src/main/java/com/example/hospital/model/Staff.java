package com.example.hospital.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String role;         // NURSE, RECEPTIONIST, ADMIN
    private String department;
    private String phone;
    private String email;
    private Double salary;
    private LocalDate joiningDate;
    private String status;       // ACTIVE, INACTIVE, ON_LEAVE
    private String shift;        // MORNING, EVENING, NIGHT
    private String qualification;
}
