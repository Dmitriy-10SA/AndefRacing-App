package ru.andef.andefracing.backend.data.entities.club.booking;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.type.PostgreSQLEnumJdbcType;
import org.hibernate.proxy.HibernateProxy;
import ru.andef.andefracing.backend.data.entities.Client;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.hr.Employee;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Бронирование (может быть сделано клиентом онлайн или сотрудником непосредственно в клубе)
 *
 * @see Club клуб
 * @see Client клиент
 * @see BookingStatus статус бронирования
 * @see Employee сотрудник
 */
@Entity
@Table(name = "booking", schema = "bookings")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    @Setter
    private Client client;

    @Column(name = "start_datetime", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "end_datetime", nullable = false)
    private LocalDateTime endDateTime;

    @Column(name = "cnt_equipment", nullable = false)
    private short cntEquipment;

    @Column(name = "price_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceValue;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "status", nullable = false)
    private BookingStatus status;

    @Column(name = "is_walk_in", nullable = false)
    private boolean isWalkIn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_employee_id")
    @Setter
    private Employee createdByEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pay_confirmed_by_employee_id")
    @Setter
    private Employee payConfirmedByEmployee;

    @Column(name = "note")
    private String note;

    /**
     * Бронирование, созданное клиентом
     */
    public Booking(
            Club club,
            Client client,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            short cntEquipment,
            BigDecimal priceValue,
            String note
    ) {
        this.club = club;
        this.client = client;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.cntEquipment = cntEquipment;
        this.priceValue = priceValue;
        this.status = BookingStatus.PENDING_PAYMENT;
        this.isWalkIn = false;
        this.createdByEmployee = null;
        this.note = note;
        this.payConfirmedByEmployee = null;
    }

    /**
     * Бронирование, созданное сотрудником
     */
    public Booking(
            Club club,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            short cntEquipment,
            BigDecimal priceValue,
            Employee employee,
            String note
    ) {
        this.club = club;
        this.client = null;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.cntEquipment = cntEquipment;
        this.priceValue = priceValue;
        this.status = BookingStatus.PENDING_PAYMENT;
        this.isWalkIn = true;
        this.createdByEmployee = employee;
        this.payConfirmedByEmployee = null;
        this.note = note;
    }

    /**
     * Подтверждение оплаты бронирования
     */
    public void confirmPay(Employee employee) {
        this.status = BookingStatus.PAID;
        this.payConfirmedByEmployee = employee;
    }

    /**
     * Отмена бронирования
     */
    public void cancel() {
        this.status = BookingStatus.CANCELLED;
        this.payConfirmedByEmployee = null;
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
        Booking booking = (Booking) o;
        return Objects.equals(getId(), booking.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy ?
                ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
                : getClass().hashCode();
    }
}