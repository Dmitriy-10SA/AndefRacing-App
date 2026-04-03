package ru.andef.andefracing.backend.data.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.proxy.HibernateProxy;
import ru.andef.andefracing.backend.data.entities.club.Club;
import ru.andef.andefracing.backend.data.entities.club.booking.Booking;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Клиент
 *
 * @see Club клуб
 * @see Booking бронирование
 */
@Entity
@Table(name = "client", schema = "clients")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "name", nullable = false, length = 100)
    @Setter
    private String name;

    @Column(name = "phone", unique = true, nullable = false, length = 16)
    @Setter
    private String phone;

    @Column(name = "password", nullable = false)
    @Setter
    private String password;

    @Column(name = "is_blocked", nullable = false)
    @Setter
    private boolean isBlocked;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "client_favorite_club",
            schema = "favorite",
            joinColumns = @JoinColumn(name = "client_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "club_id", nullable = false)
    )
    private Set<Club> favoriteClubs = new HashSet<>();

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "client", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Booking> bookings = new ArrayList<>();

    /**
     * Регистрация клиента
     */
    public Client(String name, String phone, String password) {
        this.name = name;
        this.phone = phone;
        this.password = password;
        this.isBlocked = false;
    }

    /**
     * Сделать бронирование (с возвратом бронирования)
     */
    public Booking makeBooking(
            Club club,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            short cntEquipment,
            BigDecimal priceValue,
            String note
    ) {
        Booking booking = new Booking(club, this, startDateTime, endDateTime, cntEquipment, priceValue, note);
        bookings.add(booking);
        booking.setClient(this);
        return booking;
    }

    /**
     * Добавление клуба в список избранных
     */
    public void addFavoriteClub(Club club) {
        favoriteClubs.add(club);
    }

    /**
     * Удаление клуба из списка избранных
     */
    public boolean deleteFavoriteClub(Club club) {
        return favoriteClubs.remove(club);
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
        Client client = (Client) o;
        return Objects.equals(getId(), client.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy ?
                ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode()
                : getClass().hashCode();
    }
}