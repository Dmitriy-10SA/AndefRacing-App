package ru.andef.andefracing.backend.data.entities.club.hr;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Сотрудник
 *
 * @see EmployeeClub клуб - сотрудник - роль
 * @see Booking бронирования
 */
@Entity
@Table(name = "employee", schema = "hr")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "surname", nullable = false, length = 100)
    private String surname;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "patronymic", length = 100)
    private String patronymic;

    @Column(name = "phone", unique = true, nullable = false, length = 16)
    private String phone;

    @Column(name = "password")
    private String password;

    @Column(name = "need_password", nullable = false)
    @Setter
    private boolean needPassword;

    @Column(name = "is_blocked", nullable = false)
    @Setter
    private boolean isBlocked;

    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    private List<EmployeeClub> clubAndRoles = new ArrayList<>();

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "createdByEmployee", fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();

    /**
     * Создание сотрудника с заданием пароля им самим в дальнейшем
     */
    public Employee(String surname, String name, String patronymic, String phone) {
        this.surname = surname;
        this.name = name;
        this.patronymic = patronymic;
        this.phone = phone;
        this.password = null;
        this.needPassword = true;
        this.isBlocked = false;
    }

    /**
     * Добавление бронирования, которое было создано сотрудником
     */
    public Booking makeBooking(
            Club club,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            short cntEquipment,
            BigDecimal priceValue,
            String note
    ) {
        Booking booking = new Booking(club, startDateTime, endDateTime, cntEquipment, priceValue, this, note);
        bookings.add(booking);
        booking.setCreatedByEmployee(this);
        return booking;
    }

    /**
     * Подтверждение оплаты бронирования
     */
    public void confirmBookingPayment(Booking booking) {
        booking.confirmPay(this);
    }

    /**
     * Отмена бронирования
     */
    public void cancelBooking(Booking booking) {
        booking.cancel();
    }

    /**
     * Установка|изменение пароля сотрудника
     */
    public void setPassword(String password) {
        if (needPassword) {
            this.needPassword = false;
        }
        this.password = password;
    }

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy ?
                ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy ?
                ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Employee employee = (Employee) o;
        return Objects.equals(getId(), employee.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy ?
                ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
                : getClass().hashCode();
    }
}