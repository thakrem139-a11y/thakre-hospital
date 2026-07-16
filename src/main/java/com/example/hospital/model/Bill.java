package com.example.hospital.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
    
    private Double amount;
    private Double gstAmount;
    private Double totalAmount;
    private String services;
    private String status;
    private LocalDate billingDate;
    private String paymentMethod;
    private String transactionId;
    private LocalDate paymentDate;

    @jakarta.persistence.PrePersist
    @jakarta.persistence.PreUpdate
    public void calculateGstAndTotal() {
        if (this.amount != null) {
            if (this.gstAmount == null) {
                this.gstAmount = this.amount * 0.18;
            }
            if (this.totalAmount == null) {
                this.totalAmount = this.amount + this.gstAmount;
            }
        }
    }
}
