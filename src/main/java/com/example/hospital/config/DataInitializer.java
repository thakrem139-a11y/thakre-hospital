package com.example.hospital.config;

import com.example.hospital.model.*;
import com.example.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private PatientRepository patientRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private BillRepository billRepository;
    @Autowired private BedRepository bedRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private LabTestRepository labTestRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private FeedbackRepository feedbackRepository;

    @Override
    public void run(String... args) throws Exception {
        if (doctorRepository.count() == 0) {
            // -- Doctors ------------------------------------------
            Doctor doc1 = doctorRepository.save(new Doctor(null, "Dr. Sarah Jenkins", "Cardiologist", "Cardiology", "+1-555-0199", "sarah.jenkins@hospital.com", "Mon-Wed-Fri 9AM-3PM", "female", null));
            Doctor doc2 = doctorRepository.save(new Doctor(null, "Dr. Robert Chen",   "Neurologist",  "Neurology",  "+1-555-0188", "robert.chen@hospital.com",   "Tue-Thu 10AM-4PM", "male", null));
            Doctor doc3 = doctorRepository.save(new Doctor(null, "Dr. Emily Taylor",  "Pediatrician", "Pediatrics", "+1-555-0177", "emily.taylor@hospital.com",   "Mon-Thu 8AM-2PM", "female", null));
            Doctor doc4 = doctorRepository.save(new Doctor(null, "Dr. James Anderson","General Physician","General Medicine","+1-555-0166","james.anderson@hospital.com","Mon-Fri 9AM-5PM", "male", null));

            // -- Patients -----------------------------------------
            Patient p1 = patientRepository.save(new Patient(null,"John Doe",45,"Male","+1-555-0211","john.doe@email.com","123 Elm St, Springfield","Hypertension, Mild Asthma"));
            Patient p2 = patientRepository.save(new Patient(null,"Jane Smith",29,"Female","+1-555-0222","jane.smith@email.com","456 Oak St, Springfield","None"));
            Patient p3 = patientRepository.save(new Patient(null,"Alice Johnson",8,"Female","+1-555-0233","parents.johnson@email.com","789 Pine St, Springfield","Seasonal Allergies"));
            Patient p4 = patientRepository.save(new Patient(null,"Bob Williams",62,"Male","+1-555-0244","bob.williams@email.com","321 Maple St, Springfield","Type 2 Diabetes"));

            // -- Appointments --------------------------------------
            appointmentRepository.save(new Appointment(null,p1,doc1,LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0),"SCHEDULED","Chest tightness and mild breathlessness"));
            appointmentRepository.save(new Appointment(null,p2,doc2,LocalDateTime.now().plusDays(3).withHour(14).withMinute(30).withSecond(0).withNano(0),"SCHEDULED","Frequent severe migraines"));
            appointmentRepository.save(new Appointment(null,p3,doc3,LocalDateTime.now().minusDays(1).withHour(9).withMinute(15).withSecond(0).withNano(0),"COMPLETED","Routine Pediatric Checkup"));
            appointmentRepository.save(new Appointment(null,p4,doc4,LocalDateTime.now().plusHours(4).withMinute(0).withSecond(0).withNano(0),"SCHEDULED","Follow-up blood sugar review"));

            // -- Bills ---------------------------------------------
            Bill b1 = new Bill(); b1.setPatient(p1); b1.setAmount(2500.0); b1.setServices("Cardiology Consultation, ECG"); b1.setStatus("UNPAID"); b1.setBillingDate(LocalDate.now());
            Bill b2 = new Bill(); b2.setPatient(p3); b2.setAmount(1200.0); b2.setServices("Pediatric Consultation"); b2.setStatus("PAID"); b2.setBillingDate(LocalDate.now().minusDays(1)); b2.setPaymentMethod("UPI"); b2.setTransactionId("TXN982189281"); b2.setPaymentDate(LocalDate.now().minusDays(1));
            Bill b3 = new Bill(); b3.setPatient(p2); b3.setAmount(15000.0); b3.setServices("Neurology Consultation, MRI Brain scan"); b3.setStatus("UNPAID"); b3.setBillingDate(LocalDate.now());
            Bill b4 = new Bill(); b4.setPatient(p4); b4.setAmount(850.0); b4.setServices("General Consultation, Blood Glucose Test"); b4.setStatus("PAID"); b4.setBillingDate(LocalDate.now().minusDays(3)); b4.setPaymentMethod("CASH"); b4.setTransactionId("CSH082390"); b4.setPaymentDate(LocalDate.now().minusDays(3));
            billRepository.save(b1); billRepository.save(b2); billRepository.save(b3); billRepository.save(b4);

            // -- Beds ----------------------------------------------
            bedRepository.save(new Bed(null,"101-A","General Ward","AVAILABLE",1200.0,null));
            bedRepository.save(new Bed(null,"101-B","General Ward","OCCUPIED",1200.0,p1));
            bedRepository.save(new Bed(null,"102-A","Semi-Private","AVAILABLE",2200.0,null));
            bedRepository.save(new Bed(null,"201-ICU","ICU","OCCUPIED",6000.0,p4));
            bedRepository.save(new Bed(null,"202-ICU","ICU","MAINTENANCE",6000.0,null));
            bedRepository.save(new Bed(null,"301-DELUXE","Deluxe Room","AVAILABLE",10000.0,null));
            bedRepository.save(new Bed(null,"102-B","Semi-Private","AVAILABLE",2200.0,null));
            bedRepository.save(new Bed(null,"103-A","General Ward","AVAILABLE",1200.0,null));
            bedRepository.save(new Bed(null,"203-ICU","ICU","AVAILABLE",6000.0,null));
            bedRepository.save(new Bed(null,"302-DELUXE","Deluxe Room","AVAILABLE",10000.0,null));

            // -- Departments ---------------------------------------
            departmentRepository.save(new Department(null,"Cardiology","Dr. Sarah Jenkins","Floor 2, Wing A","+91-712-2001","Heart disease, ECG, Echo",20,15,"ACTIVE","Mon-Sat 8AM-6PM"));
            departmentRepository.save(new Department(null,"Neurology","Dr. Robert Chen","Floor 3, Wing B","+91-712-2002","Brain & nervous system",15,10,"ACTIVE","Mon-Fri 9AM-5PM"));
            departmentRepository.save(new Department(null,"Pediatrics","Dr. Emily Taylor","Floor 1, Wing C","+91-712-2003","Child healthcare",12,8,"ACTIVE","Mon-Thu 8AM-2PM"));
            departmentRepository.save(new Department(null,"General Medicine","Dr. James Anderson","Ground Floor","+91-712-2004","OPD, general consultations",25,20,"ACTIVE","Mon-Fri 9AM-5PM"));
            departmentRepository.save(new Department(null,"Emergency","Dr. Ravi Mehta","Ground Floor, ER","+91-712-2005","24x7 emergency care",10,30,"ACTIVE","24x7"));
            departmentRepository.save(new Department(null,"Radiology","Dr. Priya Sharma","Basement","+91-712-2006","X-Ray, MRI, CT, Ultrasound",5,12,"ACTIVE","Mon-Sat 7AM-9PM"));

            // -- Staff ---------------------------------------------
            staffRepository.save(new Staff(null,"Sunita Pawar","NURSE","Cardiology","+91-9876543210","sunita.pawar@hospital.com",28000.0,LocalDate.of(2022,3,15),"ACTIVE","MORNING","B.Sc Nursing"));
            staffRepository.save(new Staff(null,"Rekha Deshmukh","NURSE","Pediatrics","+91-9876543211","rekha.d@hospital.com",27500.0,LocalDate.of(2021,8,1),"ACTIVE","EVENING","GNM"));
            staffRepository.save(new Staff(null,"Pooja Kadam","NURSE","ICU","+91-9876543212","pooja.k@hospital.com",32000.0,LocalDate.of(2020,5,20),"ACTIVE","NIGHT","B.Sc Nursing, ICU Cert."));
            staffRepository.save(new Staff(null,"Anita Rane","NURSE","General Medicine","+91-9876543213","anita.r@hospital.com",26000.0,LocalDate.of(2023,1,10),"ACTIVE","MORNING","GNM"));
            staffRepository.save(new Staff(null,"Meena Joshi","RECEPTIONIST","OPD","+91-9876543220","meena.j@hospital.com",22000.0,LocalDate.of(2021,6,5),"ACTIVE","MORNING","B.Com"));
            staffRepository.save(new Staff(null,"Kavita Shinde","RECEPTIONIST","Emergency","+91-9876543221","kavita.s@hospital.com",22500.0,LocalDate.of(2022,9,12),"ACTIVE","EVENING","BA"));
            staffRepository.save(new Staff(null,"Rahul Patil","ADMIN","Admin Office","+91-9876543230","rahul.p@hospital.com",35000.0,LocalDate.of(2019,4,1),"ACTIVE","MORNING","MBA Healthcare"));
            staffRepository.save(new Staff(null,"Priya Kulkarni","ADMIN","Finance","+91-9876543231","priya.k@hospital.com",38000.0,LocalDate.of(2018,11,15),"ACTIVE","MORNING","B.Com, MBA"));

            // -- Lab Tests -----------------------------------------
            labTestRepository.save(new LabTest(null,p1,"Complete Blood Count","BLOOD","COMPLETED",LocalDate.now().minusDays(5),LocalDate.now().minusDays(5),LocalDate.now().minusDays(3),"Normal - all parameters within range",450.0,"Fasting required"));
            labTestRepository.save(new LabTest(null,p1,"ECG","ECG","COMPLETED",LocalDate.now().minusDays(2),LocalDate.now().minusDays(2),LocalDate.now().minusDays(1),"Mild tachycardia noted",300.0,null));
            labTestRepository.save(new LabTest(null,p2,"MRI Brain","MRI","IN_PROGRESS",LocalDate.now().minusDays(1),LocalDate.now(),null,null,3500.0,"Contrast MRI"));
            labTestRepository.save(new LabTest(null,p3,"Urine Routine","URINE","COMPLETED",LocalDate.now().minusDays(3),LocalDate.now().minusDays(3),LocalDate.now().minusDays(2),"No abnormalities detected",200.0,null));
            labTestRepository.save(new LabTest(null,p4,"Blood Glucose (Fasting)","BLOOD","COMPLETED",LocalDate.now().minusDays(1),LocalDate.now().minusDays(1),LocalDate.now(),"FBS: 142 mg/dL (High)",250.0,"Fasting 8 hrs"));
            labTestRepository.save(new LabTest(null,p4,"HbA1c","BLOOD","BOOKED",LocalDate.now(),null,null,null,650.0,null));

            // -- Attendance ----------------------------------------
            if (staffRepository.count() > 0) {
                var staffList = staffRepository.findAll();
                attendanceRepository.save(new Attendance(null, staffList.get(0), LocalDate.now(), "09:00", "17:00", "PRESENT", "On time"));
                attendanceRepository.save(new Attendance(null, staffList.get(1), LocalDate.now(), "08:30", "16:30", "PRESENT", "Shift early"));
                attendanceRepository.save(new Attendance(null, staffList.get(4), LocalDate.now(), "09:15", "17:15", "PRESENT", "Late 15 mins"));
                attendanceRepository.save(new Attendance(null, staffList.get(6), LocalDate.now(), null, null, "LEAVE", "Casual leave approved"));
            }

            // -- Feedback ------------------------------------------
            feedbackRepository.save(new Feedback(null,"Rajesh Kumar","rajesh@email.com",5,"DOCTOR","Dr. Jenkins was absolutely wonderful. Very thorough and caring.",LocalDateTime.now().minusDays(2),false));
            feedbackRepository.save(new Feedback(null,"Priya Nair","priya@email.com",4,"FACILITY","The hospital is clean and well-maintained. Waiting time could be improved.",LocalDateTime.now().minusDays(1),false));
            feedbackRepository.save(new Feedback(null,"Amit Shah","amit@email.com",3,"BILLING","Billing process took long. Staff were helpful though.",LocalDateTime.now(),false));
        }
    }
}
