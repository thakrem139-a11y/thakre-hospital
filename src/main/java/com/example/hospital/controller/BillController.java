package com.example.hospital.controller;

import com.example.hospital.model.Bill;
import com.example.hospital.repository.BillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillRepository billRepository;

    @GetMapping
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public List<Bill> getBillsByPatientId(@PathVariable Long patientId) {
        return billRepository.findByPatientId(patientId);
    }

    @PostMapping
    public Bill createBill(@RequestBody Bill bill) {
        return billRepository.save(bill);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bill> updateBill(@PathVariable Long id, @RequestBody Bill billDetails) {
        return billRepository.findById(id)
                .map(bill -> {
                    bill.setPatient(billDetails.getPatient());
                    bill.setAmount(billDetails.getAmount());
                    bill.setGstAmount(billDetails.getGstAmount());
                    bill.setTotalAmount(billDetails.getTotalAmount());
                    bill.setServices(billDetails.getServices());
                    bill.setStatus(billDetails.getStatus());
                    bill.setBillingDate(billDetails.getBillingDate());
                    bill.setPaymentMethod(billDetails.getPaymentMethod());
                    bill.setTransactionId(billDetails.getTransactionId());
                    bill.setPaymentDate(billDetails.getPaymentDate());
                    return ResponseEntity.ok(billRepository.save(bill));
                }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(bill -> {
                    billRepository.delete(bill);
                    return ResponseEntity.ok().<Void>build();
                }).orElse(ResponseEntity.notFound().build());
    }
}
