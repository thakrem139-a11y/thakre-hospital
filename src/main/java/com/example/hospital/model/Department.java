package com.example.hospital.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String head;
    private String location;
    private String phone;
    private String description;
    private Integer totalBeds;
    private Integer totalStaff;
    private String status;       // ACTIVE, UNDER_MAINTENANCE
    private String operatingHours;
}
