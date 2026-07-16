package com.example.hospital.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "lab_tests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LabTest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    private String testName;
    private String testType;     // BLOOD, URINE, XRAY, MRI, ECG, ULTRASOUND
    private String status;       // BOOKED, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED
    private LocalDate bookingDate;
    private LocalDate sampleDate;
    private LocalDate reportDate;
    private String result;
    private Double cost;
    private String notes;
}
