package com.example.hospital.repository;
import com.example.hospital.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStaffId(Long staffId);
    List<Attendance> findByDate(LocalDate date);
    List<Attendance> findByDateBetween(LocalDate start, LocalDate end);
}
